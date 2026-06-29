"use client";

import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

import { Button } from "@/components/ui-v2/button";
import type { QuizSingleDefinition } from "@/lib/course-markdown/parse-quiz";
import QuizCard from "./quiz-card";

export default function QuizSingle({ quiz }: { quiz: QuizSingleDefinition }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const isCorrect = selectedIndex === quiz.answerIndex;

  return (
    <QuizCard title={quiz.title} label="Single Choice">
      <p className="m-0 text-base font-semibold leading-7 text-[var(--text)]">{quiz.question}</p>
      <div className="mt-4 grid gap-2.5" role="radiogroup" aria-label={quiz.question}>
        {quiz.options.map((option, index) => {
          const selected = selectedIndex === index;
          return <button key={`${index}-${option}`} type="button" role="radio" aria-checked={selected} onClick={() => { setSelectedIndex(index); setSubmitted(false); }} className={`flex min-h-12 w-full items-start gap-3 rounded-[var(--radius-md)] border px-3.5 py-3 text-left text-sm leading-6 transition sm:px-4 ${selected ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--text)]" : "border-[var(--border)] bg-[var(--card)] text-[var(--text-soft)] hover:border-[var(--primary)]/60 hover:bg-[var(--bg-soft)]"}`}><span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${selected ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text-faint)]"}`}>{String.fromCharCode(65 + index)}</span><span>{option}</span></button>;
        })}
      </div>
      <Button type="button" size="sm" disabled={selectedIndex === null} onClick={() => setSubmitted(true)} className="mt-4 w-full sm:w-auto">Check Answer</Button>
      {submitted ? <div className="mt-4 space-y-3" role="status"><div className={`rounded-[var(--radius-md)] border p-4 ${isCorrect ? "border-[var(--success)]/35 bg-[var(--success-soft)]" : "border-[var(--danger)]/35 bg-[var(--danger-soft)]"}`}><div className={`flex items-center gap-2 text-sm font-bold ${isCorrect ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>{isCorrect ? <CheckCircle2 size={18} aria-hidden="true" /> : <XCircle size={18} aria-hidden="true" />}{isCorrect ? "Correct" : "Incorrect"}</div>{!isCorrect ? <p className="mt-2 text-sm font-semibold leading-6 text-[var(--text)]">Correct Answer: {String.fromCharCode(65 + quiz.answerIndex)}. {quiz.options[quiz.answerIndex]}</p> : null}</div><div className="rounded-[var(--radius-md)] border border-[var(--primary)]/25 bg-[var(--primary-soft)] p-4"><div className="text-xs font-bold uppercase tracking-wide text-[var(--primary)]">Explanation</div><p className="mt-1 text-sm leading-6 text-[var(--text-soft)]">{quiz.explanation}</p></div></div> : null}
    </QuizCard>
  );
}
