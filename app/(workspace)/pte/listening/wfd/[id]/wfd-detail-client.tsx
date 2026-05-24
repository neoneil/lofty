"use client";
import Link from "next/link";
import { useEffect } from "react";
import { getQuestionOrder } from "@/lib/question-order";
import { useRouter } from "next/navigation";
import { useState } from "react";
import DictionaryText from "@/components/dictionary/dictionary-text"; // dictionary 查词
import Tag from "@/components/ui/tag";
import { Textarea } from "@/components/ui-v2/textarea";
type Props = {
  question: {
    id: string;
    question_text: string;
  };
};

type Token = {
  text: string;
  type: "correct" | "missing" | "extra";
};

type SubmitResult = {
  // score: number;
  correctWords: number;
  totalWords: number;
  isCorrect: boolean;
  tokens: Token[];
};

export default function WfdDetailClient({ question }: Props) {
  const [startedAt] = useState(Date.now());

  const [answer, setAnswer] = useState("");

  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState<SubmitResult | null>(null);

  const [showAnswer, setShowAnswer] = useState(false);

  const router = useRouter();

  const [prevQuestionId, setPrevQuestionId] = useState<string | null>(null);

  const [nextQuestionId, setNextQuestionId] = useState<string | null>(null);

  const [questionNumber, setQuestionNumber] = useState<number>(0);

  useEffect(() => {
    const ids = getQuestionOrder("wfd");

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
      const res = await fetch("/api/pte/wfd/submit", {
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
        throw new Error(data.message || "提交失败");
      }

      setResult({
        correctWords: data.score || 0,
        totalWords: data.totalWords || 0,
        isCorrect: data.isCorrect,
        tokens: data.tokens || [],
      });
      // AUTO SHOW ANSWER
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
      {/* QUESTION TEXT */}
      <div
        className="
        round
        bg-gray-50
        px-5 py-5"
      >
        <div className="mb-4 flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Tag tone="theme">WFD</Tag>

            <Tag tone="green">第 {questionNumber} 题</Tag>
          </div>

          <button
            type="button"
            onClick={() => setShowAnswer(!showAnswer)}
            className="btn-primary"
          >
            {showAnswer ? "隐藏答案" : "答案"}
          </button>
        </div>

        <div
          className={`
            text-[18px]
            leading-9
            text-gray-800

            transition-all
            duration-300

            ${showAnswer ? "blur-0" : "select-none blur-[10px]"}`}
        >
          <DictionaryText text={question.question_text} />
        </div>
      </div>
      {/* RESULT */}
      {result ? (
        <section className="round border border-gray-200 bg-[#faf8f4] p-6 shadow-sm">
          {/* TOP */}
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span
              className={`rounded px-4 py-1.5 text-sm font-semibold ${
                result.isCorrect
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {result.isCorrect ? "Correct" : "Wrong"}
            </span>

            <span className="rounded bg-white px-4 py-1.5 text-sm font-semibold text-gray-700 border border-gray-200">
              Score: {result.correctWords} / {result.totalWords}
            </span>
          </div>

          {/* ANSWER FEEDBACK */}
          <div>
            <div className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-gray-500">
              Feedback
            </div>

            <div className="flex flex-wrap gap-2 rounded border border-gray-200 bg-white p-5 leading-8">
              {result.tokens.map((token, index) => {
                if (token.type === "correct") {
                  return (
                    <span
                      key={`${token.text}-${index}`}
                      className="round bg-green-100 px-2 py-1 text-[15px] font-medium text-green-700"
                    >
                      {token.text}
                    </span>
                  );
                }

                if (token.type === "missing") {
                  return (
                    <span
                      key={`${token.text}-${index}`}
                      className="round bg-red-100 px-2 py-1 text-[15px] font-medium text-red-700 line-through"
                    >
                      {token.text}
                    </span>
                  );
                }

                return (
                  <span
                    key={`${token.text}-${index}`}
                    className="round bg-yellow-100 px-2 py-1 text-[15px] font-medium text-yellow-700"
                  >
                    {token.text}
                  </span>
                );
              })}
            </div>
          </div>

          {/* LEGEND */}
          <div className="mt-5 flex flex-wrap gap-3 text-xs font-medium text-gray-500">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-green-400" />
              Correct
            </div>

            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-red-400" />
              Missing
            </div>

            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-yellow-400" />
              Extra
            </div>
          </div>
        </section>
      ) : null}
      {/* INPUT */}
      <div>
        <label className="mb-2 ml-1 block text-sm font-semibold text-(--muted)">
          输入答案
        </label>

        <Textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="写出你所听到的句子..."
          className="min-h-[180px] text-[17px] leading-8 shadow-sm"
        />
      </div>
      {/* SUBMIT */}
      {/* SUBMIT */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className=" cursor-pointer
            inline-flex items-center justify-center
            gap-2
            rounded
            bg-[var(--theme)]
            px-5 py-3
            text-sm font-semibold text-white
            transition
            hover:opacity-90
            disabled:cursor-not-allowed
            disabled:opacity-50
        "
        >
          {loading ? "提交中..." : "提交答案"}
        </button>
      </div>
      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between">
        {prevQuestionId ? (
          <Link
            href={`/pte/listening/wfd/${prevQuestionId}`}
            className="
        inline-flex items-center gap-2
        rounded border border-gray-200
        bg-white px-3 py-3
        text-sm font-semibold text-gray-700
        transition
        hover:border-[var(--theme)]/30
        hover:text-[var(--theme)]"
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
            href={`/pte/listening/wfd/${nextQuestionId}`}
            className="
        inline-flex items-center gap-2
        rounded
        bg-[var(--theme)]
        px-3 py-3
        text-sm font-semibold text-white
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
    </div>
  );
}
