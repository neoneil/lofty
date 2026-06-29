"use client";

import { useState } from "react";
import { BookOpenCheck } from "lucide-react";

import { Button } from "@/components/ui-v2/button";
import type { QuizShortAnswerDefinition } from "@/lib/course-markdown/parse-quiz";
import QuizCard from "./quiz-card";

export default function QuizShortAnswer({ quiz }: { quiz: QuizShortAnswerDefinition }) {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <QuizCard title={quiz.title} label="Short Answer">
      <p className="m-0 text-base font-semibold leading-7 text-[var(--text)]">{quiz.question}</p>
      <textarea value={answer} onChange={(event) => { setAnswer(event.target.value); setSubmitted(false); }} rows={4} placeholder="Write your answer here..." className="mt-4 w-full resize-y rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] px-3.5 py-3 text-sm leading-6 text-[var(--text)] outline-none transition placeholder:text-[var(--text-faint)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15" />
      <Button type="button" size="sm" disabled={!answer.trim()} onClick={() => setSubmitted(true)} className="mt-3 w-full sm:w-auto">Check Answer</Button>
      {submitted ? <div className="mt-4 space-y-3" role="status"><div className="rounded-[var(--radius-md)] border border-[var(--primary)]/30 bg-[var(--bg-soft)] p-4"><div className="flex items-center gap-2 text-sm font-bold text-[var(--primary)]"><BookOpenCheck size={18} aria-hidden="true" />Sample Answer</div><p className="mt-2 text-sm font-semibold leading-6 text-[var(--text)]">{quiz.sampleAnswer}</p></div><div className="rounded-[var(--radius-md)] border border-[var(--primary)]/25 bg-[var(--primary-soft)] p-4"><div className="text-xs font-bold uppercase tracking-wide text-[var(--primary)]">Explanation</div><p className="mt-1 text-sm leading-6 text-[var(--text-soft)]">{quiz.explanation}</p></div></div> : null}
    </QuizCard>
  );
}
