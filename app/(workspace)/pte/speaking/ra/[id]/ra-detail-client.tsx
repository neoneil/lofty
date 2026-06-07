"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
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
  tags: string[] | null;
};

type UserRecording = {
  id: string;
  question_source: string;
  question_id: string;
  audio_url: string;
  duration_seconds: number | null;
  created_at: string | null;
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

function subscribeQuestionOrder(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getQuestionOrderSnapshot() {
  return sessionStorage.getItem("ra-question-order") ?? "[]";
}

function getServerQuestionOrderSnapshot() {
  return "[]";
}

export default function RaDetailClient({ question }: Props) {
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

  useEffect(() => {
    let cancelled = false;

    const loadRecordings = async () => {
      setRecordingsLoading(true);

      try {
        const res = await fetch(`/api/pte/ra/recordings?questionId=${question.id}`);
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
      <div className="round bg-gray-50 px-5 py-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Tag tone="theme">RA</Tag>
          {questionNav.questionNumber > 0 ? (
            <Tag tone="green">第 {questionNav.questionNumber} 题</Tag>
          ) : null}
          <Tag tone="yellow">{getWordCount(question.question_text)} Words</Tag>
        </div>

        <div className="text-[18px] leading-9 text-gray-800">
          <DictionaryText text={question.question_text} />
        </div>

        {question.tags?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {question.tags.map((tag) => (
              <Tag key={tag} tone="neutral">
                {tag}
              </Tag>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mx-auto w-full max-w-[50%] space-y-6 max-lg:max-w-[72%] max-sm:max-w-full">
        <RecordingPanel
          questionId={question.id}
          type="RA"
          preparationDuration={40}
          maxDuration={40}
          autoStart
          uploadUrl="/api/pte/ra/upload"
          onUploadSuccess={(newRecording) => {
            setRecordings((prev) => [newRecording, ...prev]);
            router.refresh();
          }}
        />

        <Card>
          <CardHeader>
            <div>
              <CardTitle>我的历史录音</CardTitle>
              <CardDescription>最近上传的 RA 录音记录</CardDescription>
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
            href={`/pte/speaking/ra/${questionNav.prevQuestionId}`}
            className="inline-flex items-center gap-2 rounded border border-gray-200 bg-white px-3 py-3 text-sm font-semibold text-gray-700 transition hover:border-[var(--theme)]/30 hover:text-[var(--theme)]"
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
            href={`/pte/speaking/ra/${questionNav.nextQuestionId}`}
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
