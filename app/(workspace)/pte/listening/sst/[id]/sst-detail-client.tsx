"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui-v2/textarea";
import DictionaryText from "@/components/dictionary/dictionary-text";

import Tag from "@/components/ui/tag";

type SstAiFeedback = {
  overallScore?: number;
  rubric?: {
    content: number;
    form: number;
    grammar: number;
    vocabulary: number;
    spelling: number;
    writtenDiscourse: number;
  };
  overallFeedback: string;
  strengths: string[];
  weaknesses: {
    category: string;
    issue: string;
    example: string;
    suggestion: string;
  }[];
  grammarCorrections: {
    original: string;
    corrected: string;
    explanation: string;
  }[];
  improvedAnswer: string;
};

type Props = {
  question: {
    id: string;

    transcript_text: string;
  };

  attempts: {
    id: string;

    score: number;

    user_answer: string;

    ai_feedback: SstAiFeedback | null;

    submitted_at: string;
  }[];
};

type SubmitResult = {
  score: number;

  aiFeedback: SstAiFeedback;
};

function subscribeQuestionOrder(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getQuestionOrderSnapshot() {
  return sessionStorage.getItem("sst-question-order") ?? "[]";
}

function getServerQuestionOrderSnapshot() {
  return "[]";
}

export default function SstDetailClient({ question, attempts }: Props) {
  const startedAtRef = useRef<number | null>(null);

  const [answer, setAnswer] = useState("");

  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState<SubmitResult | null>(null);

  const [showAnswer, setShowAnswer] = useState(false);

  const [expandedAttempts, setExpandedAttempts] = useState<string[]>([]);

  const router = useRouter();
  const questionOrderSnapshot = useSyncExternalStore(
    subscribeQuestionOrder,
    getQuestionOrderSnapshot,
    getServerQuestionOrderSnapshot,
  );

  const questionNav = useMemo(() => {
    let ids: string[] = [];

    try {
      ids = JSON.parse(questionOrderSnapshot);
    } catch {
      ids = [];
    }

    const currentIndex = ids.findIndex((qId) => qId === question.id);

    if (currentIndex === -1) {
      return {
        questionNumber: 0,
        prevQuestionId: null as string | null,
        nextQuestionId: null as string | null,
      };
    }

    return {
      questionNumber: currentIndex + 1,
      prevQuestionId: currentIndex > 0 ? ids[currentIndex - 1] : null,
      nextQuestionId: currentIndex < ids.length - 1 ? ids[currentIndex + 1] : null,
    };
  }, [question.id, questionOrderSnapshot]);

  useEffect(() => {
    startedAtRef.current = Date.now();
  }, []);

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/pte/sst/submit", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          questionId: question.id,

          userAnswer: answer,

          startedAt: startedAtRef.current ?? Date.now(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message ?? "提交失败");
      }

      setResult({
        score: data.score ?? 0,

        aiFeedback: data.aiFeedback,
      });

      if (!showAnswer) {
        setShowAnswer(true);
      }

      router.refresh();
    } catch (error) {
      console.error(error);

      alert(error instanceof Error ? error.message : "提交失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 space-y-6">
      {/* RESULT */}

      {result ? (
        <section
          className="
                        round
                        border border-[var(--border)]
                        bg-[var(--card)]
                        p-6
                        shadow-sm
                        space-y-6
                    "
        >
          {/* TOP */}

          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`
                                rounded
                                px-4 py-1.5
                                text-sm font-semibold

                                ${
                                  result.score >= 65
                                    ? "bg-[var(--success-soft)] text-[var(--success)]"
                                    : "bg-[var(--danger-soft)] text-[var(--danger)]"
                                }
                            `}
            >
              {result.score >= 65 ? "Good" : "Needs Improvement"}
            </span>

            <span
              className="
                                rounded
                                border border-[var(--border)]
                                bg-[var(--bg-soft)]
                                px-4 py-1.5
                                text-sm font-semibold
                                text-[var(--text)]
                            "
            >
              Score: {result.score} / 90
            </span>
          </div>

          {/* OVERALL FEEDBACK */}

          <div>
            <div
              className="
                                mb-3
                                text-sm
                                font-semibold
                                uppercase
                                tracking-[0.16em]
                                text-[var(--text-soft)]
                            "
            >
              AI Feedback
            </div>

            <div
              className="
                                rounded
                                border border-[var(--border)]
                                bg-[var(--bg-soft)]
                                p-5
                                text-[15px]
                                leading-8
                                text-[var(--text)]
                            "
            >
              {result.aiFeedback.overallFeedback}
            </div>
          </div>

          {/* STRENGTHS */}

          <div>
            <div
              className="
                                mb-3
                                text-sm
                                font-semibold
                                uppercase
                                tracking-[0.16em]
                                text-[var(--text-soft)]
                            "
            >
              Strengths
            </div>

            <div className="flex flex-wrap gap-2">
              {result.aiFeedback.strengths.map((item, index) => (
                <span
                  key={index}
                  className="
                                            rounded
                                            bg-[var(--success-soft)]
                                            px-3 py-2
                                            text-sm
                                            font-medium
                                            text-[var(--success)]
                                        "
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* WEAKNESSES */}

          <div>
            <div
              className="
                                mb-3
                                text-sm
                                font-semibold
                                uppercase
                                tracking-[0.16em]
                                text-[var(--text-soft)]
                            "
            >
              Weaknesses
            </div>

            <div className="space-y-4">
              {result.aiFeedback.weaknesses.map((item, index) => (
                <div
                  key={index}
                  className="
                                            rounded
                                            border border-[var(--danger)]/25
                                            bg-[var(--danger-soft)]
                                            p-5
                                            space-y-3
                                        "
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="
                                                    rounded
                                                    bg-[var(--danger-soft)]
                                                    px-2 py-1
                                                    text-xs
                                                    font-semibold
                                                    text-[var(--danger)]
                                                "
                    >
                      {item.category}
                    </span>
                  </div>

                  <div>
                    <div className="mb-1 text-sm font-semibold text-[var(--text)]">
                      问题
                    </div>

                    <div className="text-sm leading-7 text-[var(--text-soft)]">
                      {item.issue}
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 text-sm font-semibold text-[var(--text)]">
                      原文关键内容
                    </div>

                    <div className="text-sm leading-7 text-[var(--text-soft)]">
                      {item.example}
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 text-sm font-semibold text-[var(--text)]">
                      改进建议
                    </div>

                    <div className="text-sm leading-7 text-[var(--text-soft)]">
                      {item.suggestion}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GRAMMAR CORRECTIONS */}

          {result.aiFeedback.grammarCorrections.length > 0 && (
            <div>
              <div
                className="
                                    mb-3
                                    text-sm
                                    font-semibold
                                    uppercase
                                    tracking-[0.16em]
                                    text-[var(--text-soft)]
                                "
              >
                Grammar Corrections
              </div>

              <div className="space-y-4">
                {result.aiFeedback.grammarCorrections.map((item, index) => (
                  <div
                    key={index}
                    className="
                                                rounded
                                                border border-[var(--warning)]/25
                                                bg-[var(--warning-soft)]
                                                p-5
                                                space-y-3
                                            "
                  >
                    <div>
                      <div className="mb-1 text-sm font-semibold text-[var(--text)]">
                        原句
                      </div>

                      <div className="text-sm leading-7 text-[var(--danger)]">
                        {item.original}
                      </div>
                    </div>

                    <div>
                      <div className="mb-1 text-sm font-semibold text-[var(--text)]">
                        正确版本
                      </div>

                      <div className="text-sm leading-7 text-[var(--success)]">
                        {item.corrected}
                      </div>
                    </div>

                    <div>
                      <div className="mb-1 text-sm font-semibold text-[var(--text)]">
                        解释
                      </div>

                      <div className="text-sm leading-7 text-[var(--text-soft)]">
                        {item.explanation}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* IMPROVED ANSWER */}

          <div>
            <div
              className="
                                mb-3
                                text-sm
                                font-semibold
                                uppercase
                                tracking-[0.16em]
                                text-[var(--text-soft)]
                            "
            >
              Improved Answer
            </div>

            <div
              className="
                                rounded
                                border border-[var(--primary)]/25
                                bg-[var(--primary-soft)]
                                p-5
                                text-[15px]
                                leading-8
                                text-[var(--text)]
                            "
            >
              {result.aiFeedback.improvedAnswer}
            </div>
          </div>
        </section>
      ) : null}

      {/* INPUT */}

      <div>
        <label className="mb-2 ml-1 block text-sm font-semibold text-[var(--muted)]">
          输入答案
        </label>

        <Textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="50 - 70 词总结听力大意..."
          className="min-h-[180px] px-5 py-4 text-[17px] leading-8 shadow-sm"
        />
      </div>

      {/* SUBMIT */}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="
                        cursor-pointer
                        inline-flex items-center
                        justify-center
                        gap-2
                        rounded
                        bg-[var(--theme)]
                        px-5 py-3
                        text-sm font-semibold
                        text-white
                        transition
                        hover:opacity-90
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                    "
        >
          {loading ? "提交中..." : "提交答案"}
        </button>
      </div>

      {/* NAVIGATION */}

      <div
        className="
                    mt-8
                    flex items-center
                    justify-between
                "
      >
        {questionNav.prevQuestionId ? (
          <Link
            href={`/pte/listening/sst/${questionNav.prevQuestionId}`}
            className="
                            inline-flex
                            items-center
                            gap-2
                            rounded
                            border border-[var(--border)]
                            bg-[var(--card)]
                            px-3 py-3
                            text-sm font-semibold
                            text-[var(--text)]
                            transition
                            hover:border-[var(--theme)]/30
                            hover:text-[var(--theme)]
                        "
          >
            <div className="h-5 w-5 text-[var(--primary)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M14.7 5.3a1 1 0 0 1 0 1.4L10.41 11H20a1 1 0 1 1 0 2h-9.59l4.3 4.3a1 1 0 0 1-1.42 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.41 0z" />
              </svg>
            </div>

            <span>上一题</span>
          </Link>
        ) : (
          <div />
        )}

        {questionNav.nextQuestionId ? (
          <Link
            href={`/pte/listening/sst/${questionNav.nextQuestionId}`}
            className="
                            inline-flex
                            items-center
                            gap-2
                            rounded
                            bg-[var(--theme)]
                            px-3 py-3
                            text-sm font-semibold
                            text-white
                            transition
                            hover:opacity-90
                        "
          >
            <span>下一题</span>

            <div className="h-5 w-5 text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M9.3 18.7a1 1 0 0 1 0-1.4L13.59 13H4a1 1 0 1 1 0-2h9.59L9.3 6.7a1 1 0 1 1 1.42-1.4l6 6a1 1 0 0 1 0 1.4l-6 6a1 1 0 0 1-1.41 0z" />
              </svg>
            </div>
          </Link>
        ) : null}
      </div>
      {/* QUESTION */}

      <div
        className="
                    round
                    bg-[var(--bg-soft)]
                    px-5 py-5
                "
      >
        <div className="mb-4 flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Tag tone="theme">SST</Tag>

            <Tag tone="green">第 {questionNav.questionNumber} 题</Tag>
          </div>

          <button
            type="button"
            onClick={() => setShowAnswer(!showAnswer)}
            className="btn-primary"
          >
            {showAnswer ? "隐藏原文" : "参考原文"}
          </button>
        </div>

        <div
          className={`
                        text-[18px]
                        leading-9
                        text-[var(--text)]
                        transition-all
                        duration-300

                        ${showAnswer ? "blur-0" : "select-none blur-[10px]"}
                    `}
        >
          <div className="rounded border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="mb-2 text-sm font-semibold text-[var(--text)]">
              参考原文
            </div>

            <div
              className="
                                whitespace-pre-wrap
                                text-sm
                                leading-7
                                transition
                            "
            >
              <DictionaryText text={question.transcript_text} />
            </div>
          </div>
        </div>
      </div>

      {/* ATTEMPT HISTORY */}

      <div
        className="
        rounded
        border border-[var(--border)]
        bg-[var(--card)]
        p-6
        shadow-sm
    "
      >
        <div
          className="
            mb-4
            text-lg
            font-semibold
            text-[var(--text)]
        "
        >
          历史记录
        </div>

        <div className="space-y-4">
          {attempts.map((attempt, index) => (
            <div
              key={attempt.id}
              className="
                    rounded
                    border border-[var(--border)]
                    bg-[var(--bg-soft)]
                    p-4
                "
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-sm font-semibold text-[var(--text)]">
                    Attempt #{attempts.length - index}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setExpandedAttempts((prev) => {
                        if (prev.includes(attempt.id)) {
                          return prev.filter((id) => id !== attempt.id);
                        }

                        return [...prev, attempt.id];
                      });
                    }}
                    className="btn-soft cursor-pointer"
                  >
                    {expandedAttempts.includes(attempt.id)
                      ? "收起 AI Feedback"
                      : "展开 AI Feedback"}
                  </button>
                </div>

                <div
                  className="
            rounded
            bg-[var(--theme)]
            px-3 py-1
            text-sm
            font-semibold
            text-white
        "
                >
                  {attempt.score ?? 0} / 90
                </div>
              </div>

              <div className="mt-2 text-xs text-[var(--text-soft)]">
                {new Date(attempt.submitted_at).toLocaleString()}
              </div>

              <div
                className="
                        mt-4
                        rounded
                        border border-[var(--border)]
                        bg-[var(--card)]
                        p-4
                    "
              >
                <div className="mb-2 text-sm font-semibold text-[var(--text)]">
                  你的答案
                </div>

                <div
                  className="
                            whitespace-pre-wrap
                            text-sm
                            leading-7
                            text-[var(--text-soft)]
                        "
                >
                  {attempt.user_answer}
                </div>

                {/* AI FEEDBACK */}

                {attempt.ai_feedback &&
                  expandedAttempts.includes(attempt.id) && (
                    <div className="mt-4 space-y-4">
                      {/* OVERALL */}

                      <div
                        className="
                rounded
                border border-[var(--primary)]/25
                bg-[var(--primary-soft)]
                p-4
            "
                      >
                        <div className="mb-2 text-sm font-semibold text-[var(--text)]">
                          AI 总评
                        </div>

                        <div
                          className="
                    text-sm
                    leading-7
                    text-[var(--text)]
                "
                        >
                          {attempt.ai_feedback.overallFeedback}
                        </div>
                      </div>

                      {/* IMPROVED ANSWER */}

                      <div
                        className="
                rounded
                border border-[var(--success)]/25
                bg-[var(--success-soft)]
                p-4
            "
                      >
                        <div className="mb-2 text-sm font-semibold text-[var(--text)]">
                          AI 改进版答案
                        </div>

                        <div
                          className="
                    text-sm
                    leading-7
                    text-[var(--text)]
                "
                        >
                          {attempt.ai_feedback.improvedAnswer}
                        </div>
                      </div>

                      {/* WEAKNESSES */}

                      {attempt.ai_feedback.weaknesses?.length > 0 && (
                        <div className="space-y-3">
                          {attempt.ai_feedback.weaknesses.map(
                            (weakness, weaknessIndex: number) => (
                              <div
                                key={weaknessIndex}
                                className="
                                    rounded
                                    border border-[var(--danger)]/25
                                    bg-[var(--danger-soft)]
                                    p-4
                                "
                              >
                                <div className="mb-2">
                                  <span
                                    className="
                                            rounded
                                            bg-[var(--danger-soft)]
                                            px-2 py-1
                                            text-xs
                                            font-semibold
                                            text-[var(--danger)]
                                        "
                                  >
                                    {weakness.category}
                                  </span>
                                </div>

                                <div className="space-y-2 text-sm leading-7 text-[var(--text-soft)]">
                                  <div>
                                    <span className="font-semibold text-[var(--text)]">
                                      问题：
                                    </span>{" "}
                                    {weakness.issue}
                                  </div>

                                  <div>
                                    <span className="font-semibold text-[var(--text)]">
                                      原文关键内容：
                                    </span>{" "}
                                    {weakness.example}
                                  </div>

                                  <div>
                                    <span className="font-semibold text-[var(--text)]">
                                      改进建议：
                                    </span>{" "}
                                    {weakness.suggestion}
                                  </div>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
