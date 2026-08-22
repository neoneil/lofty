"use client";

import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BookCopy,
  Check,
  ChevronRight,
  FileCheck2,
  ImagePlus,
  LoaderCircle,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { ChangeEvent, useMemo, useRef, useState } from "react";

import { BookPreview } from "@/components/admin/book-builder/book-preview";
import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Input } from "@/components/ui-v2/input";
import type {
  BookBuilderExam,
  BookBuilderStudent,
  BookCatalogItem,
  BookPreviewDocument,
  SelectedBookContent,
} from "@/lib/book-builder/types";

type SelectedByExam = Record<BookBuilderExam, SelectedBookContent[]>;

function defaultTitle(exam: BookBuilderExam) {
  return `小马哥教育 - ${exam.toUpperCase()}`;
}

function groupCatalog(items: BookCatalogItem[]) {
  const groups = new Map<string, BookCatalogItem[]>();
  for (const item of items) groups.set(item.group, [...(groups.get(item.group) ?? []), item]);
  return [...groups.entries()];
}

function getFileDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("读取封面图片失败"));
    reader.readAsDataURL(file);
  });
}

export function BookBuilderClient({ catalog, students }: { catalog: BookCatalogItem[]; students: BookBuilderStudent[] }) {
  const [exam, setExam] = useState<BookBuilderExam>("ielts");
  const [titles, setTitles] = useState<Record<BookBuilderExam, string>>({ ielts: defaultTitle("ielts"), pte: defaultTitle("pte") });
  const [subtitles, setSubtitles] = useState<Record<BookBuilderExam, string>>({ ielts: "个人专属 IELTS 备考资料", pte: "个人专属 PTE 备考资料" });
  const [selectedByExam, setSelectedByExam] = useState<SelectedByExam>({ ielts: [], pte: [] });
  const [studentId, setStudentId] = useState("");
  const [includeAnswers, setIncludeAnswers] = useState(true);
  const [search, setSearch] = useState("");
  const [coverDataUrl, setCoverDataUrl] = useState<string | null>(null);
  const [coverName, setCoverName] = useState("");
  const [preview, setPreview] = useState<BookPreviewDocument | null>(null);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const selected = selectedByExam[exam];
  const selectedIds = useMemo(() => new Set(selected.map((item) => item.id)), [selected]);
  const filteredCatalog = useMemo(() => {
    const term = search.trim().toLowerCase();
    return catalog.filter((item) => item.exam === exam && (!term || `${item.title} ${item.group} ${item.description} ${item.badge}`.toLowerCase().includes(term)));
  }, [catalog, exam, search]);
  const catalogGroups = useMemo(() => groupCatalog(filteredCatalog), [filteredCatalog]);
  const selectedStudent = students.find((student) => student.id === studentId) ?? null;

  function updateSelected(updater: (items: SelectedBookContent[]) => SelectedBookContent[]) {
    setSelectedByExam((current) => ({ ...current, [exam]: updater(current[exam]) }));
  }

  function toggleItem(item: BookCatalogItem) {
    updateSelected((items) => items.some((selectedItem) => selectedItem.id === item.id)
      ? items.filter((selectedItem) => selectedItem.id !== item.id)
      : [...items, { id: item.id, title: item.title }]);
  }

  function addGroup(items: BookCatalogItem[]) {
    updateSelected((current) => {
      const ids = new Set(current.map((item) => item.id));
      return [...current, ...items.filter((item) => !ids.has(item.id)).map((item) => ({ id: item.id, title: item.title }))];
    });
  }

  function moveItem(index: number, direction: -1 | 1) {
    updateSelected((items) => {
      const target = index + direction;
      if (target < 0 || target >= items.length) return items;
      const next = [...items];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleCover(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("封面必须是图片文件");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("封面图片不能超过 2 MB");
      return;
    }
    try {
      setCoverDataUrl(await getFileDataUrl(file));
      setCoverName(file.name);
    } catch (coverError) {
      setError(coverError instanceof Error ? coverError.message : "读取封面图片失败");
    }
  }

  async function generatePreview() {
    setError("");
    if (selected.length === 0) {
      setError("请先从内容库选择至少一项内容");
      return;
    }
    setIsGenerating(true);
    try {
      const response = await fetch("/api/admin/book-builder/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exam,
          title: titles[exam],
          subtitle: subtitles[exam],
          studentId: studentId || null,
          coverDataUrl,
          includeAnswers,
          contents: selected,
        }),
      });
      const result = await response.json() as { ok: boolean; document?: BookPreviewDocument; error?: string };
      if (!response.ok || !result.ok || !result.document) throw new Error(result.error || "生成预览失败");
      setPreview(result.document);
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : "生成预览失败");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-6 text-[var(--text)] sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-soft)] transition hover:text-[var(--primary)]"><ArrowLeft size={16} />返回管理中心</Link>

        <header className="mt-5 border-b border-[var(--border)] pb-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2"><Badge variant="secondary">Book Studio</Badge><Badge variant="outline">Admin</Badge></div>
              <h1 className="mt-3 text-2xl font-semibold text-[var(--text)] sm:text-3xl">一键成书</h1>
              <p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">组合静态 Cambridge 题库、PTE 当前题库与动态授课笔记，生成带学生账户、封面、目录和章节排版的 A4 书籍。</p>
            </div>
            <div className="flex w-fit rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-1 shadow-[var(--shadow-sm)]" aria-label="考试类型">
              {(["ielts", "pte"] as const).map((item) => <button key={item} type="button" onClick={() => { setExam(item); setSearch(""); setError(""); }} className={`h-10 min-w-24 rounded-[var(--radius-sm)] px-4 text-sm font-semibold transition ${exam === item ? "bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]" : "text-[var(--text-soft)] hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"}`}>{item.toUpperCase()}</button>)}
            </div>
          </div>
        </header>

        <div className="mt-6 grid gap-5 xl:grid-cols-[310px_minmax(0,1fr)_360px]">
          <aside className="space-y-5 xl:sticky xl:top-5 xl:self-start">
            <section className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
              <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]"><BookCopy size={18} /></span><div><h2 className="text-sm font-semibold">书籍设置</h2><p className="text-xs text-[var(--text-faint)]">封面与版本信息</p></div></div>
              <div className="mt-5 space-y-4">
                <label className="block"><span className="mb-1.5 block text-xs font-semibold text-[var(--text-soft)]">书名</span><Input value={titles[exam]} maxLength={120} onChange={(event) => setTitles((current) => ({ ...current, [exam]: event.target.value }))} /></label>
                <label className="block"><span className="mb-1.5 block text-xs font-semibold text-[var(--text-soft)]">副标题</span><Input value={subtitles[exam]} maxLength={180} onChange={(event) => setSubtitles((current) => ({ ...current, [exam]: event.target.value }))} /></label>
                <label className="block"><span className="mb-1.5 block text-xs font-semibold text-[var(--text-soft)]">对应学生账户</span><select value={studentId} onChange={(event) => setStudentId(event.target.value)} className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)]"><option value="">通用版本（不绑定学生）</option>{students.map((student) => <option key={student.id} value={student.id}>{student.name}{student.email ? ` · ${student.email}` : ""}</option>)}</select></label>
              </div>
            </section>

            <section className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
              <div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-semibold">封面图片</h2><p className="mt-1 text-xs text-[var(--text-faint)]">JPG / PNG，最大 2 MB</p></div><ImagePlus size={18} className="text-[var(--primary)]" /></div>
              <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCover} className="hidden" />
              {coverDataUrl ? (
                <div className="mt-4 overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverDataUrl} alt="封面预览" className="aspect-[3/4] w-full object-cover" />
                  <div className="flex items-center justify-between gap-2 border-t border-[var(--border)] p-2.5"><span className="min-w-0 truncate text-xs text-[var(--text-soft)]">{coverName}</span><button type="button" onClick={() => { setCoverDataUrl(null); setCoverName(""); if (coverInputRef.current) coverInputRef.current.value = ""; }} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-soft)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]" title="移除封面" aria-label="移除封面"><X size={15} /></button></div>
                </div>
              ) : <button type="button" onClick={() => coverInputRef.current?.click()} className="mt-4 flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-[var(--radius-md)] border border-dashed border-[var(--border-strong)] bg-[var(--bg-soft)] text-sm font-semibold text-[var(--text-soft)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"><Upload size={20} />上传封面</button>}
              {coverDataUrl ? <Button type="button" variant="secondary" size="sm" fullWidth className="mt-3 gap-2" onClick={() => coverInputRef.current?.click()}><ImagePlus size={15} />更换封面</Button> : null}
            </section>

            <label className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)]">
              <input type="checkbox" checked={includeAnswers} onChange={(event) => setIncludeAnswers(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--primary)]" />
              <span><strong className="block text-sm text-[var(--text)]">附带答案与范文</strong><small className="mt-1 block text-xs leading-5 text-[var(--text-faint)]">IELTS 加入答案解析和写作范文；PTE 加入当前可用参考答案。</small></span>
            </label>
          </aside>

          <section className="min-w-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="text-lg font-semibold">内容库</h2><p className="mt-1 text-sm text-[var(--text-soft)]">选择内容后才会按需读取完整题目，初始页面不加载大文本。</p></div>
              <Badge variant="outline">{filteredCatalog.length} items</Badge>
            </div>
            <div className="relative mt-4"><Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索 Cambridge、题型或授课笔记" className="pl-10" /></div>

            <div className="mt-6 space-y-7">
              {catalogGroups.map(([group, items]) => (
                <section key={group}>
                  <div className="mb-3 flex items-center justify-between gap-3 border-b border-[var(--border)] pb-2"><div><h3 className="text-sm font-semibold text-[var(--text)]">{group}</h3><p className="mt-0.5 text-xs text-[var(--text-faint)]">{items.length} 项可选内容</p></div><button type="button" onClick={() => addGroup(items)} className="text-xs font-semibold text-[var(--primary)] hover:underline">全部加入</button></div>
                  <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                    {items.map((item) => {
                      const active = selectedIds.has(item.id);
                      return (
                        <button key={item.id} type="button" onClick={() => toggleItem(item)} aria-pressed={active} className={`group min-h-[148px] rounded-[var(--radius-md)] border p-4 text-left shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] ${active ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/45"}`}>
                          <div className="flex items-center justify-between gap-3"><Badge variant={active ? "default" : "secondary"}>{item.badge}</Badge><span className={`flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] border ${active ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-[var(--bg-soft)] text-transparent"}`}><Check size={15} /></span></div>
                          <h4 className="mt-3 text-sm font-semibold leading-5 text-[var(--text)]">{item.title}</h4>
                          <p className="mt-2 line-clamp-3 text-xs leading-5 text-[var(--text-soft)]">{item.description}</p>
                          <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-[var(--text-faint)]"><span>{item.kind === "pte-question-bank" ? "DATABASE · ON DEMAND" : "STATIC / MARKDOWN"}</span>{item.itemCount !== null ? <span>{item.itemCount}</span> : null}</div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
              {catalogGroups.length === 0 ? <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--card)] px-5 py-12 text-center text-sm text-[var(--text-soft)]">没有匹配的内容。</div> : null}
            </div>
          </section>

          <aside className="xl:sticky xl:top-5 xl:self-start">
            <section className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
              <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] p-5"><div><h2 className="text-sm font-semibold">目录编辑</h2><p className="mt-1 text-xs text-[var(--text-faint)]">可改标题与调整顺序</p></div><Badge variant="secondary">{selected.length}</Badge></div>
              <div className="max-h-[52vh] space-y-3 overflow-y-auto p-4">
                {selected.map((item, index) => (
                  <div key={item.id} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-3">
                    <div className="flex items-center gap-2"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--card)] text-xs font-bold text-[var(--primary)] shadow-[var(--shadow-sm)]">{index + 1}</span><Input value={item.title} maxLength={140} onChange={(event) => updateSelected((items) => items.map((current) => current.id === item.id ? { ...current, title: event.target.value } : current))} className="h-9 px-3 text-xs" /></div>
                    <div className="mt-2 flex items-center justify-end gap-1"><button type="button" onClick={() => moveItem(index, -1)} disabled={index === 0} className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-soft)] hover:bg-[var(--card)] hover:text-[var(--primary)] disabled:opacity-30" title="上移" aria-label="上移"><ArrowUp size={14} /></button><button type="button" onClick={() => moveItem(index, 1)} disabled={index === selected.length - 1} className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-soft)] hover:bg-[var(--card)] hover:text-[var(--primary)] disabled:opacity-30" title="下移" aria-label="下移"><ArrowDown size={14} /></button><button type="button" onClick={() => updateSelected((items) => items.filter((current) => current.id !== item.id))} className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-soft)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]" title="移除" aria-label="移除"><Trash2 size={14} /></button></div>
                  </div>
                ))}
                {selected.length === 0 ? <div className="flex min-h-44 flex-col items-center justify-center gap-3 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] px-5 text-center"><BookCopy size={24} className="text-[var(--text-faint)]" /><p className="text-sm font-semibold text-[var(--text-soft)]">尚未选择内容</p><p className="text-xs leading-5 text-[var(--text-faint)]">从中间内容库加入题库或授课笔记。</p></div> : null}
              </div>
              <div className="border-t border-[var(--border)] p-4">
                <div className="mb-4 rounded-[var(--radius-md)] bg-[var(--bg-soft)] p-3 text-xs leading-5 text-[var(--text-soft)]"><div className="flex justify-between gap-3"><span>版本</span><strong>{exam.toUpperCase()}</strong></div><div className="mt-1 flex justify-between gap-3"><span>学生</span><strong className="max-w-48 truncate">{selectedStudent?.name || "通用版本"}</strong></div><div className="mt-1 flex justify-between gap-3"><span>答案</span><strong>{includeAnswers ? "包含" : "不包含"}</strong></div></div>
                {error ? <div role="alert" className="mb-3 rounded-[var(--radius-md)] border border-[var(--danger)]/35 bg-[var(--danger-soft)] px-3 py-2.5 text-xs leading-5 text-[var(--danger)]">{error}</div> : null}
                <Button type="button" fullWidth size="lg" disabled={isGenerating || selected.length === 0} onClick={generatePreview} className="gap-2">{isGenerating ? <><LoaderCircle size={17} className="animate-spin" />正在编排书籍</> : <><FileCheck2 size={17} />生成并预览 PDF<ChevronRight size={16} /></>}</Button>
                <p className="mt-3 text-center text-[11px] leading-5 text-[var(--text-faint)]">预览后使用“打印 / 保存 PDF”导出。音频不会进入书籍。</p>
              </div>
            </section>
          </aside>
        </div>
      </div>
      {preview ? <BookPreview document={preview} onClose={() => setPreview(null)} /> : null}
    </main>
  );
}
