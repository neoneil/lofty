import { BookOpenCheck, CalendarDays, CheckCircle2, NotebookPen } from "lucide-react";

import {
  WritingFeedbackHistoryClient,
  type WritingFeedbackHistoryItem,
  type WritingFeedbackResult,
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
  essay_text: string | null;
  overall_band: number | null;
  word_count: number | null;
  feedback_json: unknown;
  created_at: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getObject(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return isRecord(value) ? value : {};
}

function getString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

function getStringArray(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function parseFeedbackJson(value: unknown) {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return {};
  }
}

function normalizeWritingFeedback(value: unknown): WritingFeedbackResult {
  const parsed = parseFeedbackJson(value);
  const root = isRecord(parsed) ? parsed : {};
  const overall = getObject(root, "overall_feedback");
  const pte = getObject(overall, "pte_feedback");
  const ielts = getObject(overall, "ielts_feedback");

  return {
    full_report_cn: getString(root, "full_report_cn"),
    overall_feedback: {
      summary: getString(overall, "summary"),
      estimated_score: getString(overall, "estimated_score"),
      strengths: getStringArray(overall, "strengths"),
      main_problems: getStringArray(overall, "main_problems"),
      improvement_priority: getStringArray(overall, "improvement_priority"),
      pte_feedback: {
        content: getString(pte, "content"),
        form: getString(pte, "form"),
        grammar: getString(pte, "grammar"),
        vocabulary: getString(pte, "vocabulary"),
        spelling: getString(pte, "spelling"),
        development_structure_coherence: getString(pte, "development_structure_coherence"),
      },
      ielts_feedback: {
        task_response: getString(ielts, "task_response"),
        coherence_cohesion: getString(ielts, "coherence_cohesion"),
        lexical_resource: getString(ielts, "lexical_resource"),
        grammar_range_accuracy: getString(ielts, "grammar_range_accuracy"),
      },
    },
    paragraphs: Array.isArray(root.paragraphs)
      ? root.paragraphs.map((item, index) => {
          const paragraph = isRecord(item) ? item : {};
          const feedback = getObject(paragraph, "feedback");

          return {
            paragraph_id: getString(paragraph, "paragraph_id") || `p${index + 1}`,
            paragraph_text: getString(paragraph, "paragraph_text"),
            feedback: {
              main_function: getString(feedback, "main_function"),
              strengths: getStringArray(feedback, "strengths"),
              problems: getStringArray(feedback, "problems"),
              coherence_feedback: getString(feedback, "coherence_feedback"),
              suggestion: getString(feedback, "suggestion"),
            },
          };
        })
      : [],
    sentences: Array.isArray(root.sentences)
      ? root.sentences.map((item, index) => {
          const sentence = isRecord(item) ? item : {};
          const feedback = getObject(sentence, "feedback");

          return {
            sentence_id: getString(sentence, "sentence_id") || `s${index + 1}`,
            paragraph_id: getString(sentence, "paragraph_id"),
            sentence_text: getString(sentence, "sentence_text"),
            feedback: {
              sentence_function: getString(feedback, "sentence_function"),
              grammar_errors: getStringArray(feedback, "grammar_errors"),
              vocabulary_errors: getStringArray(feedback, "vocabulary_errors"),
              spelling_errors: getStringArray(feedback, "spelling_errors"),
              punctuation_errors: getStringArray(feedback, "punctuation_errors"),
              cohesion_errors: getStringArray(feedback, "cohesion_errors"),
              logic_errors: getStringArray(feedback, "logic_errors"),
              improved_sentence: getString(feedback, "improved_sentence"),
              explanation_cn: getString(feedback, "explanation_cn"),
            },
          };
        })
      : [],
  };
}

async function listStudentWritingFeedback(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
): Promise<WritingFeedbackHistoryItem[]> {
  const { data, error } = await supabase
    .schema("ielts")
    .from("writing_attempts")
    .select("id, prompt_question, essay_text, overall_band, word_count, feedback_json, created_at")
    .eq("user_id", userId)
    .eq("task_type", "task2")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("STUDENT WRITING FEEDBACK LOAD ERROR", error);
    return [];
  }

  return ((data ?? []) as IeltsWritingAttemptRow[]).map((item) => ({
    id: item.id,
    promptQuestion: item.prompt_question ?? "IELTS Writing Task 2",
    essayText: item.essay_text ?? "",
    overallBand: item.overall_band,
    wordCount: item.word_count,
    feedback: normalizeWritingFeedback(item.feedback_json),
    createdAt: item.created_at,
  }));
}

export default async function HomeworkPage() {
  const { user } = await requireUser("/homework");
  let assignments: HomeworkAssignment[] = [];
  let writingFeedback: WritingFeedbackHistoryItem[] = [];
  let tableReady = true;
  const supabase = createAdminClient();

  try {
    assignments = await listStudentHomework(supabase, user.id);
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
