"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Card, CardContent } from "@/components/ui-v2/card";
import DictionaryText from "@/components/dictionary/dictionary-text";
import { Input } from "@/components/ui-v2/input";
import { Pagination } from "@/components/ui-v2/pagination";
import type { WfdVocabularyItem } from "./page";

type CategoryFilter = "top" | "middle" | "rare";

type Props = {
  vocabulary: WfdVocabularyItem[];
  stats: {
    totalWords: number;
    topFrequency: number;
    averageFrequency: number;
  };
};

const categoryOptions: { label: string; value: CategoryFilter }[] = [
  { label: "Top", value: "top" },
  { label: "Middle", value: "middle" },
  { label: "Rare", value: "rare" },
];

const PAGE_SIZE = 20;

function normalizeCategory(category: string | null) {
  return (category ?? "rare").toLowerCase();
}

export default function WfdVocabularyClient({ vocabulary, stats }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("top");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredVocabulary = useMemo(() => {
    let result = [...vocabulary];
    const keyword = searchTerm.trim().toLowerCase();

    if (keyword) {
      result = result.filter((item) => item.word.toLowerCase().includes(keyword));
    }

    result = result.filter((item) => normalizeCategory(item.category) === category);

    return result;
  }, [category, searchTerm, vocabulary]);

  const totalPages = Math.max(1, Math.ceil(filteredVocabulary.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const paginatedVocabulary = filteredVocabulary.slice(startIndex, startIndex + PAGE_SIZE);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (value: CategoryFilter) => {
    setCategory(value);
    setCurrentPage(1);
  };

  return (
    <main className="container-main py-3 sm:py-4">
      <section className="mb-4 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-md)] sm:p-7">
        <Badge className="mb-3 w-fit">WFD Vocabulary</Badge>
        <h1 className="mb-3 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">WFD 高/低频词</h1>
        <p className="max-w-3xl text-sm leading-7 text-[var(--text-soft)] sm:text-base">掌握拼写，因为拼写才是wfd高分分水岭.</p>
      </section>

      <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card><CardContent className="p-4 sm:p-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-soft)]">Total Words</p><p className="mt-2 text-2xl font-bold text-[var(--text)]">{stats.totalWords}</p></CardContent></Card>
        <Card><CardContent className="p-4 sm:p-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-soft)]">Top Frequency</p><p className="mt-2 text-2xl font-bold text-[var(--text)]">{stats.topFrequency}</p></CardContent></Card>
        <Card><CardContent className="p-4 sm:p-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-soft)]">Average Frequency</p><p className="mt-2 text-2xl font-bold text-[var(--text)]">{stats.averageFrequency}</p></CardContent></Card>
      </section>

      <Card className="mb-4">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="relative">
            <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)]" />
            <Input value={searchTerm} onChange={(event) => handleSearchChange(event.target.value)} placeholder="Search word..." className="pl-10" />
          </div>

          <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
            {categoryOptions.map((option) => (
              <Button key={option.value} type="button" variant={category === option.value ? "primary" : "secondary"} size="sm" onClick={() => handleCategoryChange(option.value)} className="w-full sm:w-auto">{option.label}</Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="hidden overflow-hidden sm:block">
            <table className="w-full border-collapse">
              <thead className="bg-[var(--bg-soft)]">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-soft)]">
                  <th className="px-5 py-4">#</th>
                  <th className="px-5 py-4">Word</th>
                  <th className="px-5 py-4">Frequency</th>
                  <th className="px-5 py-4">Category</th>
                </tr>
              </thead>
              <tbody>
                {paginatedVocabulary.map((item, index) => (
                  <tr key={item.id} className="border-t border-[var(--border)] text-sm">
                    <td className="px-5 py-4 text-[var(--text-soft)]">{startIndex + index + 1}</td>
                    <td className="px-5 py-4 font-semibold text-[var(--text)]">
                      <DictionaryText text={item.word} />
                    </td>
                    <td className="px-5 py-4 text-[var(--text)]">{item.frequency}</td>
                    <td className="px-5 py-4"><Badge variant="secondary">{normalizeCategory(item.category)}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-[var(--border)] sm:hidden">
            {paginatedVocabulary.map((item, index) => (
              <article key={item.id} className="p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">#{startIndex + index + 1}</Badge>
                    <h2 className="text-lg font-semibold text-[var(--text)]">
                      <DictionaryText text={item.word} />
                    </h2>
                  </div>
                  <Badge>{item.frequency}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-[var(--text-soft)]">
                  <span>Category</span>
                  <Badge variant="secondary">{normalizeCategory(item.category)}</Badge>
                </div>
              </article>
            ))}
          </div>

          {filteredVocabulary.length === 0 ? <div className="p-8 text-center text-sm text-[var(--text-soft)]">没有匹配的词频数据。</div> : null}
        </CardContent>
      </Card>

      <Pagination currentPage={safeCurrentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </main>
  );
}
