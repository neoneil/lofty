"use client";

import dynamic from "next/dynamic";

import Link from "next/link";

import { useEffect, useMemo, useState } from "react";

import { ChevronLeft, ChevronRight, Move, RotateCcw } from "lucide-react";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import { getQuestionOrder } from "@/lib/question-order";

import Tag from "@/components/ui/tag";

import { Button } from "@/components/ui-v2/button";

type Blank = {
  answer: string;
  options: string[];
  blank_index: number;
};

type Question = {
  id: string;
  question_title: string;
  question_body_text: string;
  blanks_json: Blank[];
  is_prediction: boolean;
  is_practiced: boolean;
  attempt_count: number;
  latest_score: number | null;
  best_score: number | null;
  is_wrong_question: boolean;
};

type Attempt = {
  id: string;
  score: number | null;
  submitted_at: string;
};

type Props = {
  question: Question;
  attempts: Attempt[];
};

function DraggableWord({
  word,
  source,
  insideBlank = false,
}: {
  word: string;
  source: string;
  insideBlank?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `${source}:${word}`,
      data: {
        word,
        source,
      },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`inline-flex items-center justify-center gap-2 text-[15px] font-medium transition-all ${
        insideBlank
          ? isDragging
            ? "text-[var(--primary)]"
            : "text-gray-800"
          : isDragging
            ? "scale-[1.03] rounded-xl border border-[var(--primary)] bg-white px-4 text-[var(--primary)] shadow-2xl"
            : "rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-700 shadow-sm hover:-translate-y-[1px] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:shadow-md"
      }`}
    >
      {word}
    </button>
  );
}

function BlankDropZone({
  blankIndex,
  value,
  submitted,
  correctAnswer,
}: {
  blankIndex: number;
  value?: string;
  submitted: boolean;
  correctAnswer: string;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `blank-${blankIndex}`,
  });

  const isCorrect = submitted && value === correctAnswer;

  const isWrong = submitted && value && value !== correctAnswer;

  return (
    <span className="mx-1 inline-flex items-center gap-2 align-middle">
      {/* Blank */}

      <span
        ref={setNodeRef}
        className={`inline-flex h-[42px] min-w-[120px] items-center justify-center rounded-xl border px-3 transition-all ${
          isCorrect
            ? "border-emerald-300 bg-emerald-50"
            : isWrong
              ? "border-rose-300 bg-rose-50"
              : isOver
                ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                : "border-dashed border-gray-300 bg-gray-50"
        }`}
      >
        {value ? (
          <DraggableWord
            word={value}
            source={`blank-${blankIndex}`}
            insideBlank
          />
        ) : (
          <span className="text-[14px] text-gray-400">Drop Here</span>
        )}
      </span>

      {/* Correct Answer */}

      {submitted ? (
        <span className="text-[15px] font-medium text-emerald-600">
          {correctAnswer}
        </span>
      ) : null}
    </span>
  );
}

