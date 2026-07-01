"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui-v2/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui-v2/card";
import { EmptyAssessment } from "@/components/mock-assessment/choice-assessment-section";
import type { ReadingBlank, ReadingQuestion } from "@/lib/mock-assessment/types";

function ReadingBlankSelect({ blank, value, revealed, onChange }: { blank: ReadingBlank; value: string; revealed: boolean; onChange: (value: string) => void }) {
  const correct = revealed && value === blank.answer;
  const wrong = revealed && value !== blank.answer;
  return <span className="mx-1 inline-flex flex-col align-middle"><select value={value} onChange={(event) => onChange(event.target.value)} className={`h-10 min-w-36 rounded-[var(--radius-sm)] border bg-[var(--card)] px-3 text-sm font-medium outline-none ${correct ? "border-[var(--success)] text-[var(--success)]" : wrong ? "border-[var(--danger)] text-[var(--danger)]" : "border-[var(--border)] text-[var(--text)] focus:border-[var(--primary)]"}`}><option value="">Select</option>{blank.options.map((option) => <option key={option} value={option}>{option}</option>)}</select>{revealed ? <span className="mt-1 text-[10px] font-semibold text-[var(--success)]">Answer: {blank.answer}</span> : null}</span>;
}

export function ReadingAssessmentSection({ questions }: { questions: ReadingQuestion[] }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState(false);
  const score = useMemo(() => questions.flatMap((question) => question.blanks.map((blank) => answers[`${question.id}-${blank.blankIndex}`] === blank.answer)).filter(Boolean).length, [answers, questions]);
  const total = questions.reduce((sum, question) => sum + question.blanks.length, 0);

  if (!questions.length) return <EmptyAssessment title="阅读能力" />;

  return <Card><CardHeader><div><CardTitle>阅读能力</CardTitle><CardDescription>随机抽取 2 道 FIBRW，结合上下文、词汇与语法完成填空。</CardDescription></div><span className="text-sm font-semibold text-[var(--primary)]">{revealed ? `${score} / ${total}` : `${total} blanks`}</span></CardHeader><CardContent className="space-y-6">{questions.map((question, index) => {
    const parts = question.body.split(/(\[\[blank_\d+\]\])/g);
    return <section key={question.id} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 sm:p-6"><p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">Passage {index + 1}</p><h3 className="mt-2 text-base font-semibold text-[var(--text)]">{question.title}</h3><div className="mt-4 text-[15px] leading-[2.8] text-[var(--text)]">{parts.map((part, partIndex) => {
      const match = part.match(/\[\[blank_(\d+)\]\]/);
      if (!match) return <span key={`${question.id}-text-${partIndex}`}>{part}</span>;
      const blank = question.blanks.find((item) => item.blankIndex === Number(match[1]));
      if (!blank) return null;
      const answerKey = `${question.id}-${blank.blankIndex}`;
      return <ReadingBlankSelect key={`${question.id}-blank-${partIndex}`} blank={blank} value={answers[answerKey] ?? ""} revealed={revealed} onChange={(value) => { setAnswers((current) => ({ ...current, [answerKey]: value })); setRevealed(false); }} />;
    })}</div></section>;
  })}<div className="flex justify-end"><Button type="button" onClick={() => setRevealed(true)}>核对阅读答案</Button></div></CardContent></Card>;
}
