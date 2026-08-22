import { BookOpenCheck, CalendarDays, CheckCircle2, NotebookPen } from "lucide-react";

import {
  WritingFeedbackHistoryClient,
  type WritingFeedbackHistoryItem,
} from "@/components/homework/writing-feedback-history-client";
import { Badge } from "@/components/ui-v2/badge";
import { Card, CardContent } from "@/components/ui-v2/card";
import { listStudentHomework } from "@/lib/homework/server";
import type { HomeworkAssignment } from "@/lib/homework/types";
import { requireUser } from "@/lib/auth/require-user";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getExamBadgeVariant(examType: HomeworkAssignment["examType"]) {
  if (examType === "IELTS") return "success";
  if (examType === "PTE") return "default";
  return "secondary";
}

type IeltsWritingAttemptRow = {
  id: string;
  prompt_question: string | null;
  overall_band: number | null;
  word_count: number | null;
  created_at: string | null;
};

type WritingPublicationRow = {
  created_at: string;
  metadata: unknown;
};

function getWritingAttemptId(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") return "";
  const value = (metadata as Record<string, unknown>).writing_attempt_id;
  return typeof value === "string" ? value : "";
}

async function listStudentWritingFeedback(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
): Promise<WritingFeedbackHistoryItem[]> {
  const { data: publications, error: publicationError } = await supabase
    .from("student_homework_assignments")
    .select("created_at, metadata")
    .eq("student_id", userId)
    .contains("metadata", { source: "admin_analyze_answer" })
    .order("created_at", { ascending: false })
    .limit(50);

  if (publicationError) {
    console.error("STUDENT WRITING PUBLICATION LOAD ERROR", publicationError);
    return [];
  }

  const publishedAtByAttempt = new Map<string, string>();
  for (const row of (publications ?? []) as WritingPublicationRow[]) {
    const attemptId = getWritingAttemptId(row.metadata);
    if (attemptId && !publishedAtByAttempt.has(attemptId)) {
      publishedAtByAttempt.set(attemptId, row.created_at);
    }
  }

  const attemptIds = [...publishedAtByAttempt.keys()];
  if (attemptIds.length === 0) return [];

  const { data, error } = await supabase
    .schema("ielts")
    .from("writing_attempts")
    .select("id, prompt_question, overall_band, word_count, created_at")
    .eq("user_id", userId)
    .eq("task_type", "task2")
    .in("id", attemptIds);

  if (error) {
    console.error("STUDENT WRITING FEEDBACK LOAD ERROR", error);
    return [];
  }

  return ((data ?? []) as IeltsWritingAttemptRow[])
    .map((item) => ({
      id: item.id,
      promptQuestion: item.prompt_question ?? "IELTS Writing Task 2",
      overallBand: item.overall_band,
      wordCount: item.word_count,
      createdAt: item.created_at,
      publishedAt: publishedAtByAttempt.get(item.id) ?? item.created_at,
    }))
    .sort((left, right) =>
      String(right.publishedAt ?? "").localeCompare(String(left.publishedAt ?? "")),
    );
}

export default async function HomeworkPage() {
  const { user } = await requireUser("/homework");
  let assignments: HomeworkAssignment[] = [];
  let writingFeedback: WritingFeedbackHistoryItem[] = [];
  let tableReady = true;
  const supabase = createAdminClient();

  try {
    assignments = (await listStudentHomework(supabase, user.id)).filter(
      (assignment) => assignment.metadata.source !== "admin_analyze_answer",
    );
  } catch (error) {
    tableReady = false;
    console.error("STUDENT HOMEWORK PAGE LOAD ERROR", error);
  }

  writingFeedback = await listStudentWritingFeedback(supabase, user.id);

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 p-4 text-[var(--text)] sm:p-5 lg:p-6">
      <Card className="overflow-hidden border-[var(--border-strong)]">
        <CardContent className="relative p-5 sm:p-7">
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge variant="outline"><NotebookPen size={13} className="mr-1.5" />我的作业</Badge>
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">老师布置的学习任务</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-soft)]">这里会保留你收到过的 IELTS / PTE 作业，以及老师保存的 AI 写作批改反馈。</p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 text-center"><div className="text-xl font-semibold text-[var(--text)]">{assignments.length}</div><div className="mt-1 text-xs text-[var(--text-faint)]">历史作业</div></div>
              <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 text-center"><div className="text-xl font-semibold text-[var(--text)]">{assignments.filter((item) => item.examType === "IELTS").length}</div><div className="mt-1 text-xs text-[var(--text-faint)]">IELTS</div></div>
              <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 text-center"><div className="text-xl font-semibold text-[var(--text)]">{writingFeedback.length}</div><div className="mt-1 text-xs text-[var(--text-faint)]">AI 批改</div></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {!tableReady ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--warning)]/30 bg-[var(--warning-soft)] p-5 text-sm font-semibold text-[var(--warning)]">作业表还没有创建，请联系老师完成系统配置。</div>
      ) : assignments.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center shadow-[var(--shadow-sm)]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]"><BookOpenCheck size={22} /></div>
          <h2 className="mt-4 text-lg font-bold text-[var(--text)]">暂无作业</h2>
          <p className="mt-2 text-sm text-[var(--text-soft)]">老师发送作业后，这里会自动显示历史记录。</p>
        </div>
      ) : (
        <section className="space-y-3">
          {assignments.map((assignment, index) => (
            <article key={assignment.id} className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)] transition hover:border-[var(--primary)]/30 hover:bg-[var(--card-hover)] sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-sm font-black text-[var(--primary)]">#{assignments.length - index}</span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-[var(--text)]">作业任务</h2><Badge variant={getExamBadgeVariant(assignment.examType)}>{assignment.examType}</Badge>{assignment.emailSentAt ? <Badge variant="success"><CheckCircle2 size={11} className="mr-1" />邮件已发送</Badge> : null}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--text-faint)]"><CalendarDays size={13} /><span>{formatDate(assignment.createdAt)}</span></div>
                  </div>
                </div>
                <Badge variant="secondary">{assignment.status}</Badge>
              </div>
              <div className="mt-4 whitespace-pre-wrap rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 text-sm leading-7 text-[var(--text)]">{assignment.content}</div>
            </article>
          ))}
        </section>
      )}

      <WritingFeedbackHistoryClient items={writingFeedback} />
    </main>
  );
}
