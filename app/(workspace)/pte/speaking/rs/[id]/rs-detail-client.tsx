"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import DictionaryText from "@/components/dictionary/dictionary-text";
import AudioPlayer from "@/components/site/AudioPlayer";
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
  question_text: string;
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

type RSScoreResult = {
  overallScore: number;
  contentScore: number;
  fluencyScore: number;
  pronunciationScore: number;
  transcript: string;
  feedback: string;
  suggestions: string[];
  azure?: {
    recognizedText: string;
    pronunciationScore: number | null;
    pronunciationScorePte: number | null;
    accuracyScore: number | null;
    completenessScore: number | null;
    fluencyScore: number | null;
    confidence: number | null;
    words: {
      word: string;
      accuracyScore: number | null;
      errorType: string | null;
    }[];
  };
};

type Props = {
  question: Question;
};

function getWordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

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
  if (path.startsWith("http")) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/pte-audio/${path}`;
}

function subscribeQuestionOrder(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getQuestionOrderSnapshot() {
  return sessionStorage.getItem("rs-question-order") ?? "[]";
}

function getServerQuestionOrderSnapshot() {
  return "[]";
}

export default function RsDetailClient({ question }: Props) {
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
  const [scoreResult, setScoreResult] = useState<RSScoreResult | null>(null);

  const loadRecordings = useCallback(
    async ({ showLoading = true }: { showLoading?: boolean } = {}) => {
      if (showLoading) {
        setRecordingsLoading(true);
      }

      try {
        const res = await fetch(`/api/pte/rs/recordings?questionId=${question.id}`);
        const json = await res.json();

        if (!res.ok || !json.ok) {
          throw new Error(json.message || "加载历史录音失败");
        }

        setRecordings(json.recordings ?? []);
      } catch (error) {
        console.error(error);
      } finally {
        if (showLoading) {
          setRecordingsLoading(false);
        }
      }
    },
    [question.id],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRecordings();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadRecordings]);

  return (
    <div className="mt-8 space-y-6">
      <div className="round bg-[var(--bg-soft)] px-5 py-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Tag tone="theme">RS</Tag>
            {questionNav.questionNumber > 0 ? (
              <Tag tone="green">第 {questionNav.questionNumber} 题</Tag>
            ) : null}
            <Tag tone="yellow">{getWordCount(question.question_text)} Words</Tag>
          </div>

          <button
            type="button"
            onClick={() => setShowAnswer(true)}
            className="btn-secondary"
          >
            显示答案
          </button>
        </div>

        <div
          className={`text-[18px] leading-9 text-[var(--text)] transition-all duration-300 ${
            showAnswer ? "blur-0" : "select-none blur-[10px]"
          }`}
        >
          <DictionaryText text={question.question_text} />
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
            type="RS"
            preparationDuration={3}
            maxDuration={40}
            autoStart
            uploadUrl="/api/pte/rs/submit"
            uploadFormat="wav"
            onUploadSuccess={(newRecording, response) => {
              const aiFeedback = response?.aiFeedback as RSScoreResult | undefined;
              if (aiFeedback) {
                setScoreResult(aiFeedback);
              }

              setRecordings((prev) => [newRecording, ...prev]);
              setShowAnswer(true);
              void loadRecordings({ showLoading: false });
              router.refresh();
            }}
          />
        ) : null}

        {scoreResult ? (
          <Card>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`rounded px-4 py-1.5 text-sm font-semibold ${
                    scoreResult.overallScore >= 65
                      ? "bg-[var(--success-soft)] text-[var(--success)]"
                      : "bg-[var(--danger-soft)] text-[var(--danger)]"
                  }`}
                >
                  {scoreResult.overallScore >= 65
                    ? "Good"
                    : "Needs Improvement"}
                </span>

                <span className="rounded border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-1.5 text-sm font-semibold text-[var(--text)]">
                  Score: {scoreResult.overallScore} / 90
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["Content", scoreResult.contentScore],
                  ["Fluency", scoreResult.fluencyScore],
                  ["Pronunciation", scoreResult.pronunciationScore],
                ].map(([label, score]) => (
                  <div
                    key={label}
                    className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] p-4"
                  >
                    <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]">
                      {label}
                    </div>
                    <div className="mt-2 text-2xl font-black text-[var(--primary)]">
                      {score}
                    </div>
                  </div>
                ))}
              </div>

              {scoreResult.azure ? (
                <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-[var(--text)]">
                      Azure 发音细节
                    </h3>
                    <span className="text-xs font-medium text-[var(--text-soft)]">
                      原始分 0-100，PTE 展示分已换算到 0-90
                    </span>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-4">
                    {[
                      ["PronScore", scoreResult.azure.pronunciationScore],
                      ["Accuracy", scoreResult.azure.accuracyScore],
                      ["Completeness", scoreResult.azure.completenessScore],
                      ["Azure Fluency", scoreResult.azure.fluencyScore],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded border border-[var(--border)] bg-[var(--card)] px-3 py-2"
                      >
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-soft)]">
                          {label}
                        </div>
                        <div className="mt-1 text-lg font-black text-[var(--primary)]">
                          {value ?? "-"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div>
                <h3 className="text-sm font-semibold text-[var(--text)]">
                  AI 反馈
                </h3>
                <p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">
                  {scoreResult.feedback}
                </p>
              </div>

              {scoreResult.suggestions.length ? (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text)]">
                    提升建议
                  </h3>
                  <ul className="mt-2 space-y-2 text-sm leading-7 text-[var(--text-soft)]">
                    {scoreResult.suggestions.map((suggestion) => (
                      <li key={suggestion} className="flex gap-2">
                        <span className="text-[var(--primary)]">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div>
                <h3 className="text-sm font-semibold text-[var(--text)]">
                  录音转写
                </h3>
                <p className="mt-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 text-sm leading-7 text-[var(--text)]">
                  {scoreResult.transcript}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <div>
              <CardTitle>我的历史录音</CardTitle>
              <CardDescription>最近上传的 RS 录音记录</CardDescription>
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
            href={`/pte/speaking/rs/${questionNav.prevQuestionId}`}
            className="inline-flex items-center gap-2 rounded border border-[var(--border)] bg-[var(--card)] px-3 py-3 text-sm font-semibold text-[var(--text-soft)] transition hover:border-[var(--theme)]/30 hover:text-[var(--theme)]"
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
            href={`/pte/speaking/rs/${questionNav.nextQuestionId}`}
            className="inline-flex items-center gap-2 rounded bg-[var(--theme)] px-3 py-3 text-sm font-semibold text-white transition hover:opacity-90"
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
