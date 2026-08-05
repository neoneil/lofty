"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Layers3, Search } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Card, CardContent } from "@/components/ui-v2/card";
import { Input } from "@/components/ui-v2/input";
import { Pagination } from "@/components/ui-v2/pagination";
import type { WordRootEntry } from "@/lib/vocabulary/content-types";

type AffixType = "prefix" | "suffix";

const PAGE_SIZE = 12;

function getSearchText(entry: WordRootEntry) {
  return [entry.root, entry.meaning, entry.wordClass, entry.origin, entry.functionText, entry.synonyms, entry.antonyms, ...entry.examples].join(" ").toLowerCase();
}

function HighlightText({ text, keyword }: { text: string; keyword: string }) {
  const trimmedKeyword = keyword.trim();
  if (!trimmedKeyword) return <>{text}</>;
  const escapedKeyword = trimmedKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escapedKeyword})`, "gi"));
  return (
    <>
      {parts.map((part, index) => part.toLowerCase() === trimmedKeyword.toLowerCase() ? <mark key={`${part}-${index}`} className="rounded-[var(--radius-xs)] bg-[var(--warning-soft)] px-1 font-semibold text-[var(--warning)]">{part}</mark> : <span key={`${part}-${index}`}>{part}</span>)}
    </>
  );
}

function WordRootCard({ entry, keyword }: { entry: WordRootEntry; keyword: string }) {
  return (
    <Card className="border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
      <CardContent className="p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-2xl font-bold tracking-tight text-[var(--text)]"><HighlightText text={entry.root} keyword={keyword} /></div>
            {entry.meaning ? <p className="mt-2 text-sm leading-7 text-[var(--text-soft)]"><HighlightText text={entry.meaning} keyword={keyword} /></p> : null}
          </div>
          {entry.wordClass ? <Badge variant="secondary"><HighlightText text={entry.wordClass} keyword={keyword} /></Badge> : null}
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {entry.origin ? <Badge className="bg-[var(--primary-soft)] text-[var(--primary)]"><HighlightText text={entry.origin} keyword={keyword} /></Badge> : null}
          {entry.synonyms ? <Badge variant="secondary">Syn: <HighlightText text={entry.synonyms} keyword={keyword} /></Badge> : null}
          {entry.antonyms ? <Badge variant="secondary">Ant: <HighlightText text={entry.antonyms} keyword={keyword} /></Badge> : null}
        </div>
        {entry.functionText ? <p className="mb-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-3 text-sm leading-7 text-[var(--text-soft)]"><HighlightText text={entry.functionText} keyword={keyword} /></p> : null}
        <div className="flex flex-wrap gap-2">
          {entry.examples.slice(0, 10).map((example) => <span key={`${entry.id}-${example}`} className="rounded-[var(--radius-sm)] bg-[var(--bg-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--text)]"><HighlightText text={example} keyword={keyword} /></span>)}
        </div>
        {entry.examples.length > 10 ? <div className="mt-3 text-xs font-medium text-[var(--text-faint)]">另有 {entry.examples.length - 10} 个例词</div> : null}
      </CardContent>
    </Card>
  );
}

export default function WordRootsClient({ entries }: { entries: WordRootEntry[] }) {
  const [activeAffixType, setActiveAffixType] = useState<AffixType>("prefix");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const keyword = searchTerm.trim().toLowerCase();
  const affixCounts = useMemo(() => ({
    prefix: entries.filter((entry) => entry.wordClass.trim().toLowerCase() === "prefix").length,
    suffix: entries.filter((entry) => entry.wordClass.trim().toLowerCase().includes("suffix")).length,
  }), [entries]);
  const activeItems = useMemo(() => entries.filter((entry) => {
    const wordClass = entry.wordClass.trim().toLowerCase();
    return activeAffixType === "prefix" ? wordClass === "prefix" : wordClass.includes("suffix");
  }), [activeAffixType, entries]);
  const filteredItems = useMemo(() => {
    if (!keyword) return activeItems;
    return activeItems.filter((entry) => getSearchText(entry).includes(keyword));
  }, [activeItems, keyword]);
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedItems = filteredItems.slice((safeCurrentPage - 1) * PAGE_SIZE, safeCurrentPage * PAGE_SIZE);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleAffixTypeChange = (affixType: AffixType) => {
    setActiveAffixType(affixType);
    setCurrentPage(1);
  };

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-4 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <Link href="/vocabulary" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-soft)] transition hover:text-[var(--primary)]"><ArrowLeft size={16} />词汇中心</Link>
        <Card className="border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-md)]">
          <CardContent className="space-y-4 p-4 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xl font-bold text-[var(--text)]"><Layers3 size={19} />词根词缀</div>
                <div className="mt-1 text-sm text-[var(--text-soft)]">前缀、后缀、词根和例词的系统整理。</div>
              </div>
              <div className="relative w-full lg:w-[380px]">
                <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)]" />
                <Input value={searchTerm} onChange={(event) => handleSearchChange(event.target.value)} placeholder="Search root, meaning, example..." className="pl-10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-1.5">
              <button type="button" onClick={() => handleAffixTypeChange("prefix")} className={`flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] px-3 text-sm font-semibold transition ${activeAffixType === "prefix" ? "bg-[var(--card)] text-[var(--primary)] shadow-[var(--shadow-sm)]" : "text-[var(--text-soft)] hover:text-[var(--text)]"}`}>前缀 <span className="text-xs font-medium text-[var(--text-faint)]">Prefixes · {affixCounts.prefix}</span></button>
              <button type="button" onClick={() => handleAffixTypeChange("suffix")} className={`flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] px-3 text-sm font-semibold transition ${activeAffixType === "suffix" ? "bg-[var(--card)] text-[var(--primary)] shadow-[var(--shadow-sm)]" : "text-[var(--text-soft)] hover:text-[var(--text)]"}`}>后缀 <span className="text-xs font-medium text-[var(--text-faint)]">Suffixes · {affixCounts.suffix}</span></button>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-soft)]">
              <Badge variant="secondary">{filteredItems.length} entries</Badge>
              {keyword ? <Button type="button" variant="ghost" size="sm" onClick={() => handleSearchChange("")}>Clear Search</Button> : null}
            </div>
          </CardContent>
        </Card>
        <section className="grid gap-3 lg:grid-cols-2">{paginatedItems.map((entry) => <WordRootCard key={entry.id} entry={entry} keyword={keyword} />)}</section>
        {filteredItems.length === 0 ? <Card className="border-[var(--border)] bg-[var(--card)]"><CardContent className="p-8 text-center text-sm text-[var(--text-soft)]">没有找到匹配的词汇内容。</CardContent></Card> : null}
        <Pagination currentPage={safeCurrentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    </main>
  );
}
