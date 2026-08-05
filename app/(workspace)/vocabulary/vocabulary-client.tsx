"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Layers3, Network, Search, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Card, CardContent } from "@/components/ui-v2/card";
import { Input } from "@/components/ui-v2/input";
import { Pagination } from "@/components/ui-v2/pagination";
import type { ResembleEntry, WordRootEntry } from "@/lib/vocabulary/content-types";
import type { IeltsReadingVocabularyIndexItem } from "@/lib/vocabulary/ielts-reading-types";

type Collection = "resemble" | "wordRoots";
type AffixType = "prefix" | "suffix";

type Props = {
  resemble: ResembleEntry[];
  wordRoots: WordRootEntry[];
  ieltsReadingDocuments: IeltsReadingVocabularyIndexItem[];
};

const PAGE_SIZE = 12;

const collections: { value: Collection; label: string; title: string; description: string }[] = [
  { value: "resemble", label: "近义词辨析", title: "Resemble Words", description: "高频近义词、易混词和正式语境区别。" },
  { value: "wordRoots", label: "词根词缀", title: "Word Roots", description: "按词根、前缀、后缀建立长期词汇理解。" },
];

function getSearchText(entry: ResembleEntry | WordRootEntry) {
  if ("terms" in entry) {
    return [entry.title, entry.summary, ...entry.terms, ...entry.notes, ...entry.definitions.flatMap((item) => [item.term, item.explanation])].join(" ").toLowerCase();
  }

  return [entry.root, entry.meaning, entry.wordClass, entry.origin, entry.functionText, entry.synonyms, entry.antonyms, ...entry.examples].join(" ").toLowerCase();
}

