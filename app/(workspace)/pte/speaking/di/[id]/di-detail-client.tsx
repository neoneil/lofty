"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
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
import { Button } from "@/components/ui-v2/button";
import { Input } from "@/components/ui-v2/input";

type Question = {
  id: string;
  title: string | null;
  question_text: string | null;
  image_url: string | null;
  answer_info: string | null;
  ai_keywords: string[] | null;
  tag1: string | number | null;
  tag2: string | number | null;
  tag3: string | number | null;
  tag4: string | number | null;
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
  isAdmin: boolean;
};

function getImageUrl(path: string) {
  if (path.startsWith("http")) return path;
  if (path.startsWith("/")) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/pte-images/${path}`;
}

function getTags(question: Question) {
  return [formatVisualTypeTag(question.tag1), formatConfidenceTag(question.tag2)]
    .filter(Boolean) as string[];
}

function formatVisualTypeTag(value: string | number | null) {
  const code = Number(value);
  const labels: Record<number, string> = {
    1: "Line Chart",
    2: "Bar Chart",
    3: "Pie Chart",
    4: "Table",
    5: "Flowchart",
    6: "Map",
    7: "Image",
    8: "Mixed",
    9: "Unknown",
  };

  return labels[code] ?? null;
}

const VISUAL_TYPE_LABELS: Record<number, string> = {
  1: "Line Chart",
  2: "Bar Chart",
  3: "Pie Chart",
  4: "Table",
  5: "Flowchart",
  6: "Map",
  7: "Image",
  8: "Mixed",
  9: "Unknown",
};

function formatConfidenceTag(value: string | number | null) {
  const code = Number(value);
  const labels: Record<number, string> = {
    1: "High Confidence",
    2: "Medium Confidence",
    3: "Low Confidence",
  };

  return labels[code] ?? null;
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
  return sessionStorage.getItem("di-question-order") ?? "[]";
}

function getServerQuestionOrderSnapshot() {
  return "[]";
}

export default function DiDetailClient({ question, isAdmin }: Props) {
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
  const [imageOpen, setImageOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [tag1Input, setTag1Input] = useState(String(question.tag1 ?? ""));
  const [tagUpdateLoading, setTagUpdateLoading] = useState(false);
  const [tagUpdateMessage, setTagUpdateMessage] = useState<string | null>(null);

  const tags = getTags(question);
  const imageUrl = question.image_url ? getImageUrl(question.image_url) : null;

  useEffect(() => {
    let cancelled = false;

    const loadRecordings = async () => {
      setRecordingsLoading(true);

      try {
        const res = await fetch(`/api/pte/di/recordings?questionId=${question.id}`);
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
          <Tag tone="theme">DI</Tag>
          {questionNav.questionNumber > 0 ? (
            <Tag tone="green">第 {questionNav.questionNumber} 题</Tag>
          ) : null}
          {question.title ? <Tag tone="yellow">{question.title}</Tag> : null}
        </div>

        {question.question_text ? (
          <div className="text-[18px] leading-9 text-gray-800">
            {question.question_text}
          </div>
        ) : null}

        {tags.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Tag key={tag} tone="neutral">
                {tag}
              </Tag>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mx-auto w-full max-w-[50%] max-lg:max-w-[72%] max-sm:max-w-full">
        <div className={isAdmin ? "grid gap-4 lg:grid-cols-[1fr_280px]" : ""}>
          {imageUrl ? (
            <button
              type="button"
              onClick={() => setImageOpen(true)}
              className="group block w-full overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] p-3 shadow-[var(--shadow-sm)] transition hover:shadow-[var(--shadow-md)]"
            >
              <div className="relative flex h-[360px] items-center justify-center overflow-hidden rounded-[var(--radius-sm)] bg-[var(--bg-soft)] max-lg:h-[320px] max-sm:h-[260px]">
                {!imageLoaded ? (
                  <div className="absolute inset-0 overflow-hidden bg-gray-100">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/75 to-transparent" />
                  </div>
                ) : null}

                <img
                  src={imageUrl}
                  alt={question.title || "DI question image"}
                  onLoad={() => setImageLoaded(true)}
                  className={`h-full w-full rounded-[var(--radius-sm)] object-contain transition duration-500 ${
                    imageLoaded ? "opacity-100" : "opacity-0"
                  }`}
                />
              </div>
              <style jsx>{`
                @keyframes shimmer {
                  100% {
                    transform: translateX(100%);
                  }
                }
              `}</style>
            </button>
          ) : (
            <div className="rounded border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
              当前题目暂无图片
            </div>
          )}

          {isAdmin ? (
            <Card>
              <CardHeader className="block">
                <CardTitle>编辑图形种类</CardTitle>
                <CardDescription>只更新 tag1，不影响其他字段</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-1.5 text-xs text-[var(--text-soft)]">
                  {Object.entries(VISUAL_TYPE_LABELS).map(([code, label]) => (
                    <div key={code} className="flex justify-between gap-3">
                      <span>{code}</span>
                      <span className="font-medium text-[var(--text)]">{label}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Input
                    value={tag1Input}
                    onChange={(event) => setTag1Input(event.target.value)}
                    inputMode="numeric"
                    placeholder="输入 1-9"
                  />
                  <Button
                    type="button"
                    fullWidth
                    disabled={tagUpdateLoading}
                    onClick={async () => {
                      setTagUpdateMessage(null);
                      setTagUpdateLoading(true);

                      try {
                        const res = await fetch("/api/pte/di/tag1", {
                          method: "PATCH",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            questionId: question.id,
                            tag1: Number(tag1Input),
                          }),
                        });
                        const json = await res.json();

                        if (!res.ok || !json.ok) {
                          throw new Error(json.message || "更新失败");
                        }

                        setTagUpdateMessage("更新成功");
                        router.refresh();
                      } catch (error) {
                        setTagUpdateMessage(
                          error instanceof Error ? error.message : "更新失败",
                        );
                      } finally {
                        setTagUpdateLoading(false);
                      }
                    }}
                  >
                    {tagUpdateLoading ? "更新中..." : "更新种类"}
                  </Button>

                  {tagUpdateMessage ? (
                    <p className="text-xs text-[var(--text-soft)]">
                      {tagUpdateMessage}
                    </p>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      {imageOpen && imageUrl ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-6">
          <button
            type="button"
            aria-label="关闭图片"
            onClick={() => setImageOpen(false)}
            className="absolute right-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-700 shadow-lg transition hover:bg-gray-100"
          >
            <X size={22} />
          </button>

          <button
            type="button"
            aria-label="关闭图片弹窗"
            onClick={() => setImageOpen(false)}
            className="absolute inset-0 -z-10 cursor-default"
          />

          <img
            src={imageUrl}
            alt={question.title || "DI question image"}
            className="max-h-[88vh] max-w-[92vw] rounded-[var(--radius-sm)] bg-white object-contain shadow-2xl"
          />
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-[50%] space-y-6 max-lg:max-w-[72%] max-sm:max-w-full">
        <RecordingPanel
          questionId={question.id}
          type="DI"
          preparationDuration={40}
          maxDuration={40}
          autoStart
          uploadUrl="/api/pte/di/upload"
          onUploadSuccess={(newRecording) => {
            setRecordings((prev) => [newRecording, ...prev]);
            router.refresh();
          }}
        />

        <Card>
          <CardHeader>
            <div>
              <CardTitle>我的历史录音</CardTitle>
              <CardDescription>最近上传的 DI 录音记录</CardDescription>
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
            href={`/pte/speaking/di/${questionNav.prevQuestionId}`}
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
            href={`/pte/speaking/di/${questionNav.nextQuestionId}`}
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
