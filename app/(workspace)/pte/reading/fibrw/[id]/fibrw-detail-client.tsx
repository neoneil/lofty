"use client";

import dynamic from "next/dynamic";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ChevronDown,
} from "lucide-react";

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

function InlineBlank({
  blank,
  value,
  submitted,
  onChange,
}: {
  blank: Blank;
  value?: string;
  submitted: boolean;
  onChange: (value: string) => void;
}) {

  const isCorrect =
    submitted &&
    value === blank.answer;

  const isWrong =
    submitted &&
    value &&
    value !== blank.answer;

  return (
    <span className="mx-1 inline-flex items-center gap-2 align-middle">

      <div className="relative inline-block">

        <select
          value={value ?? ""}
          disabled={submitted}
          onChange={(e) =>
            onChange(
              e.target.value,
            )
          }
          className={`h-[42px] min-w-[150px] appearance-none rounded-sm border bg-white px-4 pr-10 text-[15px] font-medium shadow-sm outline-none transition-all ${
            isCorrect
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : isWrong
                ? "border-rose-300 bg-rose-50 text-rose-700"
                : "border-gray-200 text-gray-700 hover:border-[var(--primary)]"
          }`}
        >

          <option value="">
            Select
          </option>

          {blank.options.map(
            (option) => (
              <option
                key={option}
                value={option}
              >
                {option}
              </option>
            ),
          )}

        </select>

        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

      </div>

      {submitted ? (
        <span className="text-[14px] font-medium text-emerald-600">
          Correct:
          {" "}
          {
            blank.answer
          }
        </span>
      ) : null}

    </span>
  );
}

