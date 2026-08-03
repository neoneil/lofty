"use client";

import { useMemo, useRef, useState } from "react";
import { BookOpenText, ChevronRight, Download, MessagesSquare } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Card, CardContent } from "@/components/ui-v2/card";
import IeltsSpeakingAiScoring from "@/components/ielts-speaking/ielts-speaking-ai-scoring";

type SpeakingPart1Question = {
  id: number;
  topic_title: string;
  question_number: number;
  question_text: string;
  answer_text?: string | null;
};

type SpeakingPart2Topic = {
  id: number;
  chinese_title: string | null;
  english_title: string | null;
  part2_question: string | null;
  cue_card_1: string | null;
  cue_card_2: string | null;
  cue_card_3: string | null;
  cue_card_4: string | null;
  part3_q1: string | null;
  part3_q2: string | null;
  part3_q3: string | null;
  part3_q4: string | null;
  part3_q5: string | null;
  part3_q6: string | null;
  part3_q7: string | null;
  part3_q8: string | null;
  part3_q9: string | null;
  part3_q10: string | null;
  category: string | null;
  difficulty: string | null;
  status: string | null;
  sort_order: number | null;
};

type Props = {
  part1Questions: SpeakingPart1Question[];
  part2Topics: SpeakingPart2Topic[];
};

type Part1Group = {
  topic: string;
  items: SpeakingPart1Question[];
};

function getPart3Questions(topic: SpeakingPart2Topic) {
  return [topic.part3_q1, topic.part3_q2, topic.part3_q3, topic.part3_q4, topic.part3_q5, topic.part3_q6, topic.part3_q7, topic.part3_q8, topic.part3_q9, topic.part3_q10].filter(Boolean) as string[];
}

function getCueCards(topic: SpeakingPart2Topic) {
  return [topic.cue_card_1, topic.cue_card_2, topic.cue_card_3, topic.cue_card_4].filter(Boolean) as string[];
}

