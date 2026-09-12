"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, BookOpenCheck, CheckCircle2, Headphones, ListChecks, Radio } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import type { PteStaticQuestion } from "@/lib/pte/static-sample-questions";

type Props = {
  question: PteStaticQuestion;
};

function getIcon(type: PteStaticQuestion["type"]) {
  if (type.startsWith("listening")) return <Headphones size={18} />;
  if (type === "reading-multiple") return <ListChecks size={18} />;
  return <BookOpenCheck size={18} />;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function AnswerPanel({ answerText }: { answerText: string }) {
  return (
    <aside className="rounded-[var(--radius-lg)] border border-[color:var(--success)]/20 bg-[var(--success-soft)] p-5 shadow-[var(--shadow-sm)]">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--success)]">
        <CheckCircle2 size={16} />
        Correct Answer
      </div>
      <p className="text-base font-semibold leading-7 text-[var(--text)]">{answerText}</p>
    </aside>
  );
}

function OptionList({ question }: { question: PteStaticQuestion }) {
  const [selected, setSelected] = useState<string[]>([]);
  const isMultiple = question.type === "reading-multiple" || question.type === "listening-multiple";
  const options = question.options ?? [];

  const isCorrect = useMemo(() => {
    const correctAnswers = question.answers ?? (question.answer ? [question.answer] : []);
    if (selected.length !== correctAnswers.length) return false;
    return selected.every((id) => correctAnswers.includes(id));
  }, [question.answer, question.answers, selected]);

  function toggle(optionId: string) {
    setSelected((prev) => {
      if (!isMultiple) return [optionId];
      return prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId];
    });
  }

  return (
    <div className="space-y-3">
      {options.map((option) => {
        const active = selected.includes(option.id);
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => toggle(option.id)}
            className={`flex w-full items-start gap-3 rounded-[var(--radius-md)] border px-4 py-3 text-left transition ${
              active
                ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--text)] shadow-[var(--shadow-sm)]"
                : "border-[var(--border)] bg-[var(--card)] text-[var(--text)] hover:border-[var(--primary)]/45 hover:bg-[var(--bg-soft)]"
            }`}
          >
            <span
              className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center border text-xs font-bold ${
                isMultiple ? "rounded-[var(--radius-xs)]" : "rounded-full"
              } ${active ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border-strong)] text-[var(--text-soft)]"}`}
            >
              {option.id}
            </span>
            <span className="text-[15px] leading-7">{option.text}</span>
          </button>
        );
      })}

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={() => setSelected([])}>
          Clear
        </Button>
        {selected.length ? (
          <Badge variant={isCorrect ? "success" : "warning"} className="gap-1.5">
            {isCorrect ? <CheckCircle2 size={13} /> : <Radio size={13} />}
            Selected: {selected.join(", ")}
          </Badge>
        ) : (
          <Badge variant="secondary">No selection</Badge>
        )}
      </div>
    </div>
  );
}

function FillBlankPractice({ question }: { question: PteStaticQuestion }) {
  const correctAnswers = question.answers ?? [];
  const [answers, setAnswers] = useState<string[]>(() => correctAnswers.map(() => ""));
  const parts = (question.transcriptWithBlanks ?? "").split(/(\{\{\d+\}\})/g);

  return (
    <p className="text-[16px] leading-10 text-[var(--text)]">
      {parts.map((part, index) => {
        const match = part.match(/\{\{(\d+)\}\}/);
        if (!match) return <span key={`${part}-${index}`}>{part}</span>;
        const blankIndex = Number(match[1]) - 1;
        const value = answers[blankIndex] ?? "";
        const correct = correctAnswers[blankIndex] ?? "";
        const hasValue = value.trim().length > 0;
        const isCorrect = hasValue && normalize(value) === normalize(correct);
        const inputWidth = Math.max(112, Math.min(260, Math.max(value.length, correct.length, 8) * 12 + 34));

        return (
          <span key={part} className="mx-1 inline-flex items-center gap-2 align-middle">
            <input
              value={value}
              onChange={(event) => {
                const next = [...answers];
                next[blankIndex] = event.target.value;
                setAnswers(next);
              }}
              style={{ width: inputWidth }}
              className={`h-9 rounded-[var(--radius-sm)] border bg-[var(--bg)] px-3 text-center text-sm font-semibold text-[var(--text)] outline-none transition focus:border-[var(--primary)] ${
                hasValue
                  ? isCorrect
                    ? "border-[color:var(--success)]/50"
                    : "border-[color:var(--warning)]/50"
                  : "border-[var(--border-strong)]"
              }`}
              aria-label={`Blank ${blankIndex + 1}`}
            />
          </span>
        );
      })}
    </p>
  );
}

export default function PteStaticSamplePage({ question }: Props) {
  const isListening = question.type.startsWith("listening");

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-10 pt-3 sm:px-6 lg:px-0">
      <div className="mb-5 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
        <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
              {getIcon(question.type)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight text-[var(--text)]">{question.title}</h1>
                <Badge>{question.code}</Badge>
              </div>
              <p className="mt-1 text-sm text-[var(--text-soft)]">Question {question.index}</p>
            </div>
          </div>
          <Link href={question.route}>
            <Button variant="secondary" className="w-fit gap-2">
              <ArrowLeft size={16} />
              Back to list
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)]">Instruction</div>
            <p className="text-[15px] leading-7 text-[var(--text)]">{question.instruction}</p>
          </section>

          {isListening && question.listeningText ? (
            <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)]">Listening Text</div>
              <p className="text-[16px] leading-8 text-[var(--text)]">{question.listeningText}</p>
            </section>
          ) : null}

          {question.passage ? (
            <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)]">Passage</div>
              <p className="text-[16px] leading-8 text-[var(--text)]">{question.passage}</p>
            </section>
          ) : null}

          {question.type === "listening-fill-blank" ? (
            <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)]">Transcript</div>
              <FillBlankPractice question={question} />
            </section>
          ) : (
            <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
              <div className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)]">Question</div>
              <h2 className="mb-5 text-lg font-semibold leading-8 text-[var(--text)]">{question.question}</h2>
              <OptionList question={question} />
            </section>
          )}
        </div>

        <div className="space-y-5">
          <AnswerPanel answerText={question.answerText} />
        </div>
      </div>
    </section>
  );
}
