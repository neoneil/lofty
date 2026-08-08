"use client";

import { useMemo, useState } from "react";
import { BookOpen, ChevronRight, Grid3X3, Images, Loader2, Pencil, Save, Search, X } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Card, CardContent } from "@/components/ui-v2/card";
import type { IeltsWritingTask1Item } from "@/lib/ielts/writing-task1-bank-types";

type Props = {
  items: IeltsWritingTask1Item[];
  isAdmin?: boolean;
};

function taskLabel(item: IeltsWritingTask1Item) {
  return `剑桥雅思 ${item.bookNumber} · Test ${item.testNumber}`;
}

export default function Task1BankClient({ items, isAdmin = false }: Props) {
  const [activeBook, setActiveBook] = useState<number | "all">("all");
  const [query, setQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<IeltsWritingTask1Item | null>(null);
  const [modelAnswerOverrides, setModelAnswerOverrides] = useState<Record<string, string>>({});
  const [draftModelAnswer, setDraftModelAnswer] = useState("");
  const [isEditingModelAnswer, setIsEditingModelAnswer] = useState(false);
  const [isSavingModelAnswer, setIsSavingModelAnswer] = useState(false);
  const [saveError, setSaveError] = useState("");

  const books = useMemo(() => Array.from(new Set(items.map((item) => item.bookNumber))).sort((a, b) => b - a), [items]);
  const visibleItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return items.filter((item) => {
      const bookMatches = activeBook === "all" || item.bookNumber === activeBook;
      const keywordMatches = !keyword || `${item.title} ${item.promptPreview} ${taskLabel(item)}`.toLowerCase().includes(keyword);
      return bookMatches && keywordMatches;
    });
  }, [activeBook, items, query]);
  const selectedModelAnswer = selectedItem ? modelAnswerOverrides[selectedItem.id] ?? selectedItem.modelAnswer ?? "" : "";

  function openItem(item: IeltsWritingTask1Item) {
    const modelAnswer = modelAnswerOverrides[item.id] ?? item.modelAnswer ?? "";
    setSelectedItem(item);
    setDraftModelAnswer(modelAnswer);
    setIsEditingModelAnswer(false);
    setSaveError("");
  }

  async function saveModelAnswer() {
    if (!selectedItem || !isAdmin || isSavingModelAnswer) return;
    const nextAnswer = draftModelAnswer.trim();
    if (!nextAnswer) {
      setSaveError("范文不能为空。");
      return;
    }

    setIsSavingModelAnswer(true);
    setSaveError("");
    try {
      const response = await fetch("/api/admin/ielts-writing-task1-model-answer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedItem.id, modelAnswer: nextAnswer }),
      });
      const payload = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || "保存失败。");
      setModelAnswerOverrides((current) => ({ ...current, [selectedItem.id]: nextAnswer }));
      setIsEditingModelAnswer(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "保存失败。");
    } finally {
      setIsSavingModelAnswer(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)] sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]">
              <Grid3X3 size={20} />
            </span>
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">题库筛选</p>
              <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">默认展示全部 Cambridge IELTS 5-21 Academic Writing Task 1 截图。</p>
            </div>
          </div>
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索 book、test 或题干关键词..." className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] pl-9 pr-3 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--text-faint)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]" />
          </div>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          <Button type="button" size="sm" variant={activeBook === "all" ? "primary" : "secondary"} onClick={() => setActiveBook("all")} className="shrink-0">全部</Button>
          {books.map((book) => (
            <Button key={book} type="button" size="sm" variant={activeBook === book ? "primary" : "secondary"} onClick={() => setActiveBook(book)} className="shrink-0">Book {book}</Button>
          ))}
        </div>
      </section>

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--text)]">雅思小作文题库</p>
          <p className="mt-1 text-xs text-[var(--text-soft)]">{visibleItems.length} / {items.length} 道题</p>
        </div>
        <Badge variant="secondary" className="shrink-0">{books.length} 本剑桥</Badge>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visibleItems.map((item) => (
          <button key={item.id} type="button" onClick={() => openItem(item)} className="group h-full text-left">
            <Card className="h-full overflow-hidden rounded-[var(--radius-md)] transition group-hover:-translate-y-0.5 group-hover:border-[var(--primary)] group-hover:shadow-[var(--shadow-md)]">
              <CardContent className="flex h-full flex-col p-0">
                <div className="aspect-[4/3] overflow-hidden border-b border-[var(--border)] bg-[var(--bg-soft)]">
                  <img src={item.image} alt={item.title} loading="lazy" className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.02]" />
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>Book {item.bookNumber}</Badge>
                    <Badge variant="secondary">Test {item.testNumber}</Badge>
                    <Badge variant="outline">Task 1</Badge>
                  </div>
                  <h3 className="mt-3 text-sm font-semibold leading-6 text-[var(--text)]">{taskLabel(item)}</h3>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--text-soft)]">点击查看图片与高分范文</p>
                  <div className="mt-auto flex items-center justify-between pt-4 text-xs font-semibold text-[var(--primary)]">
                    <span className="inline-flex items-center gap-1"><Images size={14} />点击查看图片与高分范文</span>
                    <ChevronRight size={15} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
      </section>

      {visibleItems.length === 0 ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-4 py-8 text-center text-sm text-[var(--text-soft)]">没有匹配的小作文题目。</div>
      ) : null}

      {selectedItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-3 backdrop-blur-sm sm:p-5" role="dialog" aria-modal="true">
          <div className="flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-lg)]">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]">
                  <BookOpen size={19} />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-[var(--text)] sm:text-lg">{taskLabel(selectedItem)}</h2>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">{selectedItem.sourcePdf} · page {selectedItem.sourcePage}</p>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedItem(null)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-soft)] transition hover:bg-[var(--bg-soft)] hover:text-[var(--text)]" aria-label="关闭">
                <X size={17} />
              </button>
            </div>
            <div className="grid min-h-0 flex-1 gap-0 overflow-hidden lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)]">
              <div className="overflow-auto bg-[var(--bg-soft)] p-3 sm:p-5">
                <img src={selectedItem.image} alt={selectedItem.title} className="mx-auto max-h-[78vh] w-auto max-w-full rounded-[var(--radius-md)] bg-white shadow-[var(--shadow-sm)]" />
              </div>
              <aside className="flex min-h-[320px] flex-col border-t border-[var(--border)] bg-[var(--card)] lg:border-l lg:border-t-0">
                <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 sm:px-5">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text)]">Band 9 范文</h3>
                    {selectedItem.modelAnswerUpdatedAt ? <p className="mt-1 text-xs text-[var(--text-faint)]">Updated {new Date(selectedItem.modelAnswerUpdatedAt).toLocaleString()}</p> : null}
                  </div>
                  {isAdmin ? (
                    <div className="flex shrink-0 items-center gap-2">
                      {isEditingModelAnswer ? (
                        <Button type="button" size="sm" onClick={saveModelAnswer} disabled={isSavingModelAnswer}>
                          {isSavingModelAnswer ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />}
                          保存
                        </Button>
                      ) : (
                        <Button type="button" size="sm" variant="secondary" onClick={() => { setDraftModelAnswer(selectedModelAnswer); setIsEditingModelAnswer(true); setSaveError(""); }}>
                          <Pencil size={15} />
                          编辑
                        </Button>
                      )}
                    </div>
                  ) : null}
                </div>
                <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-5">
                  {isAdmin && isEditingModelAnswer ? (
                    <textarea
                      value={draftModelAnswer}
                      onChange={(event) => setDraftModelAnswer(event.target.value)}
                      className="min-h-[56vh] w-full resize-y rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] p-4 text-sm leading-7 text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]"
                    />
                  ) : selectedModelAnswer ? (
                    <div className="space-y-4 text-sm leading-7 text-[var(--text)]">
                      {selectedModelAnswer.split(/\n{2,}/).map((paragraph, index) => (
                        <p key={`${selectedItem.id}-model-answer-${index}`} className="whitespace-pre-line">{paragraph.trim()}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--bg-soft)] px-4 py-5 text-sm leading-6 text-[var(--text-soft)]">暂无范文。</p>
                  )}
                  {saveError ? <p className="mt-3 text-sm text-red-600">{saveError}</p> : null}
                </div>
              </aside>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