function HighlightText({ text, keyword }: { text: string; keyword: string }) {
  const trimmedKeyword = keyword.trim();

  if (!trimmedKeyword) return <>{text}</>;

  const escapedKeyword = trimmedKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escapedKeyword})`, "gi"));

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === trimmedKeyword.toLowerCase() ? (
          <mark key={`${part}-${index}`} className="rounded-[var(--radius-xs)] bg-[var(--warning-soft)] px-1 font-semibold text-[var(--warning)]">{part}</mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
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
          {entry.terms.map((term) => (
            <Badge key={term} className="bg-[var(--primary-soft)] text-[var(--primary)]"><HighlightText text={term} keyword={keyword} /></Badge>
          ))}
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
          {entry.examples.slice(0, 10).map((example) => (
            <span key={`${entry.id}-${example}`} className="rounded-[var(--radius-sm)] bg-[var(--bg-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--text)]"><HighlightText text={example} keyword={keyword} /></span>
          ))}
        </div>

        {entry.examples.length > 10 ? <div className="mt-3 text-xs font-medium text-[var(--text-faint)]">另有 {entry.examples.length - 10} 个例词</div> : null}
      </CardContent>
    </Card>
  );
}

function IeltsReadingVocabularyCard({ entry }: { entry: IeltsReadingVocabularyIndexItem }) {
  return (
    <Link href={`/vocabulary/ielts-reading/${entry.slug}`} className="group block h-full">
      <Card className="h-full border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)] transition group-hover:-translate-y-0.5 group-hover:border-[var(--primary)]/40 group-hover:shadow-[var(--shadow-md)]">
        <CardContent className="flex h-full flex-col p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]"><BookOpen size={17} /></span>
            <div className="flex flex-wrap justify-end gap-2">
              <Badge>{entry.wordCount} words</Badge>
              <Badge variant="secondary">{entry.listCount} lists</Badge>
            </div>
          </div>
          <h2 className="mt-4 text-lg font-semibold leading-7 text-[var(--text)]">{entry.title}</h2>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--text-soft)]">{entry.subtitle}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="secondary">{entry.exam}</Badge>
            <Badge variant="outline">{entry.skill}</Badge>
            {entry.chapterTitles.slice(0, 2).map((chapter) => <Badge key={chapter} variant="outline">{chapter}</Badge>)}
          </div>
          <div className="mt-auto flex items-center justify-between border-t border-[var(--border)] pt-4 text-sm font-semibold text-[var(--primary)]">
            查看样式化词库
            <ArrowRight size={16} className="transition group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function VocabularyClient({ resemble, wordRoots, ieltsReadingDocuments }: Props) {
  const [activeCollection, setActiveCollection] = useState<Collection>("resemble");
  const [activeAffixType, setActiveAffixType] = useState<AffixType>("prefix");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const activeMeta = collections.find((item) => item.value === activeCollection) ?? collections[0];
  const affixCounts = useMemo(() => ({
    prefix: wordRoots.filter((entry) => entry.wordClass.trim().toLowerCase() === "prefix").length,
    suffix: wordRoots.filter((entry) => entry.wordClass.trim().toLowerCase().includes("suffix")).length,
  }), [wordRoots]);
  const activeWordRoots = useMemo(() => wordRoots.filter((entry) => {
    const wordClass = entry.wordClass.trim().toLowerCase();
    return activeAffixType === "prefix" ? wordClass === "prefix" : wordClass.includes("suffix");
  }), [activeAffixType, wordRoots]);
  const activeItems = activeCollection === "resemble" ? resemble : activeWordRoots;
  const keyword = searchTerm.trim().toLowerCase();

  const filteredItems = useMemo(() => {
    if (!keyword) return activeItems;
    return activeItems.filter((entry) => getSearchText(entry).includes(keyword));
  }, [activeItems, keyword]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + PAGE_SIZE);

  const handleCollectionChange = (collection: Collection) => {
    setActiveCollection(collection);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleAffixTypeChange = (affixType: AffixType) => {
    setActiveAffixType(affixType);
    setCurrentPage(1);
  };

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-md)]">
          <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[1fr_320px]">
            <div>
              <Badge className="mb-3 w-fit">Vocabulary Library</Badge>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">Lofty 词汇中心</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)] sm:text-base">从词根词缀和近义词辨析开始，后续可以继续接入 SST、WFD 和更多考试词库。</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-soft)]"><Network size={14} />Resemble</div>
                <div className="mt-2 text-2xl font-bold text-[var(--text)]">{resemble.length}</div>
              </div>
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-soft)]"><Layers3 size={14} />Roots</div>
                <div className="mt-2 text-2xl font-bold text-[var(--text)]">{wordRoots.length}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2">
          {collections.map((collection) => (
            <button key={collection.value} type="button" onClick={() => handleCollectionChange(collection.value)} className={`rounded-[var(--radius-md)] border p-4 text-left shadow-[var(--shadow-sm)] transition ${activeCollection === collection.value ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/40"}`}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]"><BookOpen size={16} />{collection.label}</div>
                <Badge variant={activeCollection === collection.value ? "default" : "secondary"}>{collection.value === "resemble" ? resemble.length : wordRoots.length}</Badge>
              </div>
              <div className="text-xs leading-6 text-[var(--text-soft)]">{collection.description}</div>
            </button>
          ))}
        </section>

        {ieltsReadingDocuments.length > 0 ? (
          <section className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-[var(--text)]">IELTS 阅读词汇</div>
                <p className="mt-1 text-sm text-[var(--text-soft)]">从 PDF 转成 Lofty 静态词库，页面可搜索、可按 List 浏览。</p>
              </div>
              <Badge variant="secondary">{ieltsReadingDocuments.length} documents</Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {ieltsReadingDocuments.map((entry) => <IeltsReadingVocabularyCard key={entry.id} entry={entry} />)}
            </div>
          </section>
        ) : null}

        {activeCollection === "wordRoots" ? (
          <Card className="border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
            <CardContent className="p-3 sm:p-4">
              <div className="grid grid-cols-2 gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-1.5">
                <button type="button" onClick={() => handleAffixTypeChange("prefix")} className={`flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] px-3 text-sm font-semibold transition ${activeAffixType === "prefix" ? "bg-[var(--card)] text-[var(--primary)] shadow-[var(--shadow-sm)]" : "text-[var(--text-soft)] hover:text-[var(--text)]"}`}>前缀 <span className="text-xs font-medium text-[var(--text-faint)]">Prefixes · {affixCounts.prefix}</span></button>
                <button type="button" onClick={() => handleAffixTypeChange("suffix")} className={`flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] px-3 text-sm font-semibold transition ${activeAffixType === "suffix" ? "bg-[var(--card)] text-[var(--primary)] shadow-[var(--shadow-sm)]" : "text-[var(--text-soft)] hover:text-[var(--text)]"}`}>后缀 <span className="text-xs font-medium text-[var(--text-faint)]">Suffixes · {affixCounts.suffix}</span></button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card className="border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
          <CardContent className="space-y-4 p-4 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-lg font-semibold text-[var(--text)]"><Sparkles size={18} />{activeMeta.title}</div>
                <div className="mt-1 text-sm text-[var(--text-soft)]">{activeMeta.description}</div>
              </div>
              <div className="relative w-full lg:w-[360px]">
                <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)]" />
                <Input value={searchTerm} onChange={(event) => handleSearchChange(event.target.value)} placeholder="Search word, root, meaning..." className="pl-10" />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-soft)]">
              <Badge variant="secondary">{filteredItems.length} entries</Badge>
              {keyword ? <Button type="button" variant="ghost" size="sm" onClick={() => handleSearchChange("")}>Clear Search</Button> : null}
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-3 lg:grid-cols-2">
          {activeCollection === "resemble"
            ? (paginatedItems as ResembleEntry[]).map((entry) => <ResembleCard key={entry.id} entry={entry} keyword={keyword} />)
            : (paginatedItems as WordRootEntry[]).map((entry) => <WordRootCard key={entry.id} entry={entry} keyword={keyword} />)}
        </section>

        {filteredItems.length === 0 ? <Card className="border-[var(--border)] bg-[var(--card)]"><CardContent className="p-8 text-center text-sm text-[var(--text-soft)]">没有找到匹配的词汇内容。</CardContent></Card> : null}

        <Pagination currentPage={safeCurrentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    </main>
  );
}