function FibrDetailClient({ question, attempts }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const [answers, setAnswers] = useState<Record<number, string>>({});

  const [activeWord, setActiveWord] = useState<string | null>(null);

  const [submitted, setSubmitted] = useState(false);

  const [score, setScore] = useState(0);

  const [prevQuestionId, setPrevQuestionId] = useState<string | null>(null);

  const [nextQuestionId, setNextQuestionId] = useState<string | null>(null);

  const [questionNumber, setQuestionNumber] = useState(0);

  useEffect(() => {
    const ids = getQuestionOrder("fibr");

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

  const optionPool = useMemo(() => {
    return question.blanks_json?.[0]?.options ?? [];
  }, [question.blanks_json]);
  const { setNodeRef: setPoolRef, isOver: isPoolOver } = useDroppable({
    id: "pool",
  });
  const parts = useMemo(() => {
    return question.question_body_text.split(/(\[\[blank_\d+\]\])/g);
  }, [question.question_body_text]);

  function handleDragStart(event: any) {
    const activeData = event.active.data.current;

    if (!activeData) {
      return;
    }

    setActiveWord(activeData.word);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    setActiveWord(null);

    if (!over) {
      return;
    }

    const activeData = active.data.current;

    if (!activeData) {
      return;
    }

    const word = activeData.word as string;

    const source = activeData.source as string;

    const overId = over.id as string;
    if (overId === "pool") {
      if (source.startsWith("blank-")) {
        const sourceBlank = Number(source.replace("blank-", ""));

        setAnswers((prev) => {
          const updated = {
            ...prev,
          };

          delete updated[sourceBlank];

          return updated;
        });
      }

      return;
    }
    if (overId.startsWith("blank-")) {
      const targetBlank = Number(overId.replace("blank-", ""));

      setAnswers((prev) => {
        const updated = {
          ...prev,
        };

        // source 是 blank
        // 删除原 blank

        if (source.startsWith("blank-")) {
          const sourceBlank = Number(source.replace("blank-", ""));

          delete updated[sourceBlank];
        }

        // 如果目标位置已有词
        // 交换

        const existingWord = updated[targetBlank];

        if (existingWord && source.startsWith("blank-")) {
          const sourceBlank = Number(source.replace("blank-", ""));

          updated[sourceBlank] = existingWord;
        }

        updated[targetBlank] = word;

        return updated;
      });
    }
  }

  function handleSubmit() {
    let correct = 0;

    question.blanks_json.forEach((blank) => {
      if (answers[blank.blank_index] === blank.answer) {
        correct++;
      }
    });

    setScore(correct);

    setSubmitted(true);
  }

  function handleReset() {
    setAnswers({});

    setSubmitted(false);

    setScore(0);
  }

  const accuracy = Math.round((score / question.blanks_json.length) * 100) || 0;

  return (
    <section className="mt-8 space-y-8">
      {/* Navigation */}

      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Tag tone="theme">FIB-R #{questionNumber}</Tag>

          <Tag tone="yellow">{question.blanks_json.length} Blanks</Tag>

          {submitted ? <Tag tone="green">Accuracy {accuracy}%</Tag> : null}
        </div>

        <div className="flex items-center gap-2">
          {prevQuestionId ? (
            <Link href={`/pte/reading/fibr/${prevQuestionId}`}>
              <Button variant="secondary" className="gap-1.5">
                <ChevronLeft size={16} />
                Previous
              </Button>
            </Link>
          ) : null}

          {nextQuestionId ? (
            <Link href={`/pte/reading/fibr/${nextQuestionId}`}>
              <Button variant="primary" className="gap-1.5">
                Next
                <ChevronRight size={16} />
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Passage */}

        <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mx-auto max-w-[78%]">
            <div className="text-[18px] leading-[2.9] tracking-[0.01em] text-gray-800">
              {parts.map((part, index) => {
                const match = part.match(/\[\[blank_(\d+)\]\]/);

                if (match) {
                  const blankIndex = Number(match[1]);

                  const blank = question.blanks_json.find(
                    (b) => b.blank_index === blankIndex,
                  );

                  return (
                    <BlankDropZone
                      key={index}
                      blankIndex={blankIndex}
                      value={answers[blankIndex]}
                      submitted={submitted}
                      correctAnswer={blank?.answer ?? ""}
                    />
                  );
                }

                const prevPart = parts[index - 1];

                const shouldRemoveFirstWord =
                  typeof prevPart === "string" &&
                  /\[\[blank_\d+\]\]/.test(prevPart);

                const cleanedPart = shouldRemoveFirstWord
                  ? part.replace(/^\s*\S+/, "")
                  : part;

                return <span key={index}>{cleanedPart}</span>;
              })}
            </div>
          </div>
        </section>

        {/* Word Pool */}

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Word Pool</h3>

              <p className="mt-1 text-sm text-gray-500">
                Drag the words into the blanks.
              </p>
            </div>

            <Tag tone="theme">
              {
                optionPool.filter(
                  (word) => !Object.values(answers).includes(word),
                ).length
              }{" "}
              Remaining
            </Tag>
          </div>

          <div
            ref={setPoolRef}
            className={`flex flex-wrap gap-3 rounded-2xl transition-all ${
              isPoolOver ? "bg-[var(--primary-soft)]" : ""
            }`}
          >
            {optionPool
              .filter((word) => !Object.values(answers).includes(word))
              .map((option, index) => (
                <DraggableWord key={index} word={option} source="pool" />
              ))}
          </div>
        </section>

        <DragOverlay dropAnimation={null}>
          {activeWord ? (
            <div className="rounded-xl border border-[var(--primary)] bg-white px-4 py-2 text-[15px] font-medium text-[var(--primary)] shadow-2xl">
              {activeWord}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Actions */}

      <div className="flex items-center justify-center gap-3">
        <Button variant="primary" onClick={handleSubmit}>
          Check Answer
        </Button>

        <Button variant="secondary" onClick={handleReset} className="gap-2">
          <RotateCcw size={16} />
          Reset
        </Button>
      </div>

      {/* Attempts */}

      {attempts.length > 0 ? (
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">
              Recent Attempts
            </h3>

            <Tag tone="neutral">{attempts.length}</Tag>
          </div>

          <div className="space-y-3">
            {attempts.slice(0, 5).map((attempt) => (
              <div
                key={attempt.id}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm text-gray-500">
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

export default dynamic(async () => Promise.resolve(FibrDetailClient), {
  ssr: false,
});
