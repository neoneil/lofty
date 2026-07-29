"use client";

import { useMemo, useState } from "react";
import { Database, Plus, RotateCcw, Save, Search, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Input } from "@/components/ui-v2/input";
import { Textarea } from "@/components/ui-v2/textarea";
import type { AiPromptRecord } from "@/lib/ai-prompts/types";

type Props = {
  initialPrompts: AiPromptRecord[];
  tableReady: boolean;
};

type Draft = {
  id: string;
  title: string;
  category: string;
  scope: "system" | "user" | "input";
  description: string;
  content: string;
};

function toDraft(prompt: AiPromptRecord): Draft {
  return {
    id: prompt.id,
    title: prompt.title,
    category: prompt.category,
    scope: prompt.scope,
    description: prompt.description,
    content: prompt.content,
  };
}

function createEmptyDraft(): Draft {
  return {
    id: "",
    title: "",
    category: "Custom",
    scope: "user",
    description: "",
    content: "",
  };
}

export function AiPromptsClient({ initialPrompts, tableReady: initialTableReady }: Props) {
  const [prompts, setPrompts] = useState(initialPrompts);
  const [tableReady, setTableReady] = useState(initialTableReady);
  const [selectedId, setSelectedId] = useState(initialPrompts[0]?.id ?? "");
  const [draft, setDraft] = useState<Draft>(initialPrompts[0] ? toDraft(initialPrompts[0]) : createEmptyDraft());
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const categories = useMemo(() => ["All", ...Array.from(new Set(prompts.map((prompt) => prompt.category))).sort()], [prompts]);
  const selectedPrompt = prompts.find((prompt) => prompt.id === selectedId) ?? null;
  const filteredPrompts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return prompts.filter((prompt) => {
      const matchesCategory = category === "All" || prompt.category === category;
      const matchesQuery = !normalizedQuery || `${prompt.id} ${prompt.title} ${prompt.description} ${prompt.category}`.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, prompts, query]);

  function selectPrompt(prompt: AiPromptRecord) {
    setSelectedId(prompt.id);
    setDraft(toDraft(prompt));
    setMessage("");
  }

  function startNewPrompt() {
    setSelectedId("");
    setDraft(createEmptyDraft());
    setMessage("");
  }

  async function refreshPrompts(nextSelectedId?: string) {
    const response = await fetch("/api/admin/ai-prompts", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.message || "Prompt 列表刷新失败");
    setPrompts(data.prompts ?? []);
    setTableReady(Boolean(data.tableReady));
    const id = nextSelectedId || selectedId || data.prompts?.[0]?.id;
    const nextPrompt = (data.prompts ?? []).find((prompt: AiPromptRecord) => prompt.id === id) ?? data.prompts?.[0];
    if (nextPrompt) {
      setSelectedId(nextPrompt.id);
      setDraft(toDraft(nextPrompt));
    }
  }

  async function savePrompt() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/ai-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || "保存失败");
      setMessage("已更新。新的 AI 请求会读取这个版本。");
      await refreshPrompts(data.prompt?.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function seedDefaults() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/ai-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed-defaults" }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || "同步失败");
      setPrompts(data.prompts ?? []);
      setTableReady(Boolean(data.tableReady));
      setMessage(data.message || "默认 prompt 已同步到数据库。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "同步失败");
    } finally {
      setSaving(false);
    }
  }

  function resetToDefault() {
    if (!selectedPrompt) return;
    setDraft({ ...toDraft(selectedPrompt), content: selectedPrompt.defaultContent });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[var(--text)]">Prompt Library</h2>
              <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">{filteredPrompts.length} visible · {prompts.length} total</p>
            </div>
            <Button type="button" size="sm" variant="secondary" onClick={startNewPrompt} className="gap-2"><Plus size={15} />新增</Button>
          </div>
          <label className="mt-4 flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-2">
            <Search size={16} className="text-[var(--text-faint)]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search prompt..." className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-faint)]" />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            {categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${category === item ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text-soft)] hover:text-[var(--text)]"}`}>{item}</button>)}
          </div>
        </div>

        <div className="max-h-[680px] space-y-2 overflow-y-auto pr-1">
          {filteredPrompts.map((prompt) => (
            <button key={prompt.id} type="button" onClick={() => selectPrompt(prompt)} className={`w-full rounded-[var(--radius-md)] border p-3 text-left shadow-[var(--shadow-sm)] transition ${selectedId === prompt.id ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/40 hover:bg-[var(--card-hover)]"}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[var(--text)]">{prompt.title}</p>
                  <p className="mt-1 truncate font-mono text-[11px] text-[var(--text-faint)]">{prompt.id}</p>
                </div>
                <Badge variant={prompt.source === "database" ? "success" : "secondary"}>{prompt.source === "database" ? "DB" : "Default"}</Badge>
              </div>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--text-soft)]">{prompt.description}</p>
            </button>
          ))}
        </div>
      </aside>

      <section className="space-y-4">
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-[var(--text)]">数据库同步</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--text-soft)]">第一次创建 `ai_prompts` 表后，点击这里把代码默认 prompt 写入 Supabase。</p>
            </div>
            <Button type="button" onClick={seedDefaults} disabled={saving} className="gap-2 sm:min-w-56"><Database size={16} />同步默认 Prompt 到数据库</Button>
          </div>
        </div>

        {!tableReady ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--warning)]/30 bg-[var(--warning-soft)] p-4 text-sm leading-6 text-[var(--warning)]">
            Supabase 表 `ai_prompts` 还没有创建。页面正在显示代码默认 prompt；执行 migration SQL 后点击“同步默认到数据库”。
          </div>
        ) : null}

        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)] sm:p-5">
          <div className="flex flex-col gap-3 border-b border-[var(--border)] pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary)] text-white"><Sparkles size={18} /></span>
              <div>
                <h2 className="text-lg font-bold text-[var(--text)]">{draft.title || "New AI Prompt"}</h2>
                <p className="mt-1 font-mono text-xs text-[var(--text-faint)]">{draft.id || "choose.a.prompt.id"}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedPrompt ? <Button type="button" variant="secondary" size="sm" onClick={resetToDefault} disabled={saving} className="gap-2"><RotateCcw size={15} />恢复默认内容</Button> : null}
              <Button type="button" size="sm" onClick={savePrompt} disabled={saving || !draft.id.trim() || !draft.content.trim()} className="gap-2"><Save size={15} />{saving ? "Saving..." : "Update"}</Button>
            </div>
          </div>

          {message ? <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-2 text-sm font-semibold text-[var(--text-soft)]">{message}</div> : null}

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block"><span className="mb-2 block text-sm font-semibold text-[var(--text)]">Prompt ID</span><Input value={draft.id} disabled={Boolean(selectedPrompt && !selectedPrompt.isCustom)} onChange={(event) => setDraft((current) => ({ ...current, id: event.target.value }))} placeholder="ielts.speaking.part1.system" /></label>
            <label className="block"><span className="mb-2 block text-sm font-semibold text-[var(--text)]">Title</span><Input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="AI prompt title" /></label>
            <label className="block"><span className="mb-2 block text-sm font-semibold text-[var(--text)]">Category</span><Input value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))} placeholder="IELTS Speaking" /></label>
            <label className="block"><span className="mb-2 block text-sm font-semibold text-[var(--text)]">Scope</span><select value={draft.scope} onChange={(event) => setDraft((current) => ({ ...current, scope: event.target.value as Draft["scope"] }))} className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"><option value="system">system</option><option value="user">user</option><option value="input">input</option></select></label>
          </div>

          <label className="mt-4 block"><span className="mb-2 block text-sm font-semibold text-[var(--text)]">Description</span><Input value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} placeholder="这个 prompt 用在哪里，做什么。" /></label>

          <label className="mt-4 block"><span className="mb-2 block text-sm font-semibold text-[var(--text)]">Prompt Content</span><Textarea value={draft.content} onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))} className="min-h-[520px] font-mono text-xs leading-6" placeholder="Write prompt here..." /></label>
        </div>

        {selectedPrompt ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <InfoPanel title="Variables" items={selectedPrompt.variables.map((item) => `${item.name}: ${item.description}`)} empty="这个 prompt 没有登记变量。" />
            <InfoPanel title="Used By" items={selectedPrompt.usedBy} empty="自定义 prompt 暂未绑定业务代码。" />
          </div>
        ) : null}
      </section>
    </div>
  );
}

function InfoPanel({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)]">
      <h3 className="text-sm font-bold text-[var(--text)]">{title}</h3>
      {items.length ? <div className="mt-3 space-y-2">{items.map((item) => <p key={item} className="rounded-[var(--radius-sm)] bg-[var(--bg-soft)] px-3 py-2 font-mono text-xs leading-5 text-[var(--text-soft)]">{item}</p>)}</div> : <p className="mt-3 rounded-[var(--radius-sm)] border border-dashed border-[var(--border)] px-3 py-4 text-center text-sm text-[var(--text-soft)]">{empty}</p>}
    </div>
  );
}
