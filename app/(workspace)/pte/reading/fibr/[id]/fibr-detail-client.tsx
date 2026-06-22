"use client";

import dynamic from "next/dynamic";

import Link from "next/link";

import { useMemo, useState } from "react";

import { ChevronLeft, ChevronRight, Move, RotateCcw } from "lucide-react";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
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
  const { attributes, listeners, setNodeRef, isDragging } =
    useDraggable({
      id: `${source}:${word}`,
      data: {
        word,
        source,
      },
    });

  return (
    <button
      ref={setNodeRef}
      style={{ touchAction: "none" }}
      {...listeners}
      {...attributes}
      className={`inline-flex items-center justify-center gap-2 text-[15px] font-medium transition-colors duration-150 ${
        insideBlank
          ? isDragging
            ? "opacity-0 text-[var(--primary)]"
            : "text-[var(--text)]"
          : isDragging
            ? "rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-[var(--text-soft)] opacity-35 shadow-sm"
            : "rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-[var(--text-soft)] shadow-sm hover:border-[var(--primary)] hover:text-[var(--primary)] hover:shadow-md"
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
        className={`inline-flex h-[34px] min-w-[104px] items-center justify-center rounded-md border px-2 transition-colors duration-150 ${
          isCorrect
            ? "border-[color:var(--success)]/40 bg-[var(--success-soft)]"
            : isWrong
              ? "border-[color:var(--danger)]/40 bg-[var(--danger-soft)]"
              : isOver
                ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                : "border-dashed border-[var(--border-strong)] bg-[var(--bg-soft)]"
        }`}
      >
        {value ? (
          <DraggableWord
            word={value}
            source={`blank-${blankIndex}`}
            insideBlank
          />
        ) : (
          <span className="text-[14px] text-[var(--text-faint)]">Drop Here</span>
        )}
      </span>

      {/* Correct Answer */}

      {submitted ? (
        <span className="text-[15px] font-medium text-[var(--success)]">
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

  const [loading, setLoading] = useState(false);
  const [startedAt] = useState(() => Date.now());

  const { prevQuestionId, nextQuestionId, questionNumber } = useMemo(() => {
    const ids = getQuestionOrder("fibr");

    const currentIndex = ids.findIndex((qId) => qId === question.id);

    if (currentIndex === -1) {
      return {
        prevQuestionId: null,
        nextQuestionId: null,
        questionNumber: 0,
      };
    }

    return {
      prevQuestionId: currentIndex > 0 ? ids[currentIndex - 1] : null,
      nextQuestionId: currentIndex < ids.length - 1 ? ids[currentIndex + 1] : null,
      questionNumber: currentIndex + 1,
    };
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

  function handleDragStart(event: DragStartEvent) {
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

  async function handleSubmit() {
    setLoading(true);

    try {
      const formattedAnswers = question.blanks_json.map((blank) => ({
        blankId: `blank-${blank.blank_index}`,
        answer: answers[blank.blank_index] || "",
      }));

      const res = await fetch("/api/pte/fibr/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionId: question.id,
          answers: formattedAnswers,
          startedAt,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "提交失败");
      }

      setScore(data.score || 0);

      setSubmitted(true);
    } catch (error) {
      console.error(error);

      alert(error instanceof Error ? error.message : "提交失败");
    } finally {
      setLoading(false);
    }
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

        <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-sm">
          <div className="mx-auto max-w-[78%]">
            <div className="text-[18px] leading-[2.9] tracking-[0.01em] text-[var(--text)]">
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

        <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text)]">Word Pool</h3>

              <p className="mt-1 text-sm text-[var(--text-soft)]">
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
            <div className="rounded-xl border border-[var(--primary)] bg-[var(--card)] px-4 py-2 text-[15px] font-medium text-[var(--primary)] shadow-2xl">
              {activeWord}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>


      {submitted ? (
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--bg-soft)] p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span
              className={`rounded px-4 py-1.5 text-sm font-semibold ${
                accuracy === 100
                  ? "bg-[var(--success-soft)] text-[var(--success)]"
                  : "bg-[var(--warning-soft)] text-[var(--warning)]"
              }`}
            >
              {accuracy === 100 ? "Correct" : "Completed"}
            </span>

            <span className="rounded bg-[var(--card)] px-4 py-1.5 text-sm font-medium text-[var(--text-soft)] shadow-sm">
              Score: {score} / {question.blanks_json.length}
            </span>

            <span className="rounded bg-[var(--card)] px-4 py-1.5 text-sm font-medium text-[var(--text-soft)] shadow-sm">
              Accuracy: {accuracy}%
            </span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-[var(--border)]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                accuracy === 100
                  ? "bg-[var(--success-soft)]0"
                  : accuracy >= 60
                    ? "bg-[var(--warning-soft)]0"
                    : "bg-[var(--danger-soft)]0"
              }`}
              style={{
                width: `${accuracy}%`,
              }}
            />
          </div>
        </section>
      ) : null}

      {/* Actions */}

      <div className="flex items-center justify-center gap-3">
        <Button variant="primary" onClick={handleSubmit} disabled={loading}>
          {loading ? "Submitting..." : "Check Answer"}
        </Button>

        <Button variant="secondary" onClick={handleReset} className="gap-2">
          <RotateCcw size={16} />
          Reset
        </Button>
      </div>
      {/* Attempts */}

      {attempts.length > 0 ? (
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
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
                className="rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] p-4"
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

export default dynamic(async () => Promise.resolve(FibrDetailClient), {
  ssr: false,
});
