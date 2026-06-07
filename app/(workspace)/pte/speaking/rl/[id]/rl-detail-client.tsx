"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import AudioPlayer from "@/components/site/AudioPlayer";
import RecordingPanel from "@/components/site/RecordingPanel";
import Tag from "@/components/ui/tag";
import { Button } from "@/components/ui-v2/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-v2/card";

type Question = {
  id: string;
  title: string | null;
  question_title: string | null;
  question_text: string | null;
  audio_url: string | null;
  source_audio_url: string | null;
  storage_path: string | null;
  original_text: string | null;
  answer_info: string | null;
  keywords: string | null;
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

function getAudioUrl(question: Question) {
  const path =
    question.audio_url || question.storage_path || question.source_audio_url;

  if (!path) return null;
  if (path.startsWith("http")) return path;

  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/pte-audio/${path}`;
}

function getDisplayTitle(question: Question) {
  return (
    question.title ||
    question.question_title ||
    question.question_text ||
    "RL Question"
  );
}

function subscribeQuestionOrder(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getQuestionOrderSnapshot() {
  return sessionStorage.getItem("rl-question-order") ?? "[]";
}

function getServerQuestionOrderSnapshot() {
  return "[]";
}

export default function RlDetailClient({ question }: Props) {
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
  const [audioFinished, setAudioFinished] = useState(!getAudioUrl(question));
  const [isOriginalTextOpen, setIsOriginalTextOpen] = useState(false);

  const audioUrl = getAudioUrl(question);
  const originalText = question.original_text?.trim();

  useEffect(() => {
    let cancelled = false;

    const loadRecordings = async () => {
      setRecordingsLoading(true);

      try {
        const res = await fetch(`/api/pte/rl/recordings?questionId=${question.id}`);
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
          <Tag tone="theme">RL</Tag>
          {questionNav.questionNumber > 0 ? (
            <Tag tone="green">第 {questionNav.questionNumber} 题</Tag>
          ) : null}
          <Tag tone="yellow">{getDisplayTitle(question)}</Tag>
        </div>

        {question.question_text ? (
          <div className="text-[18px] leading-9 text-gray-800">
            {question.question_text}
          </div>
        ) : null}
      </div>

      {audioUrl ? (
        <div className="mx-auto w-full max-w-[50%] max-lg:max-w-[72%] max-sm:max-w-full">
          <AudioPlayer
            url={audioUrl}
            autoPlay
            countdown={10}
            size="compact"
            onEnded={() => setAudioFinished(true)}
          />
        </div>
      ) : (
        <div className="mx-auto w-full max-w-[50%] rounded border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500 max-lg:max-w-[72%] max-sm:max-w-full">
          当前题目暂无音频
        </div>
      )}

      <div className="mx-auto w-full max-w-[50%] space-y-6 max-lg:max-w-[72%] max-sm:max-w-full">
        {audioFinished ? (
          <RecordingPanel
            questionId={question.id}
            type="RL"
            preparationDuration={10}
            maxDuration={40}
            autoStart
            uploadUrl="/api/pte/rl/upload"
            onUploadSuccess={(newRecording) => {
              setRecordings((prev) => [newRecording, ...prev]);
              router.refresh();
            }}
          />
        ) : null}

        {originalText ? (
          <Card>
            <CardHeader className="items-center py-4">
              <div>
                <CardTitle>音频原文</CardTitle>
                <CardDescription>默认隐藏，展开后查看原文内容</CardDescription>
              </div>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="gap-1.5"
                onClick={() => setIsOriginalTextOpen((value) => !value)}
                aria-expanded={isOriginalTextOpen}
              >
                <span>{isOriginalTextOpen ? "收起" : "展开"}</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform ${
                    isOriginalTextOpen ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </CardHeader>

            {isOriginalTextOpen ? (
              <CardContent>
                <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 text-sm leading-7 text-[var(--text)] whitespace-pre-wrap">
                  {originalText}
                </div>
              </CardContent>
            ) : null}
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <div>
              <CardTitle>我的历史录音</CardTitle>
              <CardDescription>最近上传的 RL 录音记录</CardDescription>
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
            href={`/pte/speaking/rl/${questionNav.prevQuestionId}`}
            className="inline-flex items-center gap-2 rounded border border-gray-200 bg-white px-3 py-3 text-sm font-semibold text-gray-700 transition hover:border-[var(--theme)]/30 hover:text-[var(--theme)]"
          >
            <span>上一题</span>
          </Link>
        ) : (
          <div />
        )}

        {questionNav.nextQuestionId ? (
          <Link
            href={`/pte/speaking/rl/${questionNav.nextQuestionId}`}
            className="inline-flex items-center gap-2 rounded bg-[var(--theme)] px-3 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <span>下一题</span>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
