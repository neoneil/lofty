"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpenCheck, Lightbulb, PenLine, Search, Sparkles, Star, X } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Input } from "@/components/ui-v2/input";
import type { IeltsWritingVocabularyCategory, IeltsWritingVocabularyDocument, IeltsWritingVocabularyItem } from "@/lib/vocabulary/ielts-writing-types";

type Props = {
  document: IeltsWritingVocabularyDocument;
};

function getItemSearchText(item: IeltsWritingVocabularyItem, category: IeltsWritingVocabularyCategory) {
  return [item.term, item.translation, item.itemType, item.explanation, ...(item.variants ?? []), category.title, category.description, category.aiFocus, item.raw].join(" ").toLowerCase();
}

function chunkItems(items: IeltsWritingVocabularyItem[]) {
  const chunkSize = Math.ceil(items.length / 3) || 1;
  return [items.slice(0, chunkSize), items.slice(chunkSize, chunkSize * 2), items.slice(chunkSize * 2)];
}

function WritingTermCell({ item }: { item: IeltsWritingVocabularyItem }) {
  const [tooltip, setTooltip] = useState<{ left: number; top: number; width: number; placement: "top" | "bottom" } | null>(null);

  function showTooltip(element: HTMLElement) {
    const rect = element.getBoundingClientRect();
    const width = Math.min(520, Math.max(300, window.innerWidth - 24));
    const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
    const placement = rect.top < 170 ? "bottom" : "top";
    const top = placement === "top" ? rect.top - 8 : rect.bottom + 8;
    setTooltip({ left, top, width, placement });
  }

  return (
    <div className="relative flex min-w-0 items-center gap-1.5">
      {item.starred ? <Star size={12} className="shrink-0 fill-[var(--warning)] text-[var(--warning)]" /> : null}
      <button type="button" onMouseEnter={(event) => showTooltip(event.currentTarget)} onMouseLeave={() => setTooltip(null)} onFocus={(event) => showTooltip(event.currentTarget)} onBlur={() => setTooltip(null)} className="min-w-0 truncate text-left font-bold leading-6 text-[var(--text)] outline-none transition hover:text-[var(--primary)] focus-visible:text-[var(--primary)]">
        {item.term}
      </button>
      {tooltip ? (
        <div className="pointer-events-none fixed z-[90] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-3 text-left shadow-[var(--shadow-lg)]" style={{ left: tooltip.left, top: tooltip.top, width: tooltip.width, transform: tooltip.placement === "top" ? "translateY(-100%)" : undefined }}>
          <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-faint)]">Writing Collocation</span>
            <span className="rounded-full bg-[var(--primary-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--primary)]">{item.itemType}</span>
          </div>
          <div className="mt-2 text-sm font-bold leading-6 text-[var(--text)]">{item.term}</div>
          <div className="mt-1 text-sm leading-6 text-[var(--text-soft)]">{item.translation}</div>
          {item.explanation ? <div className="mt-2 rounded-[var(--radius-sm)] bg-[var(--bg-soft)] px-2.5 py-2 text-xs leading-5 text-[var(--text-soft)]">{item.explanation}</div> : null}
          {item.variants?.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {item.variants.map((variant) => <span key={variant} className="rounded-full border border-[var(--border)] bg-[var(--card)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-soft)]">{variant}</span>)}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function VocabularyTable({ items, category }: { items: IeltsWritingVocabularyItem[]; category: IeltsWritingVocabularyCategory }) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
      <table className="w-full table-fixed border-collapse text-left">
        <colgroup>
          <col className="w-9" />
          <col />
          <col className="w-16" />
          <col className="w-[32%]" />
        </colgroup>
        <tbody className="divide-y divide-[var(--border)]">
          {items.map((item, index) => (
            <tr key={`${category.slug}-${item.number}-${item.term}`} className={`transition hover:bg-[var(--primary-soft)]/40 ${index % 2 === 0 ? "bg-[var(--card)]" : "bg-[var(--bg-soft)]"}`}>
              <td className="px-2.5 py-2 align-top text-xs font-bold tabular-nums text-[var(--primary)]">{item.number}</td>
              <td className="px-2.5 py-2 align-top text-sm font-bold leading-6 text-[var(--text)]">
                <WritingTermCell item={item} />
              </td>
              <td className="px-2 py-2 align-top text-xs font-semibold leading-6 text-[var(--text-faint)]">{item.itemType}</td>
              <td className="px-2.5 py-2 align-top text-sm leading-6 text-[var(--text-soft)]">{item.translation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function IeltsWritingVocabularyClient({ document }: Props) {
  const [activeCategorySlug, setActiveCategorySlug] = useState(document.categories[0]?.slug ?? "");
  const [searchTerm, setSearchTerm] = useState("");
  const [phrasesOnly, setPhrasesOnly] = useState(false);

  const activeCategory = document.categories.find((category) => category.slug === activeCategorySlug) ?? document.categories[0];
  const keyword = searchTerm.trim().toLowerCase();

  const filteredItems = useMemo(() => {
    const items = activeCategory?.items ?? [];
    return items.filter((item) => {
      if (phrasesOnly && item.itemType !== "Phrase") return false;
      if (!keyword) return true;
      return getItemSearchText(item, activeCategory).includes(keyword);
    });
  }, [activeCategory, keyword, phrasesOnly]);
  const itemColumns = useMemo(() => chunkItems(filteredItems), [filteredItems]);

  return (
    <main className="min-h-screen bg-[var(--bg)] px-3 py-3 text-[var(--text)] sm:px-5 lg:px-6">
      <div className="mx-auto w-full max-w-[1500px] space-y-3">
        <section className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-3 py-3 shadow-[var(--shadow-sm)] sm:px-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <Link href="/vocabulary" className="mb-1 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-soft)] transition hover:text-[var(--primary)]">
                <ArrowLeft size={14} />
                词汇中心
              </Link>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold leading-7 text-[var(--text)] sm:text-2xl">{document.title}</h1>
                <Badge>IELTS Writing</Badge>
                <Badge variant="secondary">{document.wordCount} items</Badge>
                <Badge variant="secondary">{document.categoryCount} categories</Badge>
                {document.exampleCount ? <Badge variant="secondary">{document.exampleCount} examples</Badge> : null}
              </div>
              <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">{document.subtitle}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{activeCategory?.title ?? "Category"}</Badge>
              <Badge variant="outline">{filteredItems.length} / {activeCategory?.itemCount ?? 0}</Badge>
              {activeCategory?.exampleCount ? <Badge variant="outline">{activeCategory.exampleCount} examples</Badge> : null}
              {keyword ? <Badge variant="outline">Search: {searchTerm.trim()}</Badge> : null}
            </div>
          </div>
        </section>

        {activeCategory?.description || activeCategory?.aiFocus ? (
          <section className="grid gap-2 md:grid-cols-2">
            {activeCategory.description ? (
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-3 shadow-[var(--shadow-sm)]">
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--text)]"><Lightbulb size={15} className="text-[var(--primary)]" />表达用途</div>
                <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">{activeCategory.description}</p>
              </div>
            ) : null}
            {activeCategory.aiFocus ? (
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-3 shadow-[var(--shadow-sm)]">
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--text)]"><Sparkles size={15} className="text-[var(--primary)]" />AI 补充讲解</div>
                <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">{activeCategory.aiFocus}</p>
              </div>
            ) : null}
          </section>
        ) : null}

        <section className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-3 shadow-[var(--shadow-sm)]">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-10">
              {document.categories.map((category) => (
                <button key={category.slug} type="button" onClick={() => setActiveCategorySlug(category.slug)} className={`min-h-[48px] rounded-[var(--radius-sm)] border px-2 py-1.5 text-center transition ${activeCategory?.slug === category.slug ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)] shadow-[var(--shadow-sm)]" : "border-[var(--border)] bg-[var(--card)] text-[var(--text-soft)] hover:border-[var(--primary)]/40 hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"}`}>
                  <span className="block truncate text-[11px] font-bold leading-4">{category.title}</span>
                  <span className="mt-0.5 inline-flex items-center justify-center gap-1 rounded-full bg-[var(--bg-soft)] px-2 py-0.5 text-[10px] font-semibold leading-4 text-[var(--text-faint)]">
                    <PenLine size={10} />
                    {category.itemCount}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2 border-t border-[var(--border)] pt-3 sm:flex-row sm:items-center sm:justify-end">
              <Button type="button" variant={phrasesOnly ? "primary" : "secondary"} size="sm" onClick={() => setPhrasesOnly((value) => !value)} className="h-8 justify-center px-3 text-xs">
                <Star size={13} />
                短语
              </Button>
              <div className="relative w-full sm:w-[280px]">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)]" />
                <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search phrase or meaning..." className="h-8 pl-9 text-xs" />
                {searchTerm ? (
                  <button type="button" onClick={() => setSearchTerm("")} className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-[var(--text-soft)] transition hover:bg-[var(--bg-soft)] hover:text-[var(--text)]" aria-label="Clear search">
                    <X size={13} />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-2 lg:grid-cols-2 2xl:grid-cols-3">
          {activeCategory ? itemColumns.map((items, index) => items.length > 0 ? <VocabularyTable key={`${activeCategory.slug}-${index}`} items={items} category={activeCategory} /> : null) : null}
        </section>

        {filteredItems.length === 0 ? (
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-8 text-center text-sm text-[var(--text-soft)]">没有找到匹配词条。</div>
        ) : null}

        {activeCategory?.examples?.length ? (
          <section className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-3 shadow-[var(--shadow-sm)]">
            <div className="flex flex-col gap-2 border-b border-[var(--border)] pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--text)]">
                <BookOpenCheck size={16} className="text-[var(--primary)]" />
                原文例句
              </div>
              <Badge variant="secondary">{activeCategory.examples.length} examples</Badge>
            </div>
            <div className="mt-3 grid gap-2 lg:grid-cols-2">
              {activeCategory.examples.map((example, index) => (
                <div key={`${activeCategory.slug}-${example.number}`} className={`rounded-[var(--radius-sm)] border border-[var(--border)] px-3 py-2 text-sm leading-6 text-[var(--text-soft)] ${index % 2 === 0 ? "bg-[var(--card)]" : "bg-[var(--bg-soft)]"}`}>
                  <span className="mr-2 font-bold tabular-nums text-[var(--primary)]">{example.number}.</span>
                  <span>{example.text}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="h-8" />
      </div>
    </main>
  );
}
