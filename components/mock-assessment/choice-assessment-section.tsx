"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui-v2/card";
import type { ChoiceQuestion } from "@/lib/mock-assessment/types";

function getCorrectAnswers(question: ChoiceQuestion) {
  return question.answers?.length ? question.answers : [question.answer];
}

function isAnswerCorrect(selected: string[], correct: string[]) {
  return selected.length === correct.length && selected.every((answer) => correct.includes(answer));
}

export function ChoiceAssessmentSection({ title, description, questions }: { title: string; description: string; questions: ChoiceQuestion[] }) {
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});

  const result = useMemo(() => {
    const confirmedQuestions = questions.filter((question) => confirmed[question.id]);
    const correct = confirmedQuestions.filter((question) => isAnswerCorrect(answers[question.id] ?? [], getCorrectAnswers(question))).length;
    return { confirmed: confirmedQuestions.length, correct };
  }, [answers, confirmed, questions]);

  if (questions.length === 0) return <EmptyAssessment title={title} />;

  function selectAnswer(question: ChoiceQuestion, option: string) {
    setAnswers((current) => {
      const selected = current[question.id] ?? [];
      const next = question.selectionMode === "multiple" ? (selected.includes(option) ? selected.filter((answer) => answer !== option) : [...selected, option]) : [option];
      return { ...current, [question.id]: next };
    });
    setConfirmed((current) => ({ ...current, [question.id]: false }));
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></div>
        <Badge variant={result.confirmed === questions.length ? "success" : "secondary"}>{result.confirmed > 0 ? `${result.correct} / ${result.confirmed} 正确` : `${questions.length} 题`}</Badge>
      </CardHeader>
      <CardContent className="space-y-5">
        {questions.map((question, questionIndex) => {
          const selected = answers[question.id] ?? [];
          const correctAnswers = getCorrectAnswers(question);
          const isConfirmed = Boolean(confirmed[question.id]);
          const correct = isConfirmed && isAnswerCorrect(selected, correctAnswers);

          return (
            <section key={question.id} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary-soft)] text-xs font-bold text-[var(--primary)]">{questionIndex + 1}</span>
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-base font-semibold leading-7 text-[var(--text)] sm:text-lg">{question.prompt}</h3>{question.selectionMode === "multiple" ? <Badge variant="warning">多选</Badge> : null}</div>{question.meta ? <p className="mt-1 text-xs text-[var(--text-faint)]">{question.meta}</p> : null}</div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {question.options.map((option, optionIndex) => {
                  const isSelected = selected.includes(option);
                  const isCorrectOption = isConfirmed && correctAnswers.includes(option);
                  const isWrongOption = isConfirmed && isSelected && !correctAnswers.includes(option);
                  return <button key={`${question.id}-${optionIndex}`} type="button" onClick={() => selectAnswer(question, option)} className={`flex min-h-12 items-center gap-3 rounded-[var(--radius-sm)] border px-3 py-2.5 text-left text-sm transition ${isCorrectOption ? "border-[var(--success)]/40 bg-[var(--success-soft)] text-[var(--success)]" : isWrongOption ? "border-[var(--danger)]/40 bg-[var(--danger-soft)] text-[var(--danger)]" : isSelected ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--text)]" : "border-[var(--border)] bg-[var(--card)] text-[var(--text-soft)] hover:border-[var(--primary)]/45 hover:text-[var(--text)]"}`}><span className={`flex h-6 w-6 shrink-0 items-center justify-center border border-current text-[11px] font-bold ${question.selectionMode === "multiple" ? "rounded-[var(--radius-xs)]" : "rounded-full"}`}>{String.fromCharCode(65 + optionIndex)}</span><span>{option}</span>{isCorrectOption ? <CheckCircle2 className="ml-auto shrink-0" size={16} /> : null}</button>;
                })}
              </div>

              <div className="mt-4 flex justify-end"><Button type="button" size="sm" disabled={selected.length === 0} onClick={() => setConfirmed((current) => ({ ...current, [question.id]: true }))}>{isConfirmed ? "重新确认" : "确定答案"}</Button></div>

              {isConfirmed ? <div className={`mt-3 rounded-[var(--radius-sm)] border px-3 py-3 text-sm leading-6 ${correct ? "border-[var(--success)]/30 bg-[var(--success-soft)] text-[var(--success)]" : "border-[var(--danger)]/30 bg-[var(--danger-soft)] text-[var(--danger)]"}`}><div className="flex items-center gap-2 font-semibold">{correct ? <CheckCircle2 size={16} /> : <CircleAlert size={16} />}{correct ? "回答正确" : "回答错误"}</div><p className="mt-1"><span className="font-semibold">正确答案：</span>{correctAnswers.join("、")}</p>{question.explanation ? <p className="mt-2 whitespace-pre-line border-t border-current/15 pt-2 text-[var(--text-soft)]">{question.explanation}</p> : null}</div> : null}
            </section>
          );
        })}

        <div className="flex justify-end"><Button type="button" variant="secondary" onClick={() => { setAnswers({}); setConfirmed({}); }} className="gap-2"><RotateCcw size={16} />重新作答</Button></div>
      </CardContent>
    </Card>
  );
}

export function EmptyAssessment({ title }: { title: string }) {
  return <Card><CardContent className="p-8 text-center"><h2 className="font-semibold text-[var(--text)]">{title}</h2><p className="mt-2 text-sm text-[var(--text-soft)]">当前题库没有返回可用题目，请刷新后重试。</p></CardContent></Card>;
}
