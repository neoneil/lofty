"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import DictionaryText from "@/components/dictionary/dictionary-text";
import AudioPlayer from "@/components/site/AudioPlayer";
import { normalizePublicStorageUrl } from "@/lib/storage/public-url";
import RecordingPanel from "@/components/site/RecordingPanel";
import Tag from "@/components/ui/tag";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-v2/card";

type Question = {
  id: string;
  question_text: string | null;
  answer_text: string | null;
  audio_url: string | null;
};

type UserRecording = {
  id: string;
  question_source: string;
  question_id: string;
  audio_url: string;
  duration_seconds: number | null;
  created_at: string | null;
};

type AsqScoreResult = {
  transcript: string;
  correctAnswer: string;
  matchedAnswer: string | null;
  answerVariants: string[];
};

type Props = {
  question: Question;
};

function formatDateTime(value: string | null) {
  if (!value) return "";

  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getAudioUrl(path: string) {
  return normalizePublicStorageUrl(path, "pte-audio");
}

function subscribeQuestionOrder(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getQuestionOrderSnapshot() {
  return sessionStorage.getItem("asq-question-order") ?? "[]";
}

function getServerQuestionOrderSnapshot() {
  return "[]";
}

export default function AsqDetailClient({ question }: Props) {
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
      nextQuestionId:
        currentIndex < ids.length - 1 ? ids[currentIndex + 1] : null,
    };
  }, [question.id, questionOrderSnapshot]);

  const [recordings, setRecordings] = useState<UserRecording[]>([]);
  const [recordingsLoading, setRecordingsLoading] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);
  const [audioFinished, setAudioFinished] = useState(!question.audio_url);
  const [scoreResult, setScoreResult] = useState<{ isCorrect: boolean; score: number; feedback: AsqScoreResult } | null>(null);

  const questionText = question.question_text?.trim() || "暂无题目文本";
  const answerText = question.answer_text?.trim() || "暂无答案文本";

  useEffect(() => {
    let cancelled = false;

    const loadRecordings = async () => {
      setRecordingsLoading(true);

      try {
        const res = await fetch(
          `/api/pte/asq/recordings?questionId=${question.id}`,
        );
        const json = await res.json();

        if (!res.ok || !json.ok) {
          throw new Error(json.message || "加载历史录音失败");
        }

        if (!cancelled) {
          setRecordings(json.recordings ?? []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) {
          setRecordingsLoading(false);
        }
      }
    };

    void loadRecordings();

    return () => {
      cancelled = true;
    };
  }, [question.id]);

  return (
    <div className="mt-8 space-y-6">
      <div className="round bg-[var(--bg-soft)] px-5 py-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Tag tone="theme">ASQ</Tag>
            {questionNav.questionNumber > 0 ? (
              <Tag tone="green">第 {questionNav.questionNumber} 题</Tag>
            ) : null}
            <Tag tone="yellow">Short Answer</Tag>
          </div>

          <button
            type="button"
            onClick={() => setShowAnswer(true)}
            className="btn-secondary"
          >
            显示答案
          </button>
        </div>

        <div className="space-y-5">
          <div
            className={`text-[18px] leading-9 text-[var(--text)] transition-all duration-300 ${
              showAnswer ? "blur-0" : "select-none blur-[10px]"
            }`}
          >
            <DictionaryText text={questionText} />
          </div>

          <div
            className={`rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] p-4 text-[16px] leading-8 text-[var(--text)] transition-all duration-300 ${
              showAnswer ? "blur-0" : "select-none blur-[10px]"
            }`}
          >
            <DictionaryText text={answerText} />
          </div>
        </div>
      </div>

      {question.audio_url ? (
        <div className="mx-auto w-full max-w-[50%] max-lg:max-w-[72%] max-sm:max-w-full">
          <AudioPlayer
            url={getAudioUrl(question.audio_url)}
            autoPlay
            countdown={3}
            size="compact"
            onEnded={() => setAudioFinished(true)}
          />
        </div>
      ) : (
        <div className="mx-auto w-full max-w-[50%] rounded border border-dashed border-[var(--border-strong)] bg-[var(--bg-soft)] p-6 text-center text-sm text-[var(--text-soft)] max-lg:max-w-[72%] max-sm:max-w-full">
          当前题目暂无音频
        </div>
      )}

      <div className="mx-auto w-full max-w-[50%] space-y-6 max-lg:max-w-[72%] max-sm:max-w-full">
        {audioFinished ? (
          <RecordingPanel
            questionId={question.id}
            type="ASQ"
            preparationDuration={3}
            maxDuration={10}
            autoStart
            uploadUrl="/api/pte/asq/upload"
            aiUsageFeature="pte_asq"
            onUploadSuccess={(newRecording, response) => {
              const feedback = response?.asqFeedback as AsqScoreResult | undefined;
              const isCorrect = response?.isCorrect === true;
              const score = typeof response?.score === "number" ? response.score : isCorrect ? 90 : 0;

              setRecordings((prev) => [newRecording, ...prev]);
              if (feedback) {
                setScoreResult({ isCorrect, score, feedback });
              }
              setShowAnswer(true);
              router.refresh();
            }}
          />
        ) : null}

        {scoreResult ? (
          <Card>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>自动判分结果</CardTitle>
                  <CardDescription>系统已根据录音转写与标准答案自动比对。</CardDescription>
                </div>
                <span className={`rounded px-4 py-1.5 text-sm font-semibold ${scoreResult.isCorrect ? "bg-[var(--success-soft)] text-[var(--success)]" : "bg-[var(--danger-soft)] text-[var(--danger)]"}`}>
                  {scoreResult.isCorrect ? "Correct" : "Incorrect"} · {scoreResult.score}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-faint)]">你的转写答案</div>
                  <p className="mt-2 text-sm leading-7 text-[var(--text)]">{scoreResult.feedback.transcript || "未识别到有效答案"}</p>
                </div>
                <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-faint)]">标准答案</div>
                  <p className="mt-2 text-sm leading-7 text-[var(--text)]">{scoreResult.feedback.correctAnswer || answerText}</p>
                </div>
              </div>

              {scoreResult.feedback.matchedAnswer ? (
                <div className="rounded border border-[var(--success)]/25 bg-[var(--success-soft)] px-4 py-3 text-sm font-semibold text-[var(--success)]">
                  匹配到答案：{scoreResult.feedback.matchedAnswer}
                </div>
              ) : (
                <div className="rounded border border-[var(--danger)]/25 bg-[var(--danger-soft)] px-4 py-3 text-sm font-semibold text-[var(--danger)]">
                  未匹配到标准答案，已记录为答错。
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <div>
              <CardTitle>我的历史录音</CardTitle>
              <CardDescription>最近上传的 ASQ 录音记录</CardDescription>
            </div>

            <span className="text-xs text-[var(--text-soft)]">
              {recordings.length} 条
            </span>
          </CardHeader>

          <CardContent>
            {recordingsLoading ? (
              <p className="text-sm text-[var(--text-soft)]">
                正在加载历史录音...
              </p>
            ) : recordings.length === 0 ? (
              <p className="text-sm text-[var(--text-soft)]">暂无历史录音</p>
            ) : (
              <div className="space-y-3">
                {recordings.map((recording, index) => (
                  <div
                    key={recording.id}
                    className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] p-3"
                  >
                    <div className="mb-2 text-xs text-[var(--text-soft)]">
                      Attempt {index + 1}
                      {recording.created_at
                        ? ` · ${formatDateTime(recording.created_at)}`
                        : ""}
                    </div>

                    <div className="mx-auto w-full max-w-[88%] max-sm:max-w-full">
                      <AudioPlayer url={recording.audio_url} size="compact" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex items-center justify-between">
        {questionNav.prevQuestionId ? (
          <Link
            href={`/pte/speaking/asq/${questionNav.prevQuestionId}`}
            className="inline-flex items-center gap-2 rounded border border-[var(--border)] bg-[var(--card)] px-3 py-3 text-sm font-semibold text-[var(--text-soft)] transition hover:border-[var(--theme)]/30 hover:text-[var(--theme)]"
          >
            <span>上一题</span>
          </Link>
        ) : (
          <div />
        )}

        {questionNav.nextQuestionId ? (
          <Link
            href={`/pte/speaking/asq/${questionNav.nextQuestionId}`}
            className="inline-flex items-center gap-2 rounded bg-[var(--theme)] px-3 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <span>下一题</span>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
