"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui-v2/card";
import type { ChoiceQuestion } from "@/lib/mock-assessment/types";

export function ChoiceAssessmentSection({ title, description, questions }: { title: string; description: string; questions: ChoiceQuestion[] }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState(false);
  const score = useMemo(() => questions.filter((question) => answers[question.id] === question.answer).length, [answers, questions]);

  if (questions.length === 0) return <EmptyAssessment title={title} />;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></div>
        {revealed ? <Badge variant={score >= Math.ceil(questions.length * 0.7) ? "success" : "warning"}>{score} / {questions.length}</Badge> : <Badge variant="secondary">{questions.length} 题</Badge>}
      </CardHeader>
      <CardContent className="space-y-5">
        {questions.map((question, questionIndex) => (
          <section key={question.id} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 sm:p-5">
            <div className="flex items-start gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary-soft)] text-xs font-bold text-[var(--primary)]">{questionIndex + 1}</span><div><h3 className="text-base font-semibold leading-7 text-[var(--text)] sm:text-lg">{question.prompt}</h3>{question.meta ? <p className="mt-1 text-xs uppercase tracking-wide text-[var(--text-faint)]">{question.meta}</p> : null}</div></div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {question.options.map((option, optionIndex) => {
                const selected = answers[question.id] === option;
                const correct = revealed && option === question.answer;
                const wrong = revealed && selected && option !== question.answer;
                return <button key={`${question.id}-${option}`} type="button" onClick={() => { setAnswers((current) => ({ ...current, [question.id]: option })); setRevealed(false); }} className={`flex min-h-12 items-center gap-3 rounded-[var(--radius-sm)] border px-3 py-2.5 text-left text-sm transition ${correct ? "border-[var(--success)]/40 bg-[var(--success-soft)] text-[var(--success)]" : wrong ? "border-[var(--danger)]/40 bg-[var(--danger-soft)] text-[var(--danger)]" : selected ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--text)]" : "border-[var(--border)] bg-[var(--card)] text-[var(--text-soft)] hover:border-[var(--primary)]/45 hover:text-[var(--text)]"}`}><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current text-[11px] font-bold">{String.fromCharCode(65 + optionIndex)}</span><span>{option}</span>{correct ? <CheckCircle2 className="ml-auto shrink-0" size={16} /> : null}</button>;
              })}
            </div>
            {revealed && question.explanation ? <p className="mt-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm leading-6 text-[var(--text-soft)]">{question.explanation}</p> : null}
          </section>
        ))}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={() => { setAnswers({}); setRevealed(false); }} className="gap-2"><RotateCcw size={16} />重新作答</Button><Button type="button" onClick={() => setRevealed(true)}>核对答案</Button></div>
      </CardContent>
    </Card>
  );
}

export function EmptyAssessment({ title }: { title: string }) {
  return <Card><CardContent className="p-8 text-center"><h2 className="font-semibold text-[var(--text)]">{title}</h2><p className="mt-2 text-sm text-[var(--text-soft)]">当前题库没有返回可用题目，请刷新后重试。</p></CardContent></Card>;
}