export default function SpeakingBrowser({ part1Questions, part2Topics }: Props) {
  const detailsRef = useRef<HTMLDivElement>(null);
  const [activePart, setActivePart] = useState<"part1" | "part23">("part1");
  const [activePart1Topic, setActivePart1Topic] = useState("All");
  const [activePart2Category, setActivePart2Category] = useState("All");
  const [selectedPart1Topic, setSelectedPart1Topic] = useState<string | null>(null);
  const [selectedPart2Id, setSelectedPart2Id] = useState<number | null>(null);
  const [isExportingPart1, setIsExportingPart1] = useState(false);
  const [isExportingPart2, setIsExportingPart2] = useState(false);

  const groupedPart1 = useMemo(() => Object.values(part1Questions.reduce<Record<string, Part1Group>>((groups, item) => {
    groups[item.topic_title] ??= { topic: item.topic_title, items: [] };
    groups[item.topic_title].items.push(item);
    return groups;
  }, {})).sort((a, b) => a.topic.localeCompare(b.topic)), [part1Questions]);

  const part1Filters = useMemo(() => [{ label: "All", count: part1Questions.length }, ...groupedPart1.map((group) => ({ label: group.topic, count: group.items.length }))], [groupedPart1, part1Questions.length]);
  const visiblePart1Groups = useMemo(() => activePart1Topic === "All" ? groupedPart1 : groupedPart1.filter((group) => group.topic === activePart1Topic), [activePart1Topic, groupedPart1]);
  const selectedPart1Group = groupedPart1.find((group) => group.topic === selectedPart1Topic) ?? null;

  const part2Filters = useMemo(() => {
    const counts = part2Topics.reduce<Record<string, number>>((result, item) => {
      const category = item.category || "Uncategorized";
      result[category] = (result[category] || 0) + 1;
      return result;
    }, {});
    return [{ label: "All", count: part2Topics.length }, ...Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0])).map(([label, count]) => ({ label, count }))];
  }, [part2Topics]);

  const visiblePart2Topics = useMemo(() => activePart2Category === "All" ? part2Topics : part2Topics.filter((item) => (item.category || "Uncategorized") === activePart2Category), [activePart2Category, part2Topics]);
  const selectedPart2Topic = part2Topics.find((topic) => topic.id === selectedPart2Id) ?? null;

  function scrollToDetails() {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    });
  }

  function handleSelectPart1Topic(topic: string) {
    setSelectedPart1Topic(topic);
    scrollToDetails();
  }

  function handleSelectPart2Topic(id: number) {
    setSelectedPart2Id(id);
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

  async function handleExportPart1() {
    try {
      setIsExportingPart1(true);
      const response = await fetch("/api/ielts/speaking/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ part: "part1", topic: activePart1Topic }) });
      if (!response.ok) throw new Error(await response.text() || "Part 1 PDF 导出失败");
      await downloadPdf(await response.blob(), activePart1Topic === "All" ? "speaking-part1-all.pdf" : `speaking-part1-${activePart1Topic}.pdf`);
    } catch (error) {
      console.error(error);
      alert("Part 1 PDF 导出失败");
    } finally {
      setIsExportingPart1(false);
    }
  }

  async function handleExportPart2() {
    try {
      setIsExportingPart2(true);
      const response = await fetch("/api/ielts/speaking/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ part: "part2", category: activePart2Category }) });
      if (!response.ok) throw new Error(await response.text() || "Part 2/3 PDF 导出失败");
      await downloadPdf(await response.blob(), activePart2Category === "All" ? "speaking-part2-3-all.pdf" : `speaking-part2-3-${activePart2Category}.pdf`);
    } catch (error) {
      console.error(error);
      alert("Part 2/3 PDF 导出失败");
    } finally {
      setIsExportingPart2(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-1.5">
        <button type="button" onClick={() => setActivePart("part1")} className={`flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-sm)] px-3 text-sm font-semibold transition ${activePart === "part1" ? "bg-[var(--card)] text-[var(--primary)] shadow-[var(--shadow-sm)]" : "text-[var(--text-soft)] hover:text-[var(--text)]"}`}><BookOpenText size={17} />Part 1</button>
        <button type="button" onClick={() => setActivePart("part23")} className={`flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-sm)] px-3 text-sm font-semibold transition ${activePart === "part23" ? "bg-[var(--card)] text-[var(--primary)] shadow-[var(--shadow-sm)]" : "text-[var(--text-soft)] hover:text-[var(--text)]"}`}><MessagesSquare size={17} />Part 2 &amp; 3</button>
      </div>

      {activePart === "part1" ? (
        <section className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-faint)]">IELTS Speaking</p><h2 className="mt-1 text-xl font-semibold text-[var(--text)] sm:text-2xl">Part 1 Topics</h2></div>
            <div className="flex items-center gap-2"><Badge variant="secondary">{visiblePart1Groups.length} topics</Badge><Button type="button" size="sm" variant="secondary" onClick={handleExportPart1} disabled={isExportingPart1} className="gap-2"><Download size={15} />{isExportingPart1 ? "导出中" : "下载 PDF"}</Button></div>
          </div>

          <div className="flex flex-wrap gap-2">{part1Filters.map((filter) => <Button key={filter.label} type="button" size="sm" variant={activePart1Topic === filter.label ? "primary" : "secondary"} onClick={() => { setActivePart1Topic(filter.label); setSelectedPart1Topic(null); }}>{filter.label} ({filter.count})</Button>)}</div>

          {selectedPart1Group ? (
            <div ref={detailsRef} className="scroll-mt-24"><Card className="border-[var(--primary)]/30"><CardContent className="p-4 sm:p-5"><div className="flex items-center justify-between gap-3"><div><Badge>Part 1</Badge><h3 className="mt-2 text-lg font-semibold text-[var(--text)]">{selectedPart1Group.topic}</h3></div><button type="button" onClick={() => setSelectedPart1Topic(null)} className="text-sm font-semibold text-[var(--text-soft)] transition hover:text-[var(--primary)]">收起</button></div><div className="mt-4 grid gap-3 md:grid-cols-2">{selectedPart1Group.items.map((item) => <div key={item.id} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] p-3"><p className="text-xs font-semibold text-[var(--text-faint)]">Question {item.question_number}</p><p className="mt-1.5 text-sm font-semibold leading-6 text-[var(--text)]">{item.question_text}</p>{item.answer_text ? <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{item.answer_text}</p> : null}<div className="mt-3 flex justify-end"><IeltsSpeakingAiScoring context={{ part: "part1", questionId: `part1:${item.id}`, topicTitle: selectedPart1Group.topic, questionText: item.question_text }} /></div></div>)}</div></CardContent></Card></div>
          ) : null}

          <div className="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{visiblePart1Groups.map((group) => <button key={group.topic} type="button" onClick={() => handleSelectPart1Topic(group.topic)} className="group text-left"><Card className="h-full rounded-[var(--radius-md)] transition group-hover:-translate-y-0.5 group-hover:border-[var(--primary)] group-hover:shadow-[var(--shadow-md)]"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><Badge variant="secondary">Part 1</Badge><span className="text-xs font-semibold text-[var(--text-faint)]">{group.items.length} 题</span></div><h3 className="mt-3 line-clamp-2 min-h-12 text-base font-semibold leading-6 text-[var(--text)] group-hover:text-[var(--primary)]">{group.topic}</h3><p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--text-soft)]">{group.items[0]?.question_text}</p><div className="mt-3 flex items-center justify-end text-xs font-semibold text-[var(--primary)]">查看题目<ChevronRight size={14} /></div></CardContent></Card></button>)}</div>
        </section>
      ) : (
        <section className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-faint)]">IELTS Speaking</p><h2 className="mt-1 text-xl font-semibold text-[var(--text)] sm:text-2xl">Part 2 &amp; 3 Topics</h2></div>
            <div className="flex items-center gap-2"><Badge variant="secondary">{visiblePart2Topics.length} topics</Badge><Button type="button" size="sm" variant="secondary" onClick={handleExportPart2} disabled={isExportingPart2} className="gap-2"><Download size={15} />{isExportingPart2 ? "导出中" : "下载 PDF"}</Button></div>
          </div>

          <div className="flex flex-wrap gap-2">{part2Filters.map((filter) => <Button key={filter.label} type="button" size="sm" variant={activePart2Category === filter.label ? "primary" : "secondary"} onClick={() => { setActivePart2Category(filter.label); setSelectedPart2Id(null); }}>{filter.label} ({filter.count})</Button>)}</div>

          {selectedPart2Topic ? (
            <div ref={detailsRef} className="scroll-mt-24"><Card className="border-[var(--primary)]/30"><CardContent className="p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap gap-2"><Badge>Part 2 &amp; 3</Badge>{selectedPart2Topic.difficulty ? <Badge variant="secondary">{selectedPart2Topic.difficulty}</Badge> : null}</div><h3 className="mt-2 text-lg font-semibold text-[var(--text)]">{selectedPart2Topic.english_title || selectedPart2Topic.part2_question || "Untitled"}</h3>{selectedPart2Topic.chinese_title ? <p className="mt-1 text-sm text-[var(--text-soft)]">{selectedPart2Topic.chinese_title}</p> : null}</div><button type="button" onClick={() => setSelectedPart2Id(null)} className="shrink-0 text-sm font-semibold text-[var(--text-soft)] transition hover:text-[var(--primary)]">收起</button></div>{selectedPart2Topic.part2_question ? <div className="mt-4 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase text-[var(--primary)]">Part 2 Question</p><p className="mt-2 text-sm font-semibold leading-7 text-[var(--text)]">{selectedPart2Topic.part2_question}</p></div><IeltsSpeakingAiScoring context={{ part: "part2", questionId: `part2:${selectedPart2Topic.id}`, topicTitle: selectedPart2Topic.english_title ?? selectedPart2Topic.chinese_title ?? undefined, part2Question: selectedPart2Topic.part2_question ?? undefined, cueCards: getCueCards(selectedPart2Topic), category: selectedPart2Topic.category }} /></div>{getCueCards(selectedPart2Topic).length ? <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--text-soft)]">{getCueCards(selectedPart2Topic).map((cue) => <li key={cue} className="flex gap-2"><span className="text-[var(--primary)]">•</span><span>{cue}</span></li>)}</ul> : null}</div> : null}{getPart3Questions(selectedPart2Topic).length ? <div className="mt-4"><p className="text-xs font-semibold uppercase text-[var(--primary)]">Part 3 Discussion</p><div className="mt-2 grid gap-2 md:grid-cols-2">{getPart3Questions(selectedPart2Topic).map((question, index) => <div key={question} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] p-3 text-sm leading-6 text-[var(--text)]"><div><span className="mr-2 font-semibold text-[var(--text-faint)]">Q{index + 1}.</span>{question}</div><div className="mt-3 flex justify-end"><IeltsSpeakingAiScoring context={{ part: "part3", questionId: `part3:${selectedPart2Topic.id}:${index + 1}`, topicTitle: selectedPart2Topic.english_title ?? selectedPart2Topic.chinese_title ?? undefined, questionText: question, part2Question: selectedPart2Topic.part2_question ?? undefined, category: selectedPart2Topic.category }} /></div></div>)}</div></div> : null}</CardContent></Card></div>
          ) : null}

          <div className="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{visiblePart2Topics.map((topic) => <button key={topic.id} type="button" onClick={() => handleSelectPart2Topic(topic.id)} className="group text-left"><Card className="h-full rounded-[var(--radius-md)] transition group-hover:-translate-y-0.5 group-hover:border-[var(--primary)] group-hover:shadow-[var(--shadow-md)]"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><Badge variant="secondary">{topic.category || "General"}</Badge>{topic.difficulty ? <span className="text-[10px] font-semibold uppercase text-[var(--text-faint)]">{topic.difficulty}</span> : null}</div><h3 className="mt-3 line-clamp-2 min-h-12 text-sm font-semibold leading-6 text-[var(--text)] group-hover:text-[var(--primary)]">{topic.english_title || topic.part2_question || "Untitled"}</h3>{topic.chinese_title ? <p className="mt-1 line-clamp-1 text-xs text-[var(--text-soft)]">{topic.chinese_title}</p> : null}<div className="mt-3 flex items-center justify-between text-xs"><span className="text-[var(--text-faint)]">{getPart3Questions(topic).length} Part 3</span><span className="flex items-center font-semibold text-[var(--primary)]">查看详情<ChevronRight size={14} /></span></div></CardContent></Card></button>)}</div>
        </section>
      )}
    </div>
  );
}
