"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Network, Search } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Card, CardContent } from "@/components/ui-v2/card";
import { Input } from "@/components/ui-v2/input";
import { Pagination } from "@/components/ui-v2/pagination";
import type { ResembleEntry } from "@/lib/vocabulary/content-types";

const PAGE_SIZE = 12;

function getSearchText(entry: ResembleEntry) {
  return [entry.title, entry.summary, ...entry.terms, ...entry.notes, ...entry.definitions.flatMap((item) => [item.term, item.explanation])].join(" ").toLowerCase();
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

function ResembleCard({ entry, keyword }: { entry: ResembleEntry; keyword: string }) {
  return (
    <Card className="border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
      <CardContent className="p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold leading-7 text-[var(--text)]"><HighlightText text={entry.title} keyword={keyword} /></h2>
            {entry.summary ? <p className="mt-2 text-sm leading-7 text-[var(--text-soft)]"><HighlightText text={entry.summary} keyword={keyword} /></p> : null}
          </div>
          <Badge variant="secondary">{entry.terms.length} words</Badge>
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {entry.terms.map((term) => <Badge key={term} className="bg-[var(--primary-soft)] text-[var(--primary)]"><HighlightText text={term} keyword={keyword} /></Badge>)}
        </div>
        <div className="space-y-2">
          {entry.definitions.slice(0, 5).map((item) => (
            <div key={`${entry.id}-${item.term}`} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-2">
              <div className="text-sm font-semibold text-[var(--text)]"><HighlightText text={item.term} keyword={keyword} /></div>
              <div className="mt-1 text-sm leading-6 text-[var(--text-soft)]"><HighlightText text={item.explanation} keyword={keyword} /></div>
            </div>
          ))}
        </div>
        {entry.definitions.length > 5 ? <div className="mt-3 text-xs font-medium text-[var(--text-faint)]">另有 {entry.definitions.length - 5} 条解释</div> : null}
      </CardContent>
    </Card>
  );
}

export default function ResembleClient({ entries }: { entries: ResembleEntry[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const keyword = searchTerm.trim().toLowerCase();

  const filteredItems = useMemo(() => {
    if (!keyword) return entries;
    return entries.filter((entry) => getSearchText(entry).includes(keyword));
  }, [entries, keyword]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedItems = filteredItems.slice((safeCurrentPage - 1) * PAGE_SIZE, safeCurrentPage * PAGE_SIZE);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
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
                <div className="flex items-center gap-2 text-xl font-bold text-[var(--text)]"><Network size={19} />近义词辨析</div>
                <div className="mt-1 text-sm text-[var(--text-soft)]">高频近义词、易混词和正式语境区别。</div>
              </div>
              <div className="relative w-full lg:w-[380px]">
                <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)]" />
                <Input value={searchTerm} onChange={(event) => handleSearchChange(event.target.value)} placeholder="Search synonyms..." className="pl-10" />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-soft)]">
              <Badge variant="secondary">{filteredItems.length} entries</Badge>
              {keyword ? <Button type="button" variant="ghost" size="sm" onClick={() => handleSearchChange("")}>Clear Search</Button> : null}
            </div>
          </CardContent>
        </Card>
        <section className="grid gap-3 lg:grid-cols-2">{paginatedItems.map((entry) => <ResembleCard key={entry.id} entry={entry} keyword={keyword} />)}</section>
        {filteredItems.length === 0 ? <Card className="border-[var(--border)] bg-[var(--card)]"><CardContent className="p-8 text-center text-sm text-[var(--text-soft)]">没有找到匹配的词汇内容。</CardContent></Card> : null}
        <Pagination currentPage={safeCurrentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    </main>
  );
}
