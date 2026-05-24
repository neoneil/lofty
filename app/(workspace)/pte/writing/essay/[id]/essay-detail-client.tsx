"use client";

import Link from "next/link";
import { useEffect } from "react";
import { getQuestionOrder } from "@/lib/question-order";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AiThinking from "@/components/ai/ai-thinking";
import AiSubmitButton from "@/components/ai/ai-submit-button";
import DictionaryText from "@/components/dictionary/dictionary-text";
import { Textarea } from "@/components/ui-v2/textarea";
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

    ai_feedback: any;

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

export default function EssayDetailClient({ question, attempts }: Props) {
  const [startedAt] = useState(Date.now());

  const [answer, setAnswer] = useState("");

  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState<SubmitResult | null>(null);

  const [expandedAttempts, setExpandedAttempts] = useState<string[]>([]);

  const router = useRouter();

  const [prevQuestionId, setPrevQuestionId] = useState<string | null>(null);

  const [nextQuestionId, setNextQuestionId] = useState<string | null>(null);

  const [questionNumber, setQuestionNumber] = useState<number>(0);

  useEffect(() => {
    const ids = getQuestionOrder("we");

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

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/pte/essay/submit", {
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
                    bg-gray-50
                    px-5 py-5
                "
      >
        <div className="mb-4 flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Tag tone="theme">Essay</Tag>

            <Tag tone="green">第 {questionNumber} 题</Tag>
          </div>
        </div>
        <div className="rounded border border-gray-200 bg-white p-4">
          <div className="mb-2 text-sm font-semibold text-gray-900">
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
                        border border-gray-200
                        bg-[#faf8f4]
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
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }
                            `}
            >
              {result.score >= 65 ? "Good" : "Needs Improvement"}
            </span>

            <span
              className="
                                rounded
                                border border-gray-200
                                bg-white
                                px-4 py-1.5
                                text-sm font-semibold
                                text-gray-700
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
                                text-gray-500
                            "
            >
              AI Feedback
            </div>

            <div
              className="
                                rounded
                                border border-gray-200
                                bg-white
                                p-5
                                text-[15px]
                                leading-8
                                text-gray-700
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
                                text-gray-500
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
                                            bg-green-100
                                            px-3 py-2
                                            text-sm
                                            font-medium
                                            text-green-700
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
                                text-gray-500
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
                                            border border-red-200
                                            bg-red-50
                                            p-5
                                            space-y-3
                                        "
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="
                                                    rounded
                                                    bg-red-200
                                                    px-2 py-1
                                                    text-xs
                                                    font-semibold
                                                    text-red-700
                                                "
                    >
                      {item.category}
                    </span>
                  </div>

                  <div>
                    <div className="mb-1 text-sm font-semibold text-gray-900">
                      问题
                    </div>

                    <div className="text-sm leading-7 text-gray-700">
                      {item.issue}
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 text-sm font-semibold text-gray-900">
                      原文关键内容
                    </div>

                    <div className="text-sm leading-7 text-gray-700">
                      {item.example}
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 text-sm font-semibold text-gray-900">
                      改进建议
                    </div>

                    <div className="text-sm leading-7 text-gray-700">
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
                                    text-gray-500
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
                                                border border-amber-200
                                                bg-amber-50
                                                p-5
                                                space-y-3
                                            "
                  >
                    <div>
                      <div className="mb-1 text-sm font-semibold text-gray-900">
                        原句
                      </div>

                      <div className="text-sm leading-7 text-red-700">
                        {item.original}
                      </div>
                    </div>

                    <div>
                      <div className="mb-1 text-sm font-semibold text-gray-900">
                        正确版本
                      </div>

                      <div className="text-sm leading-7 text-green-700">
                        {item.corrected}
                      </div>
                    </div>

                    <div>
                      <div className="mb-1 text-sm font-semibold text-gray-900">
                        解释
                      </div>

                      <div className="text-sm leading-7 text-gray-700">
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
                                text-gray-500
                            "
            >
              Improved Answer
            </div>

            <div
              className="
                                rounded
                                border border-blue-200
                                bg-blue-50
                                p-5
                                text-[15px]
                                leading-8
                                text-gray-800
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
          placeholder="在 20 分钟内 写一篇200词 - 300词的文章"
          className="min-h-[180px] px-5 py-4 text-[17px] leading-8 shadow-sm"
        />
      </div>

      {/* SUBMIT */}

      <div className="flex justify-end">
        <AiSubmitButton
          loading={loading}
          disabled={loading || !!result}
          completed={!!result}
          onClick={handleSubmit}
        />
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
            href={`/pte/writing/essay/${prevQuestionId}`}
            className="
                            inline-flex
                            items-center
                            gap-2
                            rounded
                            border border-gray-200
                            bg-white
                            px-3 py-3
                            text-sm font-semibold
                            text-gray-700
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
            href={`/pte/writing/essay/${nextQuestionId}`}
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
            border border-emerald-200
            bg-emerald-50
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
                text-emerald-700
            "
          >
            参考答案
          </div>

          <div
            className="
                whitespace-pre-wrap
                text-[15px]
                leading-8
                text-gray-800
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
        border border-gray-200
        bg-white
        p-6
        shadow-sm"
      >
        <div className=" mb-4 text-lg font-semibold text-gray-900">
          历史记录
        </div>

        <div className="space-y-4">
          {attempts.map((attempt, index) => (
            <div
              key={attempt.id}
              className="
                    rounded
                    border border-gray-200
                    bg-gray-50
                    p-4
                "
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-sm font-semibold text-gray-800">
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

              <div className="mt-2 text-xs text-gray-500">
                {new Date(attempt.submitted_at).toLocaleString()}
              </div>

              <div
                className="
                        mt-4
                        rounded
                        border border-gray-200
                        bg-white
                        p-4
                    "
              >
                <div className="mb-2 text-sm font-semibold text-gray-900">
                  你的答案
                </div>

                <div
                  className="
                            whitespace-pre-wrap
                            text-sm
                            leading-7
                            text-gray-700
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
                border border-blue-200
                bg-blue-50
                p-4
            "
                      >
                        <div className="mb-2 text-sm font-semibold text-gray-900">
                          AI 总评
                        </div>

                        <div
                          className="
                    text-sm
                    leading-7
                    text-gray-700
                "
                        >
                          {attempt.ai_feedback.overallFeedback}
                        </div>
                      </div>

                      {/* IMPROVED ANSWER */}

                      <div
                        className="
                rounded
                border border-green-200
                bg-green-50
                p-4
            "
                      >
                        <div className="mb-2 text-sm font-semibold text-gray-900">
                          AI 改进版答案
                        </div>

                        <div
                          className="
                    text-sm
                    leading-7
                    text-gray-700
                "
                        >
                          {attempt.ai_feedback.improvedAnswer}
                        </div>
                      </div>

                      {/* WEAKNESSES */}

                      {attempt.ai_feedback.weaknesses?.length > 0 && (
                        <div className="space-y-3">
                          {attempt.ai_feedback.weaknesses.map(
                            (weakness: any, weaknessIndex: number) => (
                              <div
                                key={weaknessIndex}
                                className="
                                    rounded
                                    border border-red-200
                                    bg-red-50
                                    p-4
                                "
                              >
                                <div className="mb-2">
                                  <span
                                    className="
                                            rounded
                                            bg-red-200
                                            px-2 py-1
                                            text-xs
                                            font-semibold
                                            text-red-700
                                        "
                                  >
                                    {weakness.category}
                                  </span>
                                </div>

                                <div className="space-y-2 text-sm leading-7 text-gray-700">
                                  <div>
                                    <span className="font-semibold text-gray-900">
                                      问题：
                                    </span>{" "}
                                    {weakness.issue}
                                  </div>

                                  <div>
                                    <span className="font-semibold text-gray-900">
                                      原文关键内容：
                                    </span>{" "}
                                    {weakness.example}
                                  </div>

                                  <div>
                                    <span className="font-semibold text-gray-900">
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
