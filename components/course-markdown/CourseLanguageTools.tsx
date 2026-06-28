"use client";

import { useState } from "react";
import { ArrowRightLeft, BookOpen, Check, Copy, Languages, LoaderCircle, PanelRightClose, RotateCcw, Search } from "lucide-react";

import { useDictionary } from "@/components/dictionary/dictionary-context";
import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Textarea } from "@/components/ui-v2/textarea";
import type { ResembleEntry } from "@/lib/vocabulary/content";

type TranslationDirection = "en-to-zh" | "zh-to-en";
type PendingAction = "synonyms" | "translate" | null;

type CourseLanguageToolsProps = {
  expanded: boolean;
  showCollapsed: boolean;
  onExpandedChange: (expanded: boolean) => void;
};

function getApiError(payload: { code?: string; message?: string }) {
  if (payload.code === "AI_DAILY_LIMIT_REACHED") return "今日 AI 翻译额度已用完。";
  if (payload.code === "AI_MONTHLY_LIMIT_REACHED") return "本月 AI 翻译额度已用完。";
  if (payload.code === "AI_LIMIT_RECORD_NOT_FOUND") return "当前账号没有可用的 AI 额度记录。";
  return payload.message || "请求失败，请稍后重试。";
}

export default function CourseLanguageTools({ expanded, showCollapsed, onExpandedChange }: CourseLanguageToolsProps) {
  const { openDictionary } = useDictionary();
  const [text, setText] = useState("");
  const [direction, setDirection] = useState<TranslationDirection>("en-to-zh");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [synonyms, setSynonyms] = useState<ResembleEntry[]>([]);
  const [translation, setTranslation] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function clearResults() {
    setSynonyms([]);
    setTranslation("");
    setError("");
    setCopied(false);
  }

  function clearAll() {
    setText("");
    clearResults();
  }

  function lookupWord() {
    const word = text.trim();
    setError("");

    if (!/^[A-Za-z][A-Za-z'-]*$/.test(word)) {
      setError("查词请输入一个英文单词。短语或句子请使用翻译。 ");
      return;
    }

    openDictionary(word);
  }

  async function findSynonyms() {
    const query = text.trim();
    if (!query) return;

    setPendingAction("synonyms");
    setError("");
    setTranslation("");

    try {
      const response = await fetch(`/api/vocabulary/resemble?q=${encodeURIComponent(query)}`);
      const payload = (await response.json()) as { ok?: boolean; message?: string; results?: ResembleEntry[] };

      if (!response.ok) throw new Error(payload.message || "近义词检索失败。");
      setSynonyms(payload.results ?? []);
      if ((payload.results ?? []).length === 0) setError("现有近义词辨析词库中没有找到匹配内容。");
    } catch (requestError) {
      setSynonyms([]);
      setError(requestError instanceof Error ? requestError.message : "近义词检索失败。");
    } finally {
      setPendingAction(null);
    }
  }

  async function translate() {
    const sourceText = text.trim();
    if (!sourceText) return;

    setPendingAction("translate");
    setError("");
    setSynonyms([]);
    setCopied(false);

    try {
      const response = await fetch("/api/course-tools/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sourceText, direction }),
      });
      const payload = (await response.json()) as { ok?: boolean; code?: string; message?: string; translation?: string };

      if (!response.ok || !payload.translation) throw new Error(getApiError(payload));
      setTranslation(payload.translation);
    } catch (requestError) {
      setTranslation("");
      setError(requestError instanceof Error ? requestError.message : "翻译失败，请稍后重试。");
    } finally {
      setPendingAction(null);
    }
  }

  async function copyTranslation() {
    if (!translation) return;

    try {
      await navigator.clipboard.writeText(translation);
      setCopied(true);
    } catch {
      setError("复制失败，请手动选择翻译结果。");
    }
  }

  if (!expanded) {
    return showCollapsed ? <button type="button" onClick={() => onExpandedChange(true)} className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] text-[var(--primary)] shadow-[var(--shadow-lg)] transition hover:bg-[var(--bg-soft)]" aria-label="展开语言学习工具" title="语言学习工具"><Languages size={19} /></button> : null;
  }

  return (
    <div className="fixed bottom-4 right-3 z-50 max-h-[82vh] w-[calc(100vw-1.5rem)] max-w-[380px] overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-lg)] sm:bottom-auto sm:top-1/2 sm:w-[360px] sm:-translate-y-1/2">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div><div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]"><Languages size={17} className="text-[var(--primary)]" />语言学习工具</div><p className="mt-1 text-xs text-[var(--text-faint)]">查词、近义词辨析与双向翻译</p></div>
        <button type="button" onClick={() => onExpandedChange(false)} className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-soft)] transition hover:bg-[var(--bg-soft)] hover:text-[var(--text)]" aria-label="折叠语言学习工具" title="折叠"><PanelRightClose size={17} /></button>
      </div>

      <Textarea value={text} onChange={(event) => { setText(event.target.value); clearResults(); }} maxLength={5000} placeholder="输入英文单词、英文句子或中文内容..." className="mt-4 min-h-[170px] resize-y" />
      <div className="mt-1 text-right text-[11px] text-[var(--text-faint)]">{text.length} / 5000</div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={lookupWord} disabled={!text.trim()} className="gap-1.5 px-2"><BookOpen size={15} />查词</Button>
        <Button type="button" size="sm" variant="secondary" onClick={findSynonyms} disabled={!text.trim() || pendingAction !== null} className="gap-1.5 px-2">{pendingAction === "synonyms" ? <LoaderCircle size={15} className="animate-spin" /> : <Search size={15} />}辨析</Button>
        <Button type="button" size="sm" onClick={translate} disabled={!text.trim() || pendingAction !== null} className="gap-1.5 px-2">{pendingAction === "translate" ? <LoaderCircle size={15} className="animate-spin" /> : <ArrowRightLeft size={15} />}翻译</Button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] p-1">
        <button type="button" onClick={() => setDirection("en-to-zh")} className={`h-8 flex-1 rounded-[var(--radius-xs)] text-xs font-semibold transition ${direction === "en-to-zh" ? "bg-[var(--card)] text-[var(--primary)] shadow-[var(--shadow-sm)]" : "text-[var(--text-soft)]"}`}>英译汉</button>
        <button type="button" onClick={() => setDirection("zh-to-en")} className={`h-8 flex-1 rounded-[var(--radius-xs)] text-xs font-semibold transition ${direction === "zh-to-en" ? "bg-[var(--card)] text-[var(--primary)] shadow-[var(--shadow-sm)]" : "text-[var(--text-soft)]"}`}>汉译英</button>
      </div>
      <p className="mt-2 text-[11px] leading-5 text-[var(--text-faint)]">每次 AI 翻译会计入一次现有 AI 使用额度。</p>

      {error ? <div className="mt-3 rounded-[var(--radius-sm)] border border-[var(--danger)]/25 bg-[var(--danger-soft)] px-3 py-2 text-xs leading-5 text-[var(--danger)]">{error}</div> : null}

      {translation ? (
        <section className="mt-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-3">
          <div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold uppercase text-[var(--text-faint)]">翻译结果</span><button type="button" onClick={copyTranslation} className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)]">{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "已复制" : "复制"}</button></div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--text)]">{translation}</p>
        </section>
      ) : null}

      {synonyms.length > 0 ? (
        <section className="mt-4 space-y-3">
          <div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase text-[var(--text-faint)]">近义词辨析</span><Badge variant="secondary">{synonyms.length} 组</Badge></div>
          {synonyms.map((entry) => (
            <div key={entry.id} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-3">
              <div className="flex flex-wrap gap-1.5">{entry.terms.map((term) => <Badge key={term}>{term}</Badge>)}</div>
              {entry.summary ? <p className="mt-2 text-xs leading-6 text-[var(--text-soft)]">{entry.summary}</p> : null}
              <div className="mt-2 space-y-2">{entry.definitions.slice(0, 4).map((item) => <div key={`${entry.id}-${item.term}`}><span className="text-xs font-semibold text-[var(--text)]">{item.term}</span><p className="mt-0.5 text-xs leading-5 text-[var(--text-soft)]">{item.explanation}</p></div>)}</div>
            </div>
          ))}
        </section>
      ) : null}

      <button type="button" onClick={clearAll} disabled={!text && !translation && synonyms.length === 0} className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] text-xs font-semibold text-[var(--text-soft)] transition hover:bg-[var(--bg-soft)] disabled:cursor-not-allowed disabled:opacity-40"><RotateCcw size={14} />清空</button>
    </div>
  );
}
