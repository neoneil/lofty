"use client";

import Link from "next/link";
import { useMemo } from "react";
import { getQuestionOrder } from "@/lib/question-order";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Textarea } from "@/components/ui-v2/textarea";
import DictionaryText from "@/components/dictionary/dictionary-text";
import AiUsageConfirmDialog from "@/components/ai/ai-usage-confirm-dialog";

import Tag from "@/components/ui/tag";

type Props = {
  question: {
    id: string;

    question_text: string;

    answer: string;
  };

  attempts: {
    id: string;

    score: number;

    user_answer: string;

    ai_feedback: {
      overallFeedback?: string;
      improvedAnswer?: string;
      weaknesses?: {
        category?: string;
        issue?: string;
        example?: string;
        suggestion?: string;
      }[];
    } | null;

    submitted_at: string;
  }[];
};

type SubmitResult = {
  score: number;

  aiFeedback: {
    overallScore: number;

    rubric: {
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
};

export default function SwtDetailClient({ question, attempts }: Props) {
  const [startedAt] = useState(() => Date.now());

  const [answer, setAnswer] = useState("");

  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState<SubmitResult | null>(null);

  const [expandedAttempts, setExpandedAttempts] = useState<string[]>([]);

  const router = useRouter();

  const { prevQuestionId, nextQuestionId, questionNumber } = useMemo(() => {
    const ids = getQuestionOrder("swt");

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

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/pte/swt/submit", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          questionId: question.id,

          userAnswer: answer,

          startedAt,
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
      {/* artical */}

      <div
        className="
                    round
                    bg-[var(--bg-soft)]
                    px-5 py-5
                "
      >
        <div className="mb-4 flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Tag tone="theme">SWT</Tag>

            <Tag tone="green">第 {questionNumber} 题</Tag>
          </div>
        </div>
        <div className="rounded border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="mb-2 text-sm font-semibold text-[var(--text)]">
            阅读原文
          </div>

          <div
            className="
        whitespace-pre-wrap
        text-sm
        leading-7
        transition"
          >
            <DictionaryText
              text={question.question_text.replace(/\n/g, "\n\n")}
            />
          </div>
        </div>
      </div>
      {/* RESULT */}

      {result ? (
        <section
          className="
                        round
                        border border-[var(--border)]
                        bg-[var(--bg-soft)]
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
                                bg-[var(--card)]
                                px-4 py-1.5
                                text-sm font-semibold
                                text-[var(--text-soft)]
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
                                bg-[var(--card)]
                                p-5
                                text-[15px]
                                leading-8
                                text-[var(--text-soft)]
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
                                            border border-[color:var(--danger)]/30
                                            bg-[var(--danger-soft)]
                                            p-5
                                            space-y-3
                                        "
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="
                                                    rounded
                                                    bg-[color:var(--danger)]/25
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
                                                border border-[color:var(--warning)]/30
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
                                border border-[color:var(--primary)]/30
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
          placeholder="在 10 分钟内 用 5 - 75 个单词的一句话总结其上文章"
          className="min-h-[180px] px-5 py-4 text-[17px] leading-8 shadow-sm"
        />
      </div>

      {/* SUBMIT */}

      <div className="flex justify-end">
        <AiUsageConfirmDialog feature="pte_swt" onConfirm={handleSubmit}>
          {(openDialog) => (
            <button type="button" onClick={openDialog} disabled={loading} className="inline-flex cursor-pointer items-center justify-center gap-2 rounded bg-[var(--theme)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? "提交中..." : "提交答案"}
            </button>
          )}
        </AiUsageConfirmDialog>
      </div>

      {/* NAVIGATION */}

      <div
        className="
                    mt-8
                    flex items-center
                    justify-between
                "
      >
        {prevQuestionId ? (
          <Link
            href={`/pte/writing/swt/${prevQuestionId}`}
            className="
                            inline-flex
                            items-center
                            gap-2
                            rounded
                            border border-[var(--border)]
                            bg-[var(--card)]
                            px-3 py-3
                            text-sm font-semibold
                            text-[var(--text-soft)]
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

        {nextQuestionId ? (
          <Link
            href={`/pte/writing/swt/${nextQuestionId}`}
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

      {question.answer ? (
        <div
          className="
            mt-8
            rounded-2xl
            border border-[color:var(--success)]/30
            bg-[var(--success-soft)]
            p-5
        "
        >
          <div
            className="
                mb-3
                text-sm
                font-semibold
                uppercase
                tracking-wider
                text-[var(--success)]
            "
          >
            参考答案
          </div>

          <div
            className="
                whitespace-pre-wrap
                text-[15px]
                leading-8
                text-[var(--text)]
            "
          >
            <DictionaryText text={question.answer} />
          </div>
        </div>
      ) : null}

      {/* ATTEMPT HISTORY */}

      <div
        className="
        rounded
        border border-[var(--border)]
        bg-[var(--card)]
        p-6
        shadow-sm"
      >
        <div className=" mb-4 text-lg font-semibold text-[var(--text)]">
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
                    Attempt {attempts.length - index}
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
                border border-[color:var(--primary)]/30
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
                    text-[var(--text-soft)]
                "
                        >
                          {attempt.ai_feedback.overallFeedback}
                        </div>
                      </div>

                      {/* IMPROVED ANSWER */}

                      <div
                        className="
                rounded
                border border-[color:var(--success)]/30
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
                    text-[var(--text-soft)]
                "
                        >
                          {attempt.ai_feedback.improvedAnswer}
                        </div>
                      </div>

                      {/* WEAKNESSES */}

                      {(attempt.ai_feedback.weaknesses?.length ?? 0) > 0 && (
                        <div className="space-y-3">
                          {(attempt.ai_feedback.weaknesses ?? []).map(
                            (weakness, weaknessIndex) => (
                              <div
                                key={weaknessIndex}
                                className="
                                    rounded
                                    border border-[color:var(--danger)]/30
                                    bg-[var(--danger-soft)]
                                    p-4
                                "
                              >
                                <div className="mb-2">
                                  <span
                                    className="
                                            rounded
                                            bg-[color:var(--danger)]/25
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
