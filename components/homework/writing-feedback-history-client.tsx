"use client";

import { useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  FileText,
  MessageSquareText,
} from "lucide-react";

import { WritingFeedbackReport } from "@/components/writing-feedback/writing-feedback-report";
import { Badge } from "@/components/ui-v2/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-v2/card";
import {
  normalizeWritingFeedbackResult,
  type WritingFeedbackResult,
} from "@/lib/ielts/writing-feedback";

export type WritingFeedbackHistoryItem = {
  id: string;
  promptQuestion: string;
  overallBand: number | null;
  wordCount: number | null;
  createdAt: string | null;
  publishedAt: string | null;
  essayText?: string;
  feedback?: WritingFeedbackResult;
};

type WritingFeedbackDetailResponse = {
  ok?: boolean;
  error?: string;
  item?: {
    id: string;
    promptQuestion: string;
    essayText: string;
    overallBand: number | null;
    wordCount: number | null;
    feedback: unknown;
    createdAt: string | null;
    publishedAt: string | null;
  };
};

function formatDateTime(value: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function WritingFeedbackHistoryClient({
  items: initialItems,
}: {
  items: WritingFeedbackHistoryItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [activeId, setActiveId] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const activeItem = items.find((item) => item.id === activeId) ?? null;

  if (items.length === 0) return null;

  const openReport = async (item: WritingFeedbackHistoryItem) => {
    setActiveId(item.id);
    setError(null);

    if (item.feedback && item.essayText !== undefined) return;

    setLoadingId(item.id);
    try {
      const response = await fetch(
        `/api/homework/writing-feedback?attempt_id=${encodeURIComponent(item.id)}`,
      );
      const data = (await response.json().catch(() => ({}))) as WritingFeedbackDetailResponse;

      if (!response.ok || !data.ok || !data.item) {
        throw new Error(data.error ?? "作文反馈加载失败。");
      }

      const detail: WritingFeedbackHistoryItem = {
        ...data.item,
        feedback: normalizeWritingFeedbackResult(data.item.feedback),
      };
      setItems((current) =>
        current.map((historyItem) =>
          historyItem.id === detail.id ? detail : historyItem,
        ),
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "作文反馈加载失败。",
      );
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <section className="space-y-4">
      <Card className="border-[var(--border-strong)]">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge variant="outline">
                <MessageSquareText size={13} className="mr-1.5" />
                AI 写作批改报告
              </Badge>
              <h2 className="mt-3 text-xl font-bold text-[var(--text)]">
                IELTS Writing 反馈中心
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--text-soft)]">
                老师发送的作文批改会保留在这里。选择历史记录后，可以查看完整报告并点击原文中的句子检查具体问题。
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:min-w-[260px]">
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 text-center">
                <div className="text-xl font-semibold text-[var(--text)]">
                  {items.length}
                </div>
                <div className="mt-1 text-xs text-[var(--text-faint)]">
                  已发送报告
                </div>
              </div>
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 text-center">
                <div className="text-xl font-semibold text-[var(--text)]">
                  {activeItem?.feedback?.overall_feedback.estimated_score ?? "-"}
                </div>
                <div className="mt-1 text-xs text-[var(--text-faint)]">
                  当前评分
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
        <Card className="xl:sticky xl:top-5 xl:self-start">
          <CardHeader className="px-4 pt-4">
            <CardTitle>历史报告</CardTitle>
            <CardDescription>选择一篇作文查看老师发送的完整批改。</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[680px] space-y-2 overflow-y-auto p-4">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => void openReport(item)}
                className={`w-full rounded-[var(--radius-md)] border p-3 text-left transition ${
                  activeId === item.id
                    ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                    : "border-[var(--border)] bg-[var(--bg-soft)] hover:border-[var(--primary)]/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-soft)]">
                    <CalendarDays size={13} />
                    {formatDateTime(item.publishedAt)}
                  </span>
                  <span className="shrink-0 text-xs font-bold text-[var(--primary)]">
                    {loadingId === item.id
                      ? "加载中"
                      : item.overallBand
                        ? `Band ${item.overallBand}`
                        : item.feedback?.overall_feedback.estimated_score || "-"}
                  </span>
                </div>
                <div className="mt-2 line-clamp-2 text-sm font-bold leading-5 text-[var(--text)]">
                  {item.promptQuestion}
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 text-xs text-[var(--text-faint)]">
                  <span className="flex items-center gap-1.5">
                    <FileText size={13} />
                    {item.wordCount ?? "-"} words
                  </span>
                  <span className="flex items-center gap-1 text-[var(--success)]">
                    <CheckCircle2 size={13} />已发送
                  </span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="min-w-0">
          {error ? (
            <div className="rounded-[var(--radius-md)] border border-[color:var(--danger)]/30 bg-[var(--danger-soft)] p-4 text-sm font-semibold text-[var(--danger)]">
              {error}
            </div>
          ) : activeItem?.feedback && activeItem.essayText !== undefined ? (
            <WritingFeedbackReport
              key={activeItem.id}
              result={activeItem.feedback}
              question={activeItem.promptQuestion}
              essayText={activeItem.essayText}
            />
          ) : activeId && loadingId === activeId ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-[var(--text-soft)]">
                正在加载完整作文与批改反馈...
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquareText
                  size={26}
                  className="mx-auto text-[var(--primary)]"
                />
                <h3 className="mt-4 font-bold text-[var(--text)]">
                  选择一份批改报告
                </h3>
                <p className="mt-2 text-sm text-[var(--text-soft)]">
                  完整作文和 AI 反馈会在选中后加载。
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}
