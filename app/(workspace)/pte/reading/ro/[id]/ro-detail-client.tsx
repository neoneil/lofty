"use client";

import Link from "next/link";

import { useEffect, useMemo, useState } from "react";

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import { ChevronLeft, ChevronRight, GripVertical } from "lucide-react";

import { getQuestionOrder } from "@/lib/question-order";

import Tag from "@/components/ui/tag";

import { Button } from "@/components/ui-v2/button";

type Question = {
  id: string;
  question_title: string;
  source_question_id: string | null;
  difficulty_level: number | null;
  is_prediction: boolean | null;
  sentence_count: number;
  question_body_text: string[];
  created_at: string;
  updated_at: string;

  is_practiced: boolean;
  attempt_count: number;
  correct_count: number;
  wrong_count: number;
  completed_count: number;
  last_attempt_at: string | null;
  latest_score: number | null;
  best_score: number | null;
  is_wrong_question: boolean;
};

type Attempt = {
  id: string;
  score: number | null;
  user_answer: any;
  ai_feedback: any;
  submitted_at: string;
};

type Props = {
  question: Question;
  attempts: Attempt[];
};

type SentenceItem = {
  id: string;
  text: string;
};

function SortableSentence({
  sentence,
  index,
  submitted,
  isCorrect,
}: {
  sentence: SentenceItem;
  index: number;
  submitted: boolean;
  isCorrect: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: sentence.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative overflow-hidden rounded-2xl border bg-[var(--card)] transition-all duration-300 ${
        submitted
          ? isCorrect
            ? "border-[color:var(--success)]/30 shadow-[var(--shadow-md)]"
            : "border-[color:var(--danger)]/30 shadow-[var(--shadow-md)]"
          : isDragging
            ? "scale-[1.015] border-[var(--primary)] shadow-2xl"
            : "border-[var(--border)] shadow-sm hover:border-[var(--primary)] hover:shadow-md"
      }`}
    >
      {/* Accent */}

      {submitted ? (
        <div
          className={`absolute left-0 top-0 h-full w-1.5 ${
            isCorrect ? "bg-[var(--success-soft)]0" : "bg-[var(--danger-soft)]0"
          }`}
        />
      ) : null}

      <div className="flex items-start gap-4 p-5">
        {/* Left */}

        <div
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-colors ${
            submitted
              ? isCorrect
                ? "bg-[var(--success-soft)] text-[var(--success)]"
                : "bg-[var(--danger-soft)] text-[var(--danger)]"
              : "bg-[var(--primary-soft)] text-[var(--primary)]"
          }`}
        >
          <GripVertical size={16} />
        </div>

        {/* Right */}

        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center gap-2">
            <Tag tone="theme">{index + 1}</Tag>

            {submitted ? (
              isCorrect ? (
                <Tag tone="green">Correct</Tag>
              ) : (
                <Tag tone="pink">Incorrect</Tag>
              )
            ) : null}
          </div>

          <p className="text-[15px] leading-8 text-[var(--text-soft)]">{sentence.text}</p>
        </div>
      </div>
    </div>
  );
}

