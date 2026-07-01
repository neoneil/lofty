"use client";

import { useState } from "react";

import { EmptyAssessment } from "@/components/mock-assessment/choice-assessment-section";
import AudioPlayer from "@/components/site/AudioPlayer";
import { Button } from "@/components/ui-v2/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui-v2/card";
import { Input } from "@/components/ui-v2/input";
import type { ListeningQuestion } from "@/lib/mock-assessment/types";

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

export function ListeningAssessmentSection({ questions }: { questions: ListeningQuestion[] }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState(false);
  if (!questions.length) return <EmptyAssessment title="听力能力" />;

  return <Card><CardHeader><div><CardTitle>听力能力</CardTitle><CardDescription>随机抽取 3 道 WFD。听完后输入完整句子，再统一核对。</CardDescription></div></CardHeader><CardContent className="space-y-5">{questions.map((question, index) => {
    const correct = revealed && normalize(answers[question.id] ?? "") === normalize(question.answer);
    return <section key={question.id} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 sm:p-5"><div className="mb-3 flex items-center justify-between gap-3"><h3 className="font-semibold text-[var(--text)]">WFD {index + 1}</h3>{revealed ? <span className={`text-xs font-semibold ${correct ? "text-[var(--success)]" : "text-[var(--warning)]"}`}>{correct ? "完全正确" : "请对照答案"}</span> : null}</div><AudioPlayer url={question.audioUrl} size="compact" /><Input value={answers[question.id] ?? ""} onChange={(event) => { setAnswers((current) => ({ ...current, [question.id]: event.target.value })); setRevealed(false); }} placeholder="Type the sentence you heard..." className="mt-4" />{revealed ? <div className="mt-3 rounded-[var(--radius-sm)] border border-[var(--success)]/25 bg-[var(--success-soft)] px-3 py-2 text-sm leading-6 text-[var(--success)]"><span className="font-semibold">Answer: </span>{question.answer}</div> : null}</section>;
  })}<div className="flex justify-end"><Button type="button" onClick={() => setRevealed(true)}>核对听力答案</Button></div></CardContent></Card>;
}
