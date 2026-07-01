"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui-v2/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui-v2/card";
import { Textarea } from "@/components/ui-v2/textarea";
import { EmptyAssessment } from "@/components/mock-assessment/choice-assessment-section";
import type { SpeakingAssessment, WritingAssessment } from "@/lib/mock-assessment/types";

export function SpeakingAssessmentSection({ assessment }: { assessment: SpeakingAssessment | null }) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  if (!assessment) return <EmptyAssessment title="口语能力" />;
  return <Card><CardHeader><div><CardTitle>口语能力</CardTitle><CardDescription>Part 1 三题、Part 2 一题，以及与 Part 2 对应的 Part 3 延伸题。</CardDescription></div><Badge variant="secondary">5 questions</Badge></CardHeader><CardContent className="space-y-5">
    <section className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 sm:p-5"><div className="flex flex-wrap items-center gap-2"><Badge>Part 1</Badge><h3 className="font-semibold text-[var(--text)]">{assessment.part1Topic}</h3></div><ol className="mt-4 space-y-3">{assessment.part1Questions.map((question, index) => <li key={question} className="flex gap-3 text-sm leading-7 text-[var(--text)]"><span className="font-bold text-[var(--primary)]">{index + 1}.</span><span>{question}</span></li>)}</ol><Textarea value={notes["part-1"] ?? ""} onChange={(event) => setNotes((current) => ({ ...current, "part-1": event.target.value }))} placeholder="记录 Part 1 回答要点..." className="mt-4 min-h-28" /></section>
    <section className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 sm:p-5"><div className="flex flex-wrap items-center gap-2"><Badge>Part 2</Badge><h3 className="font-semibold text-[var(--text)]">{assessment.part2Title}</h3></div><p className="mt-4 text-sm font-semibold leading-7 text-[var(--text)]">{assessment.part2Question}</p>{assessment.cueCards.length ? <div className="mt-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] p-3"><p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-faint)]">You should say</p><ul className="mt-2 space-y-2 text-sm leading-6 text-[var(--text-soft)]">{assessment.cueCards.map((cue) => <li key={cue} className="flex gap-2"><span className="text-[var(--primary)]">•</span><span>{cue}</span></li>)}</ul></div> : null}<Textarea value={notes["part-2"] ?? ""} onChange={(event) => setNotes((current) => ({ ...current, "part-2": event.target.value }))} placeholder="记录 Part 2 提纲..." className="mt-4 min-h-28" /></section>
    <section className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 sm:p-5"><div className="flex flex-wrap items-center gap-2"><Badge>Part 3</Badge><h3 className="font-semibold text-[var(--text)]">Discussion</h3></div><p className="mt-4 text-sm leading-7 text-[var(--text)]">{assessment.part3Question}</p><Textarea value={notes["part-3"] ?? ""} onChange={(event) => setNotes((current) => ({ ...current, "part-3": event.target.value }))} placeholder="记录 Part 3 论述思路..." className="mt-4 min-h-28" /></section>
  </CardContent></Card>;
}

export function WritingAssessmentSection({ assessment }: { assessment: WritingAssessment | null }) {
  const [answer, setAnswer] = useState("");
  const wordCount = useMemo(() => answer.trim().split(/\s+/).filter(Boolean).length, [answer]);
  if (!assessment) return <EmptyAssessment title="写作能力" />;
  return <Card><CardHeader><div><CardTitle>写作能力</CardTitle><CardDescription>随机抽取 1 道 IELTS Writing Task 2，建议完成不少于 250 词。</CardDescription></div><Badge variant={wordCount >= 250 ? "success" : "secondary"}>{wordCount} words</Badge></CardHeader><CardContent><section className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 sm:p-6"><div className="flex flex-wrap gap-2">{assessment.category ? <Badge>{assessment.category}</Badge> : null}{assessment.questionType ? <Badge variant="secondary">{assessment.questionType}</Badge> : null}</div><p className="mt-4 text-base font-semibold leading-8 text-[var(--text)] sm:text-lg">{assessment.question}</p>{assessment.questionZh ? <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">{assessment.questionZh}</p> : null}</section><Textarea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Write your essay here..." className="mt-5 min-h-[360px]" /></CardContent></Card>;
}