export default function RoDetailClient({ question, attempts }: Props) {
  const initialSentences = useMemo(() => {
    return question.question_body_text.map((text, index) => ({
      id: `${index}`,
      text,
    }));
  }, [question.question_body_text]);

  const [initialShuffle, setInitialShuffle] = useState<SentenceItem[]>([]);

  const [sentences, setSentences] = useState<SentenceItem[]>([]);

  const [submitted, setSubmitted] = useState(false);

  const [correctCount, setCorrectCount] = useState(0);

  const [prevQuestionId, setPrevQuestionId] = useState<string | null>(null);

  const [nextQuestionId, setNextQuestionId] = useState<string | null>(null);

  const [questionNumber, setQuestionNumber] = useState<number>(0);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  useEffect(() => {
    const ids = getQuestionOrder("ro");

    const currentIndex = ids.findIndex((qId) => qId === question.id);

    if (currentIndex === -1) {
      return;
    }

    setQuestionNumber(currentIndex + 1);

    setPrevQuestionId(currentIndex > 0 ? ids[currentIndex - 1] : null);

    setNextQuestionId(
      currentIndex < ids.length - 1 ? ids[currentIndex + 1] : null,
    );
  }, [question.id]);

  useEffect(() => {
    const shuffled = [...initialSentences].sort(() => Math.random() - 0.5);

    setInitialShuffle(shuffled);

    setSentences(shuffled);
  }, [initialSentences]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setSentences((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);

      const newIndex = items.findIndex((item) => item.id === over.id);

      return arrayMove(items, oldIndex, newIndex);
    });
  }

  function handleReset() {
    setSentences(initialShuffle);

    setSubmitted(false);

    setCorrectCount(0);
  }

  function handleCheckAnswer() {
    let correct = 0;

    sentences.forEach((sentence, index) => {
      if (sentence.id === `${index}`) {
        correct++;
      }
    });

    setCorrectCount(correct);

    setSubmitted(true);
  }

  const accuracy =
    Math.round((correctCount / question.question_body_text.length) * 100) || 0;

  return (
    <section className="mt-8 space-y-8">
      {/* Navigation */}

      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Tag tone="theme">RO #{questionNumber}</Tag>

          <Tag tone="yellow">{question.sentence_count} Sentences</Tag>

          {submitted ? <Tag tone="green">Accuracy {accuracy}%</Tag> : null}
        </div>

        <div className="flex items-center gap-2">
          {prevQuestionId ? (
            <Link href={`/pte/reading/ro/${prevQuestionId}`}>
              <Button variant="secondary" className="gap-1.5">
                <ChevronLeft size={16} />
                Previous
              </Button>
            </Link>
          ) : null}

          {nextQuestionId ? (
            <Link href={`/pte/reading/ro/${nextQuestionId}`}>
              <Button variant="primary" className="gap-1.5">
                Next
                <ChevronRight size={16} />
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      {/* Header */}

      <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--card)] to-[var(--bg-soft)] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left */}

          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight text-[var(--text)]">
              Re-order Paragraphs
            </h2>

            <p className="text-sm leading-7 text-[var(--text-soft)]">
              拖动句子进行排序，使文章逻辑正确。
            </p>
          </div>

          {/* Right */}

          <div className="flex items-center gap-2">
            <Tag tone="yellow">{question.sentence_count} Sentences</Tag>
          </div>
        </div>
      </div>

      {/* DND */}

      <div className="mx-auto w-full space-y-3 lg:max-w-[70%]">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sentences.map((s) => s.id)}
            strategy={rectSortingStrategy}
          >
            <div className="space-y-4">
              {sentences.map((sentence, index) => {
                const isCorrect = sentence.id === `${index}`;

                return (
                  <SortableSentence
                    key={sentence.id}
                    sentence={sentence}
                    index={index}
                    submitted={submitted}
                    isCorrect={isCorrect}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Actions */}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="primary" onClick={handleCheckAnswer}>
          Check Answer
        </Button>

        <Button variant="secondary" onClick={handleReset}>
          Reset
        </Button>
      </div>

      {/* Result */}

      {submitted ? (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <Tag tone="green">Correct {correctCount}</Tag>

            <Tag tone="theme">Accuracy {accuracy}%</Tag>
          </div>

          <div className="space-y-3">
            {question.question_body_text.map((sentence, index) => (
              <div
                key={index}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] p-5"
              >
                <div className="mb-3">
                  <Tag tone="theme">Correct Order {index + 1}</Tag>
                </div>

                <p className="text-[15px] leading-8 text-[var(--text-soft)]">
                  {sentence}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Attempts */}

      {attempts.length > 0 ? (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-base font-semibold text-[var(--text)]">
              Recent Attempts
            </h3>

            <Tag tone="neutral">{attempts.length}</Tag>
          </div>

          <div className="space-y-3">
            {attempts.slice(0, 5).map((attempt) => (
              <div
                key={attempt.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm text-[var(--text-soft)]">
                    {new Date(attempt.submitted_at).toLocaleString()}
                  </div>

                  <Tag tone="theme">Score {attempt.score ?? 0}</Tag>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