function FibrwDetailClient({
  question,
  attempts,
}: Props) {

  const [answers, setAnswers] =
    useState<
      Record<number, string>
    >({});

  const [submitted, setSubmitted] =
    useState(false);

  const [score, setScore] =
    useState(0);

  const [loading, setLoading] =
    useState(false);

  const [startedAt] =
    useState(Date.now());

  const [
    prevQuestionId,
    setPrevQuestionId,
  ] = useState<string | null>(
    null,
  );

  const [
    nextQuestionId,
    setNextQuestionId,
  ] = useState<string | null>(
    null,
  );

  const [
    questionNumber,
    setQuestionNumber,
  ] = useState(0);

  useEffect(() => {

    const ids =
      getQuestionOrder(
        "fibrw",
      );

    const currentIndex =
      ids.findIndex(
        (qId) =>
          qId === question.id,
      );

    if (
      currentIndex === -1
    ) {
      return;
    }

    setQuestionNumber(
      currentIndex + 1,
    );

    setPrevQuestionId(
      currentIndex > 0
        ? ids[
            currentIndex - 1
          ]
        : null,
    );

    setNextQuestionId(
      currentIndex <
        ids.length - 1
        ? ids[
            currentIndex + 1
          ]
        : null,
    );

  }, [question.id]);

  const parts =
    useMemo(() => {

      return question.question_body_text.split(
        /(\[\[blank_\d+\]\])/g,
      );

    }, [
      question.question_body_text,
    ]);

  async function handleSubmit() {

    setLoading(true);

    try {

      const formattedAnswers =
        question.blanks_json.map(
          (blank) => ({
            blankId: `blank-${blank.blank_index}`,
            answer:
              answers[
                blank.blank_index
              ] || "",
          }),
        );

      const res =
        await fetch(
          "/api/pte/fibrw/submit",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              {
                questionId:
                  question.id,

                answers:
                  formattedAnswers,

                startedAt,
              },
            ),
          },
        );

      const data =
        await res.json();

      if (!res.ok) {

        throw new Error(
          data.message ||
            "提交失败",
        );

      }

      setScore(
        data.score || 0,
      );

      setSubmitted(true);

    } catch (error) {

      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "提交失败",
      );

    } finally {

      setLoading(false);

    }

  }

  function handleReset() {

    setAnswers({});

    setSubmitted(false);

    setScore(0);

  }

  const accuracy =
    Math.round(
      (score /
        question.blanks_json
          .length) *
        100,
    ) || 0;

  return (
    <section className="mt-8 space-y-8">

      {/* Navigation */}

      <div className="flex items-center justify-between gap-4">

        <div className="flex flex-wrap items-center gap-2">

          <Tag tone="theme">
            FIB-RW #
            {
              questionNumber
            }
          </Tag>

          <Tag tone="yellow">
            {
              question
                .blanks_json.length
            }{" "}
            Blanks
          </Tag>

          {submitted ? (
            <Tag tone="green">
              Accuracy{" "}
              {accuracy}%
            </Tag>
          ) : null}

        </div>

        <div className="flex items-center gap-2">

          {prevQuestionId ? (
            <Link
              href={`/pte/reading/fibrw/${prevQuestionId}`}
            >
              <Button
                variant="secondary"
                className="gap-1.5"
              >
                <ChevronLeft size={16} />
                Previous
              </Button>
            </Link>
          ) : null}

          {nextQuestionId ? (
            <Link
              href={`/pte/reading/fibrw/${nextQuestionId}`}
            >
              <Button
                variant="primary"
                className="gap-1.5"
              >
                Next
                <ChevronRight size={16} />
              </Button>
            </Link>
          ) : null}

        </div>

      </div>

      {/* Passage */}

      <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">

        <div className="mx-auto max-w-[78%]">

          <div className="text-[18px] leading-[2.9] tracking-[0.01em] text-gray-800">

            {parts.map(
              (
                part,
                index,
              ) => {

                const match =
                  part.match(
                    /\[\[blank_(\d+)\]\]/,
                  );

                if (match) {

                  const blankIndex =
                    Number(
                      match[1],
                    );

                  const blank =
                    question.blanks_json.find(
                      (b) =>
                        b.blank_index ===
                        blankIndex,
                    );

                  if (!blank) {
                    return null;
                  }

                  return (
                    <InlineBlank
                      key={index}
                      blank={
                        blank
                      }
                      value={
                        answers[
                          blankIndex
                        ]
                      }
                      submitted={
                        submitted
                      }
                      onChange={(
                        value,
                      ) => {

                        setAnswers(
                          (
                            prev,
                          ) => ({
                            ...prev,
                            [blankIndex]:
                              value,
                          }),
                        );

                      }}
                    />
                  );

                }

                return (
                  <span key={index}>
                    {part}
                  </span>
                );

              },
            )}

          </div>

        </div>

      </section>

      {/* Result */}

      {submitted ? (
        <section className="rounded-3xl border border-gray-200 bg-[#faf8f4] p-6 shadow-sm">

          <div className="mb-5 flex flex-wrap items-center gap-3">

            <span
              className={`rounded px-4 py-1.5 text-sm font-semibold ${
                accuracy === 100
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {accuracy === 100
                ? "Correct"
                : "Completed"}
            </span>

            <span className="rounded bg-white px-4 py-1.5 text-sm font-medium text-gray-700 shadow-sm">
              Score:
              {" "}
              {score}
              {" / "}
              {
                question
                  .blanks_json
                  .length
              }
            </span>

            <span className="rounded bg-white px-4 py-1.5 text-sm font-medium text-gray-700 shadow-sm">
              Accuracy:
              {" "}
              {accuracy}%
            </span>

          </div>

          <div className="h-3 overflow-hidden rounded-full bg-gray-200">

            <div
              className={`h-full rounded-full transition-all duration-500 ${
                accuracy === 100
                  ? "bg-green-500"
                  : accuracy >= 60
                    ? "bg-yellow-500"
                    : "bg-red-500"
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

        <Button
          variant="primary"
          onClick={
            handleSubmit
          }
          disabled={loading}
        >
          {loading
            ? "Submitting..."
            : "Check Answer"}
        </Button>

        <Button
          variant="secondary"
          onClick={
            handleReset
          }
          className="gap-2"
        >
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

            <Tag tone="neutral">
              {
                attempts.length
              }
            </Tag>

          </div>

          <div className="space-y-3">

            {attempts
              .slice(0, 5)
              .map(
                (attempt) => (
                  <div
                    key={
                      attempt.id
                    }
                    className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                  >

                    <div className="flex flex-wrap items-center justify-between gap-2">

                      <div className="text-sm text-gray-500">
                        {new Date(
                          attempt.submitted_at,
                        ).toLocaleString()}
                      </div>

                      <Tag tone="theme">
                        Score{" "}
                        {attempt.score ??
                          0}
                      </Tag>

                    </div>

                  </div>
                ),
              )}

          </div>

        </section>
      ) : null}

    </section>
  );
}

export default dynamic(
  async () =>
    Promise.resolve(
      FibrwDetailClient,
    ),
  {
    ssr: false,
  },
);