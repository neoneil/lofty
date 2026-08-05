"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Layers3, Search, Star, X } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Input } from "@/components/ui-v2/input";
import type { IeltsSpeakingVocabularyDocument, IeltsSpeakingVocabularyItem, IeltsSpeakingVocabularyTopic } from "@/lib/vocabulary/ielts-speaking-types";

type Props = {
  document: IeltsSpeakingVocabularyDocument;
};

function getItemSearchText(item: IeltsSpeakingVocabularyItem, topic: IeltsSpeakingVocabularyTopic) {
  return [item.term, item.translation, item.itemType, topic.title, topic.partTitle, item.raw].join(" ").toLowerCase();
}

function chunkItems(items: IeltsSpeakingVocabularyItem[]) {
  const chunkSize = Math.ceil(items.length / 3) || 1;
  return [items.slice(0, chunkSize), items.slice(chunkSize, chunkSize * 2), items.slice(chunkSize * 2)];
}

function VocabularyTable({ items, topic }: { items: IeltsSpeakingVocabularyItem[]; topic: IeltsSpeakingVocabularyTopic }) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
      <table className="w-full table-fixed border-collapse text-left">
        <colgroup>
          <col className="w-9" />
          <col />
          <col className="w-16" />
          <col className="w-[30%]" />
        </colgroup>
        <tbody className="divide-y divide-[var(--border)]">
          {items.map((item, index) => (
            <tr key={`${topic.topicCode}-${item.number}-${item.term}`} className={`transition hover:bg-[var(--primary-soft)]/40 ${index % 2 === 0 ? "bg-[var(--card)]" : "bg-[var(--bg-soft)]"}`}>
              <td className="px-2.5 py-2 align-top text-xs font-bold tabular-nums text-[var(--primary)]">{item.number}</td>
              <td className="px-2.5 py-2 align-top text-sm font-bold leading-6 text-[var(--text)]">
                <div className="flex min-w-0 items-center gap-1.5">
                  {item.starred ? <Star size={12} className="shrink-0 fill-[var(--warning)] text-[var(--warning)]" /> : null}
                  <span className="truncate">{item.term}</span>
                </div>
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

export default function IeltsSpeakingVocabularyClient({ document }: Props) {
  const [activePartNumber, setActivePartNumber] = useState(document.parts[0]?.partNumber ?? 1);
  const [activeTopicCode, setActiveTopicCode] = useState(document.topics.find((topic) => topic.partNumber === activePartNumber)?.topicCode ?? document.topics[0]?.topicCode ?? "");
  const [searchTerm, setSearchTerm] = useState("");
  const [phrasesOnly, setPhrasesOnly] = useState(false);

  const activePartTopics = useMemo(() => document.topics.filter((topic) => topic.partNumber === activePartNumber), [activePartNumber, document.topics]);
  const activeTopic = activePartTopics.find((topic) => topic.topicCode === activeTopicCode) ?? activePartTopics[0] ?? document.topics[0];
  const keyword = searchTerm.trim().toLowerCase();

  const filteredItems = useMemo(() => {
    const items = activeTopic?.items ?? [];
    return items.filter((item) => {
      if (phrasesOnly && item.itemType !== "Phrase") return false;
      if (!keyword) return true;
      return getItemSearchText(item, activeTopic).includes(keyword);
    });
  }, [activeTopic, keyword, phrasesOnly]);

  const itemColumns = useMemo(() => chunkItems(filteredItems), [filteredItems]);

  function selectPart(partNumber: number) {
    setActivePartNumber(partNumber);
    setActiveTopicCode(document.topics.find((topic) => topic.partNumber === partNumber)?.topicCode ?? "");
    setSearchTerm("");
  }

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
                <Badge>IELTS Speaking</Badge>
                <Badge variant="secondary">{document.wordCount} words</Badge>
                <Badge variant="secondary">{document.topicCount} topics</Badge>
                <Badge variant="secondary">{document.partCount} parts</Badge>
              </div>
              <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">{document.subtitle}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{activeTopic?.partTitle ?? "Part"}</Badge>
              <Badge variant="outline">{activeTopic?.topicCode ?? "Topic"}</Badge>
              <Badge variant="outline">{filteredItems.length} / {activeTopic?.itemCount ?? 0}</Badge>
              {keyword ? <Badge variant="outline">Search: {searchTerm.trim()}</Badge> : null}
            </div>
          </div>
        </section>

        <section className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-3 shadow-[var(--shadow-sm)]">
          <div className="flex flex-col gap-3">
            <div className="grid gap-2 md:grid-cols-3">
              {document.parts.map((part) => (
                <button key={part.partNumber} type="button" onClick={() => selectPart(part.partNumber)} className={`rounded-[var(--radius-md)] border px-3 py-3 text-left transition ${activePartNumber === part.partNumber ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)] shadow-[var(--shadow-sm)]" : "border-[var(--border)] bg-[var(--card)] text-[var(--text)] hover:border-[var(--primary)]/40 hover:bg-[var(--bg-soft)]"}`}>
                  <span className="flex items-center gap-2 text-sm font-bold"><Layers3 size={15} />{part.title}</span>
                  <span className="mt-1 block text-xs font-semibold text-[var(--text-faint)]">{part.topicCount} 分类 · {part.wordCount} 词</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-1.5 border-t border-[var(--border)] pt-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7">
              {activePartTopics.map((topic) => (
                <button key={topic.topicCode} type="button" onClick={() => setActiveTopicCode(topic.topicCode)} className={`min-h-[46px] rounded-[var(--radius-sm)] border px-2 py-1.5 text-center transition ${activeTopic?.topicCode === topic.topicCode ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)] shadow-[var(--shadow-sm)]" : "border-[var(--border)] bg-[var(--card)] text-[var(--text-soft)] hover:border-[var(--primary)]/40 hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"}`}>
                  <span className="block truncate text-[11px] font-bold leading-4">{topic.title}</span>
                  <span className="block text-[10px] font-semibold leading-4 text-[var(--text-faint)]">{topic.topicCode} · {topic.itemCount}词</span>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2 border-t border-[var(--border)] pt-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-1.5">
                {activeTopic?.subcategories.map((subcategory, index) => <Badge key={`${subcategory.id}-${index}`} variant="outline" className="px-2 py-0.5 text-[11px]">{subcategory.label} · {subcategory.itemCount}</Badge>)}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button type="button" variant={phrasesOnly ? "primary" : "secondary"} size="sm" onClick={() => setPhrasesOnly((value) => !value)} className="h-8 justify-center px-3 text-xs">
                  <Star size={13} />
                  短语
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
          </div>
        </section>

        <section className="grid gap-2 lg:grid-cols-2 2xl:grid-cols-3">
          {activeTopic ? itemColumns.map((items, index) => items.length > 0 ? <VocabularyTable key={`${activeTopic.topicCode}-${index}`} items={items} topic={activeTopic} /> : null) : null}
        </section>

        {filteredItems.length === 0 ? (
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-8 text-center text-sm text-[var(--text-soft)]">没有找到匹配词条。</div>
        ) : null}

        <div className="h-8" />
      </div>
    </main>
  );
}
