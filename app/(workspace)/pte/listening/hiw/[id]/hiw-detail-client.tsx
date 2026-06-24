"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import DictionaryText from "@/components/dictionary/dictionary-text";

type HiwIncorrectWord = {
  index: number;
  shown_word: string;
  correct_word: string;
};

type Question = {
  id: number;
  question_text: string;
  instruction_text: string | null;
  question_body_text: string | null;
  incorrect_words_json: HiwIncorrectWord[] | null;
};

type SubmitResult = {
  submittedAt: string;
  score: number;
  total: number;
  correctCount: number;
  wrongCount: number;
  missedCount: number;
  isPerfect: boolean;
  correctIndexes: number[];
  wrongSelected: number[];
  missed: number[];
};

function subscribeQuestionOrder(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getQuestionOrderSnapshot() {
  return sessionStorage.getItem("hiw-question-order") ?? "[]";
}

function getServerQuestionOrderSnapshot() {
  return "[]";
}

function tokenizeText(text: string) {
  return text.match(/\S+\s*/g) ?? [];
}

function cleanWord(word: string) {
  return word.toLowerCase().replace(/[“”‘’"'.,!?;:()[\]{}]/g, "").trim();
}

function getCorrectIndexes(questionBodyText: string, incorrectWords: HiwIncorrectWord[]) {
  const tokens = tokenizeText(questionBodyText);
  const usedIndexes = new Set<number>();

  return incorrectWords
    .map((item) => {
      const target = cleanWord(item.shown_word);
      const foundIndex = tokens.findIndex((token, index) => {
        if (usedIndexes.has(index)) return false;
        return cleanWord(token) === target;
      });

      if (foundIndex !== -1) usedIndexes.add(foundIndex);
      return foundIndex;
    })
    .filter((index) => index !== -1);
}

function markHiwAnswer({ questionBodyText, incorrectWords, selectedIndexes }: { questionBodyText: string; incorrectWords: HiwIncorrectWord[]; selectedIndexes: number[] }) {
  const correctIndexes = getCorrectIndexes(questionBodyText, incorrectWords);
  const correctSelected = selectedIndexes.filter((index) => correctIndexes.includes(index));
  const wrongSelected = selectedIndexes.filter((index) => !correctIndexes.includes(index));
  const missed = correctIndexes.filter((index) => !selectedIndexes.includes(index));

  return {
    total: correctIndexes.length,
    correctCount: correctSelected.length,
    wrongCount: wrongSelected.length,
    missedCount: missed.length,
    score: correctSelected.length,
    isPerfect: wrongSelected.length === 0 && missed.length === 0,
    correctIndexes,
    wrongSelected,
    missed,
  };
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function HiwTextSelector({ text, selectedIndexes, correctIndexes, wrongSelectedIndexes, missedIndexes, showResult, onToggle }: { text: string; selectedIndexes: number[]; correctIndexes: number[]; wrongSelectedIndexes: number[]; missedIndexes: number[]; showResult: boolean; onToggle: (index: number) => void }) {
  const tokens = tokenizeText(text);

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-4 text-[16px] leading-9 text-[var(--text)] shadow-[var(--shadow-sm)] sm:p-5 sm:text-[17px]">
      {tokens.map((token, index) => {
        const selected = selectedIndexes.includes(index);
        const isCorrect = correctIndexes.includes(index);
        const isWrong = wrongSelectedIndexes.includes(index);
        const isMissed = missedIndexes.includes(index);
        let className = "text-[var(--text)] hover:bg-[var(--bg-soft)]";

        if (selected && !showResult) className = "bg-[var(--danger-soft)] font-semibold text-[var(--danger)]";
        if (showResult && isCorrect && selected) className = "bg-[var(--success-soft)] font-semibold text-[var(--success)]";
        if (showResult && isWrong) className = "bg-[var(--danger-soft)] font-semibold text-[var(--danger)] line-through";
        if (showResult && isMissed) className = "bg-[var(--warning-soft)] font-semibold text-[var(--warning)]";

        return (
          <button key={`${token}-${index}`} type="button" onClick={() => onToggle(index)} disabled={showResult} className={`mx-0.5 rounded-[var(--radius-sm)] px-1 transition ${className}`}>
            {token}
          </button>
        );
      })}
    </div>
  );
}

export default function HiwDetailClient({ question }: { question: Question }) {
  const startedAtRef = useRef<number | null>(null);
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const router = useRouter();
  const questionOrderSnapshot = useSyncExternalStore(subscribeQuestionOrder, getQuestionOrderSnapshot, getServerQuestionOrderSnapshot);

  const questionNav = useMemo(() => {
    let ids: string[] = [];

    try {
      ids = JSON.parse(questionOrderSnapshot);
    } catch {
      ids = [];
    }

    const currentIndex = ids.findIndex((qId) => qId === String(question.id));

    return {
      questionNumber: currentIndex === -1 ? 0 : currentIndex + 1,
      prevQuestionId: currentIndex > 0 ? ids[currentIndex - 1] : null,
      nextQuestionId: currentIndex !== -1 && currentIndex < ids.length - 1 ? ids[currentIndex + 1] : null,
    };
  }, [question.id, questionOrderSnapshot]);

  const bodyText = question.question_body_text ?? "";
  const incorrectWords = useMemo(() => question.incorrect_words_json ?? [], [question.incorrect_words_json]);
  const correctIndexes = useMemo(() => (bodyText ? getCorrectIndexes(bodyText, incorrectWords) : []), [bodyText, incorrectWords]);

  useEffect(() => {
    startedAtRef.current = Date.now();
  }, []);

  const handleToggleWord = (wordIndex: number) => {
    if (result) return;
    setSelectedIndexes((prev) => (prev.includes(wordIndex) ? prev.filter((item) => item !== wordIndex) : [...prev, wordIndex]));
  };

  const handleReset = () => {
    setSelectedIndexes([]);
    setResult(null);
    startedAtRef.current = Date.now();
  };

  const handleSubmit = async () => {
    if (!bodyText) {
      alert("当前题目没有 question_body_text");
      return;
    }

    if (incorrectWords.length === 0) {
      alert("当前题目没有 incorrect_words_json");
      return;
    }

    if (selectedIndexes.length === 0) {
      alert("请先点击你认为错误的单词");
      return;
    }

    const tokens = tokenizeText(bodyText);
    const localResult = markHiwAnswer({ questionBodyText: bodyText, incorrectWords, selectedIndexes });

    setLoading(true);

    try {
      const res = await fetch("/api/pte/hiw/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          selectedIndexes,
          selectedWords: selectedIndexes.map((index) => cleanWord(tokens[index] ?? "")),
          correctIndexes: localResult.correctIndexes,
          correctWords: incorrectWords.map((item) => item.shown_word),
          score: localResult.score,
          total: localResult.total,
          isCorrect: localResult.isPerfect,
          startedAt: startedAtRef.current ?? Date.now(),
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || json?.ok === false) throw new Error(json?.message || "提交失败");

      setResult({
        submittedAt: json?.submittedAt ?? new Date().toISOString(),
        score: localResult.score,
        total: localResult.total,
        correctCount: localResult.correctCount,
        wrongCount: localResult.wrongCount,
        missedCount: localResult.missedCount,
        isPerfect: localResult.isPerfect,
        correctIndexes: localResult.correctIndexes,
        wrongSelected: localResult.wrongSelected,
        missed: localResult.missed,
      });

      router.refresh();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "提交失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 space-y-6">
      <section className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-5">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-semibold text-[var(--text)]">点击错误单词</div>
          <div className="text-xs font-medium text-[var(--text-soft)]">已选择 {selectedIndexes.length} 个 / 正确答案 {correctIndexes.length} 个</div>
        </div>
        {bodyText ? (
          <HiwTextSelector text={bodyText} selectedIndexes={selectedIndexes} correctIndexes={result?.correctIndexes ?? []} wrongSelectedIndexes={result?.wrongSelected ?? []} missedIndexes={result?.missed ?? []} showResult={Boolean(result)} onToggle={handleToggleWord} />
        ) : (
          <div className="rounded-[var(--radius-md)] border border-[var(--warning)]/25 bg-[var(--warning-soft)] p-4 text-sm text-[var(--warning)]">当前题目没有 question_body_text。</div>
        )}
      </section>

      <div className="flex flex-wrap justify-end gap-3">
        <button type="button" onClick={handleReset} className="inline-flex cursor-pointer items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-5 py-3 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--primary)]/30 hover:text-[var(--primary)]">重新选择</button>
        <button type="button" onClick={handleSubmit} disabled={loading || Boolean(result)} className="inline-flex cursor-pointer items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">{loading ? "提交中..." : result ? "已提交" : "提交答案"}</button>
      </div>

      {result ? (
        <section className={`rounded-[var(--radius-md)] border p-5 text-sm shadow-[var(--shadow-sm)] ${result.isPerfect ? "border-[var(--success)]/25 bg-[var(--success-soft)] text-[var(--success)]" : "border-[var(--warning)]/25 bg-[var(--warning-soft)] text-[var(--warning)]"}`}>
          <div className="font-semibold">{result.isPerfect ? "全部正确" : "已完成判分"}</div>
          <div className="mt-2 text-[var(--text)]">得分：{result.score} / {result.total}</div>
          <div className="mt-1 text-[var(--text)]">选对：{result.correctCount} 个，错选：{result.wrongCount} 个，漏选：{result.missedCount} 个</div>
          <div className="mt-2 text-xs text-[var(--text-soft)]">提交时间：{formatDateTime(result.submittedAt)}</div>
        </section>
      ) : null}

      {result ? (
        <section className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
          <div className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-soft)]">答案解析</div>
          <div className="space-y-2">
            {incorrectWords.map((word) => (
              <div key={`${word.index}-${word.shown_word}`} className="flex flex-wrap items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--bg-soft)] px-3 py-2 text-sm">
                <span className="text-[var(--danger)] line-through"><DictionaryText text={word.shown_word} /></span>
                <span className="text-[var(--text-faint)]">→</span>
                <span className="font-semibold text-[var(--success)]"><DictionaryText text={word.correct_word} /></span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="round bg-[var(--success-soft)] px-2.5 py-1 font-medium text-[var(--success)]">绿色：选对</span>
            <span className="round bg-[var(--danger-soft)] px-2.5 py-1 font-medium text-[var(--danger)]">红色：错选</span>
            <span className="round bg-[var(--warning-soft)] px-2.5 py-1 font-medium text-[var(--warning)]">黄色：漏选</span>
          </div>
        </section>
      ) : null}

      <div className="mt-8 flex items-center justify-between">
        {questionNav.prevQuestionId ? (
          <Link href={`/pte/listening/hiw/${questionNav.prevQuestionId}`} className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-3 py-3 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--primary)]/30 hover:text-[var(--primary)]">← 上一题</Link>
        ) : (
          <span />
        )}
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-faint)]">Question {questionNav.questionNumber || "-"}</div>
        {questionNav.nextQuestionId ? (
          <Link href={`/pte/listening/hiw/${questionNav.nextQuestionId}`} className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-3 py-3 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--primary)]/30 hover:text-[var(--primary)]">下一题 →</Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
