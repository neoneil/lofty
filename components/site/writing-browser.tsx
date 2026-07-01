"use client";

import { useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronRight, Download, PenLine } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Card, CardContent } from "@/components/ui-v2/card";

type WritingTopic = {
  id: string;
  year: number;
  month: number;
  day: number;
  question_en: string;
  question_zh: string | null;
  question_type: string | null;
  topic_category: string | null;
  created_at: string;
  updated_at: string;
};

type Props = {
  topics: WritingTopic[];
};

function formatDate(year: number, month: number, day: number) {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function formatQuestionType(type: string | null) {
  if (!type) return "general";

  const map: Record<string, string> = {
    agree: "agree / disagree",
    discuss: "discuss both views",
    problem: "problem / solution",
    advantage: "advantages / disadvantages",
    double: "double question",
    mixed: "mixed",
  };

  return map[type] ?? type;
}

export default function WritingBrowser({ topics }: Props) {
  const detailsRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeType, setActiveType] = useState("All");
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const topicsAfterCategory = useMemo(() => activeCategory === "All" ? topics : topics.filter((item) => (item.topic_category || "uncategorized") === activeCategory), [topics, activeCategory]);
  const topicsAfterType = useMemo(() => activeType === "All" ? topics : topics.filter((item) => (item.question_type || "general") === activeType), [topics, activeType]);

  const categoryFilters = useMemo(() => {
    const counts = topicsAfterType.reduce<Record<string, number>>((result, item) => {
      const category = item.topic_category || "uncategorized";
      result[category] = (result[category] || 0) + 1;
      return result;
    }, {});

    return [{ label: "All", count: topicsAfterType.length }, ...Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0])).map(([label, count]) => ({ label, count }))];
  }, [topicsAfterType]);

  const typeFilters = useMemo(() => {
    const counts = topicsAfterCategory.reduce<Record<string, number>>((result, item) => {
      const type = item.question_type || "general";
      result[type] = (result[type] || 0) + 1;
      return result;
    }, {});

    return [{ label: "All", count: topicsAfterCategory.length }, ...Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0])).map(([label, count]) => ({ label, count }))];
  }, [topicsAfterCategory]);

  const visibleTopics = useMemo(() => topics.filter((item) => {
    const categoryMatches = activeCategory === "All" || (item.topic_category || "uncategorized") === activeCategory;
    const typeMatches = activeType === "All" || (item.question_type || "general") === activeType;
    return categoryMatches && typeMatches;
  }), [topics, activeCategory, activeType]);

  const selectedTopic = topics.find((topic) => topic.id === selectedTopicId) ?? null;

  function scrollToDetails() {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    });
  }

  function handleSelectTopic(id: string) {
    setSelectedTopicId(id);
    scrollToDetails();
  }

  async function downloadPdf(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  }

  async function handleExportWriting() {
    try {
      setIsExporting(true);
      const response = await fetch("/api/ielts/writing/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category: activeCategory, questionType: activeType }) });
      if (!response.ok) throw new Error(await response.text() || "Writing PDF 导出失败");

      const safeCategory = activeCategory === "All" ? "all-category" : activeCategory;
      const safeType = activeType === "All" ? "all-type" : activeType;
      await downloadPdf(await response.blob(), `writing-task2-${safeCategory}-${safeType}.pdf`);
    } catch (error) {
      console.error(error);
      alert("Writing PDF 导出失败");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-faint)]">IELTS Writing</p>
            <h2 className="mt-1 text-xl font-semibold text-[var(--text)] sm:text-2xl">Task 2 Topics</h2>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{visibleTopics.length} topics</Badge>
            <Button type="button" size="sm" variant="secondary" onClick={handleExportWriting} disabled={isExporting} className="gap-2"><Download size={15} />{isExporting ? "导出中" : "下载 PDF"}</Button>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-[var(--text)]">Topic Category</p>
          <div className="flex flex-wrap gap-2">{categoryFilters.map((filter) => <Button key={filter.label} type="button" size="sm" variant={activeCategory === filter.label ? "primary" : "secondary"} onClick={() => { setActiveCategory(filter.label); setSelectedTopicId(null); }}>{filter.label} ({filter.count})</Button>)}</div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-[var(--text)]">Question Type</p>
          <div className="flex flex-wrap gap-2">{typeFilters.map((filter) => <Button key={filter.label} type="button" size="sm" variant={activeType === filter.label ? "primary" : "secondary"} onClick={() => { setActiveType(filter.label); setSelectedTopicId(null); }}>{formatQuestionType(filter.label)} ({filter.count})</Button>)}</div>
        </div>

        {selectedTopic ? (
          <div ref={detailsRef} className="scroll-mt-24">
            <Card className="border-[var(--primary)]/30">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap gap-2"><Badge>Task 2</Badge><Badge variant="secondary">{formatQuestionType(selectedTopic.question_type)}</Badge></div>
                    <h3 className="mt-3 text-base font-semibold leading-7 text-[var(--text)] sm:text-lg">{selectedTopic.question_en}</h3>
                  </div>
                  <button type="button" onClick={() => setSelectedTopicId(null)} className="shrink-0 text-sm font-semibold text-[var(--text-soft)] transition hover:text-[var(--primary)]">收起</button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-1.5 text-xs font-medium text-[var(--text-soft)]"><CalendarDays size={14} />{formatDate(selectedTopic.year, selectedTopic.month, selectedTopic.day)}</span>
                  <span className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-1.5 text-xs font-medium text-[var(--text-soft)]">{selectedTopic.topic_category || "uncategorized"}</span>
                </div>

                {selectedTopic.question_zh?.trim() ? <div className="mt-4 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] p-4"><p className="text-xs font-semibold uppercase text-[var(--primary)]">中文参考</p><p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">{selectedTopic.question_zh}</p></div> : null}
              </CardContent>
            </Card>
          </div>
        ) : null}

        <div className="grid items-start gap-3 md:grid-cols-2">
          {visibleTopics.map((topic) => (
            <button key={topic.id} type="button" onClick={() => handleSelectTopic(topic.id)} className="group h-full text-left">
              <Card className="h-full rounded-[var(--radius-md)] transition group-hover:-translate-y-0.5 group-hover:border-[var(--primary)] group-hover:shadow-[var(--shadow-md)]">
                <CardContent className="flex h-full flex-col p-4">
                  <div className="flex items-center justify-between gap-2"><Badge variant="secondary">{topic.topic_category || "Writing"}</Badge><span className="text-xs font-semibold text-[var(--text-faint)]">{formatDate(topic.year, topic.month, topic.day)}</span></div>
                  <h3 className="mt-3 line-clamp-3 text-sm font-semibold leading-6 text-[var(--text)] group-hover:text-[var(--primary)] sm:text-base">{topic.question_en}</h3>
                  {topic.question_zh?.trim() ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--text-soft)]">{topic.question_zh}</p> : null}
                  <div className="mt-auto flex items-center justify-between pt-4 text-xs"><span className="inline-flex items-center gap-1 text-[var(--text-faint)]"><PenLine size={13} />{formatQuestionType(topic.question_type)}</span><span className="flex items-center font-semibold text-[var(--primary)]">查看详情<ChevronRight size={14} /></span></div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
