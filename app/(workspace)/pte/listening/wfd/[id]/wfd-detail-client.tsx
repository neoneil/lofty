"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePteQuestionNavigation } from "@/lib/question-order-client";
import { useRouter } from "next/navigation";
import DictionaryText from "@/components/dictionary/dictionary-text"; // dictionary 查词
import Tag from "@/components/ui/tag";
import { Textarea } from "@/components/ui-v2/textarea";
import { PteQuestionNavigationControls } from "@/components/pte/pte-question-navigation-controls";
type Props = {
  question: {
    id: string;
    question_text: string;
  };
  aiImageUrl?: string | null;
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

export default function WfdDetailClient({ question, aiImageUrl }: Props) {
  const startedAtRef = useRef<number | null>(null);

  const [answer, setAnswer] = useState("");

  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState<SubmitResult | null>(null);

  const [showAnswer, setShowAnswer] = useState(false);

  const router = useRouter();
  const questionNav = usePteQuestionNavigation("wfd", question.id);

  useEffect(() => {
    startedAtRef.current = Date.now();
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
          startedAt: startedAtRef.current ?? Date.now(),
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
      <div className="round bg-[var(--bg-soft)] px-5 py-5">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Tag tone="theme">WFD</Tag>

            <Tag tone="green">第 {questionNav.questionNumber} 题</Tag>
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
          className={`text-[18px] leading-9 text-[var(--text)] transition-all duration-300 ${showAnswer ? "blur-0" : "select-none blur-[10px]"}`}
        >
          <DictionaryText text={question.question_text} />
        </div>

        {showAnswer && aiImageUrl ? (
          <figure className="mx-auto mt-5 w-full max-w-[520px] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-soft)] shadow-[var(--shadow-sm)]">
            <Image src={aiImageUrl} alt="WFD visual memory aid" width={1024} height={1024} className="aspect-square w-full object-cover" />
          </figure>
        ) : null}
      </div>
      {/* RESULT */}
      {result ? (
        <section className="round border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-sm)]">
          {/* TOP */}
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span
              className={`rounded px-4 py-1.5 text-sm font-semibold ${
                result.isCorrect
                  ? "bg-[var(--success-soft)] text-[var(--success)]"
                  : "bg-[var(--danger-soft)] text-[var(--danger)]"
              }`}
            >
              {result.isCorrect ? "Correct" : "Wrong"}
            </span>

            <span className="rounded border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-1.5 text-sm font-semibold text-[var(--text)]">
              Score: {result.correctWords} / {result.totalWords}
            </span>
          </div>

          {/* ANSWER FEEDBACK */}
          <div>
            <div className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-soft)]">
              Feedback
            </div>

            <div className="flex flex-wrap gap-2 rounded border border-[var(--border)] bg-[var(--bg-soft)] p-5 leading-8">
              {result.tokens.map((token, index) => {
                if (token.type === "correct") {
                  return (
                    <span
                      key={`${token.text}-${index}`}
                      className="round bg-[var(--success-soft)] px-2 py-1 text-[15px] font-medium text-[var(--success)]"
                    >
                      {token.text}
                    </span>
                  );
                }

                if (token.type === "missing") {
                  return (
                    <span
                      key={`${token.text}-${index}`}
                      className="round bg-[var(--danger-soft)] px-2 py-1 text-[15px] font-medium text-[var(--danger)] line-through"
                    >
                      {token.text}
                    </span>
                  );
                }

                return (
                  <span
                    key={`${token.text}-${index}`}
                    className="round bg-[var(--warning-soft)] px-2 py-1 text-[15px] font-medium text-[var(--warning)]"
                  >
                    {token.text}
                  </span>
                );
              })}
            </div>
          </div>

          {/* LEGEND */}
          <div className="mt-5 flex flex-wrap gap-3 text-xs font-medium text-[var(--text-soft)]">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-[var(--success)]" />
              Correct
            </div>

            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-[var(--danger)]" />
              Missing
            </div>

            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-[var(--warning)]" />
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
      <PteQuestionNavigationControls
        key={question.id}
        navigation={questionNav}
        routeBase="/pte/listening/wfd"
        audioProfile={{ kind: "voice", questionType: "wfd" }}
      />
    </div>
  );
}
