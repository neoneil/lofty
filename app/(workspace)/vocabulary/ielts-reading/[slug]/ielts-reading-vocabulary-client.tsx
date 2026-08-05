"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Star, X } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Input } from "@/components/ui-v2/input";
import type { IeltsReadingVocabularyDocument, IeltsReadingVocabularyItem } from "@/lib/vocabulary/ielts-reading-types";

type Props = {
  document: IeltsReadingVocabularyDocument;
};

function getItemSearchText(item: IeltsReadingVocabularyItem) {
  return [item.word, item.partOfSpeech, item.explanation, item.raw].join(" ").toLowerCase();
}

function chunkItems(items: IeltsReadingVocabularyItem[]) {
  const chunkSize = Math.ceil(items.length / 3) || 1;
  return [items.slice(0, chunkSize), items.slice(chunkSize, chunkSize * 2), items.slice(chunkSize * 2)];
}

function formatChinesePart(value: number) {
  const labels = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
  return labels[value] ?? String(value);
}

function VocabularyTable({ items }: { items: IeltsReadingVocabularyItem[] }) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
      <table className="w-full table-fixed border-collapse text-left">
        <colgroup>
          <col className="w-9" />
          <col className="w-[34%]" />
          <col className="w-12" />
          <col />
        </colgroup>
        <tbody className="divide-y divide-[var(--border)]">
          {items.map((item, index) => (
            <tr key={`${item.number}-${item.word}`} className={`transition hover:bg-[var(--primary-soft)]/40 ${index % 2 === 0 ? "bg-[var(--card)]" : "bg-[var(--bg-soft)]"}`}>
              <td className="px-2.5 py-2 align-top text-xs font-bold tabular-nums text-[var(--primary)]">{item.number}</td>
              <td className="px-2.5 py-2 align-top text-sm font-bold leading-6 text-[var(--text)]">
                <div className="flex min-w-0 items-center gap-1.5">
                  {item.starred ? <Star size={12} className="shrink-0 fill-[var(--warning)] text-[var(--warning)]" /> : null}
                  <span className="truncate">{item.word}</span>
                </div>
              </td>
              <td className="px-2 py-2 align-top text-xs font-semibold italic leading-6 text-[var(--text-faint)]">{item.partOfSpeech}</td>
              <td className="px-2.5 py-2 align-top text-sm leading-6 text-[var(--text-soft)]">{item.explanation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function IeltsReadingVocabularyClient({ document }: Props) {
  const [activeListNumber, setActiveListNumber] = useState(document.lists[0]?.listNumber ?? 1);
  const [searchTerm, setSearchTerm] = useState("");
  const [starredOnly, setStarredOnly] = useState(false);

  const activeList = document.lists.find((list) => list.listNumber === activeListNumber) ?? document.lists[0];
  const keyword = searchTerm.trim().toLowerCase();

  const filteredItems = useMemo(() => {
    const items = activeList?.items ?? [];
    return items.filter((item) => {
      if (starredOnly && !item.starred) return false;
      if (!keyword) return true;
      return getItemSearchText(item).includes(keyword);
    });
  }, [activeList, keyword, starredOnly]);
  const itemColumns = useMemo(() => chunkItems(filteredItems), [filteredItems]);
  const listPartNumbers = useMemo(() => {
    const chapterCounts = new Map<string, number>();
    const parts = new Map<number, number>();
    for (const list of [...document.lists].sort((a, b) => a.listNumber - b.listNumber)) {
      const chapterTitle = list.chapterTitle || "分类";
      const nextPart = (chapterCounts.get(chapterTitle) ?? 0) + 1;
      chapterCounts.set(chapterTitle, nextPart);
      parts.set(list.listNumber, nextPart);
    }
    return parts;
  }, [document.lists]);
  const activePartNumber = activeList ? listPartNumbers.get(activeList.listNumber) ?? 1 : 1;
  const activeCategoryLabel = activeList?.chapterTitle ? `${activeList.chapterTitle} 第${formatChinesePart(activePartNumber)}部分` : activeList?.title;

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
                <Badge>IELTS Reading</Badge>
                <Badge variant="secondary">{document.wordCount} words</Badge>
                <Badge variant="secondary">{document.listCount} lists</Badge>
                {activeCategoryLabel ? <Badge variant="outline">{activeCategoryLabel}</Badge> : null}
              </div>
              <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">{document.subtitle}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{activeList?.title ?? "List"}</Badge>
              <Badge variant="outline">{filteredItems.length} / {activeList?.itemCount ?? 0}</Badge>
              {keyword ? <Badge variant="outline">Search: {searchTerm.trim()}</Badge> : null}
            </div>
          </div>
        </section>

        <section className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-3 shadow-[var(--shadow-sm)]">
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 md:grid-cols-7 xl:grid-cols-10">
              {document.lists.map((list) => (
                <button key={list.listNumber} type="button" onClick={() => setActiveListNumber(list.listNumber)} className={`min-h-[42px] rounded-[var(--radius-sm)] border px-2 py-1.5 text-center transition ${activeListNumber === list.listNumber ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)] shadow-[var(--shadow-sm)]" : "border-[var(--border)] bg-[var(--card)] text-[var(--text-soft)] hover:border-[var(--primary)]/40 hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"}`}>
                  <span className="block truncate text-[11px] font-bold leading-4">{list.chapterTitle || `List ${list.listNumber}`}</span>
                  <span className="block text-[10px] font-semibold leading-4 text-[var(--text-faint)]">第{formatChinesePart(listPartNumbers.get(list.listNumber) ?? 1)}部分</span>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2 border-t border-[var(--border)] pt-3 sm:flex-row sm:items-center sm:justify-end">
              <Button type="button" variant={starredOnly ? "primary" : "secondary"} size="sm" onClick={() => setStarredOnly((value) => !value)} className="h-8 justify-center px-3 text-xs">
                <Star size={13} />
                重点词
              </Button>
              <div className="relative w-full sm:w-[280px]">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)]" />
                <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search word or meaning..." className="h-8 pl-9 text-xs" />
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
          {itemColumns.map((items, index) => items.length > 0 ? <VocabularyTable key={`${activeList?.listNumber}-${index}`} items={items} /> : null)}
        </section>

        {filteredItems.length === 0 ? (
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-8 text-center text-sm text-[var(--text-soft)]">没有找到匹配词条。</div>
        ) : null}

        <div className="h-8" />
      </div>
    </main>
  );
}
