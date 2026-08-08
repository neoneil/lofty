import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getAppOrigin } from "@/lib/auth/app-origin";
import { sendMockScoreEmail } from "@/lib/mock-test/email";
import type { MockAttemptStatus, MockExamType } from "@/lib/mock-test/types";
import { createPrivateR2PlaybackUrl } from "@/lib/storage/r2-private";

export type AdminMockAttemptListItem = {
  id: string;
  userId: string;
  studentName: string;
  studentEmail: string | null;
  examType: MockExamType;
  title: string;
  status: MockAttemptStatus;
  questionCount: number;
  answeredCount: number;
  correctCount: number;
  overallBand: number | null;
  pteOverallScore: number | null;
  submittedAt: string | null;
  scoreEmailSentAt: string | null;
  studentReportPublishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminMockAttemptAnswer = {
  id: string;
  sectionKey: string;
  questionKey: string;
  questionType: string;
  questionNumberStart: number | null;
  questionNumberEnd: number | null;
  title: string | null;
  prompt: string | null;
  instructions: string | null;
  questionSnapshot: Record<string, unknown>;
  response: Record<string, unknown>;
  responseText: string | null;
  responseFiles: Array<Record<string, unknown>>;
  durationSeconds: number;
  score: {
    isCorrect: boolean | null;
    score: number | null;
    maxScore: number | null;
    answerKeySnapshot: Record<string, unknown>;
    scoreDetail: Record<string, unknown>;
    feedback: Record<string, unknown>;
    needsManualReview: boolean;
    scoredBy: string | null;
    scoredAt: string | null;
  } | null;
};

export type AdminMockAttemptDetail = AdminMockAttemptListItem & {
  adminReportNote: string | null;
  sectionScores: Record<string, unknown>;
  scoreSummary: Record<string, unknown>;
  metadata: Record<string, unknown>;
  answers: AdminMockAttemptAnswer[];
};

type AttemptRow = {
  id: string;
  user_id: string;
  exam_type: MockExamType;
  title: string;
  status: MockAttemptStatus;
  question_count: number;
  answered_count: number;
  correct_count: number;
  overall_band: number | null;
  pte_overall_score: number | null;
  submitted_at: string | null;
  score_email_sent_at: string | null;
  student_report_published_at: string | null;
  admin_report_note?: string | null;
  section_scores?: Record<string, unknown>;
  score_summary?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type AnswerRow = {
  id: string;
  section_key: string;
  question_key: string;
  question_type: string;
  question_number_start: number | null;
  question_number_end: number | null;
  title: string | null;
  prompt: string | null;
  instructions: string | null;
  question_snapshot: Record<string, unknown>;
  response: Record<string, unknown>;
  response_text: string | null;
  response_files: Array<Record<string, unknown>>;
  duration_seconds: number;
};

type ScoreRow = {
  attempt_answer_id: string;
  answer_key_snapshot: Record<string, unknown>;
  is_correct: boolean | null;
  score: number | null;
  max_score: number | null;
  score_detail: Record<string, unknown>;
  feedback: Record<string, unknown>;
  needs_manual_review: boolean;
  scored_by: string | null;
  scored_at: string | null;
};

function schema(client: SupabaseClient) {
  return client.schema("mock_exam");
}

export async function listAdminMockAttempts(client: SupabaseClient): Promise<AdminMockAttemptListItem[]> {
  const { data, error } = await schema(client)
    .from("attempts")
    .select("id, user_id, exam_type, title, status, question_count, answered_count, correct_count, overall_band, pte_overall_score, submitted_at, score_email_sent_at, student_report_published_at, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw error;
  const attempts = (data ?? []) as AttemptRow[];
  const profiles = await loadProfiles(client, [...new Set(attempts.map((attempt) => attempt.user_id))]);
  return attempts.map((attempt) => mapListItem(attempt, profiles.get(attempt.user_id)));
}

export async function getAdminMockAttemptDetail(client: SupabaseClient, attemptId: string): Promise<AdminMockAttemptDetail> {
  const { data: attempt, error } = await schema(client)
    .from("attempts")
    .select("id, user_id, exam_type, title, status, question_count, answered_count, correct_count, overall_band, pte_overall_score, submitted_at, score_email_sent_at, student_report_published_at, admin_report_note, section_scores, score_summary, metadata, created_at, updated_at")
    .eq("id", attemptId)
    .single();

  if (error) throw error;
  const attemptRow = attempt as AttemptRow;
  const profiles = await loadProfiles(client, [attemptRow.user_id]);
  const [answers, scores] = await Promise.all([
    loadAttemptAnswers(client, attemptId),
    loadAttemptScores(client, attemptId),
  ]);
  const scoreByAnswerId = new Map(scores.map((score) => [score.attempt_answer_id, score]));

  return {
    ...mapListItem(attemptRow, profiles.get(attemptRow.user_id)),
    adminReportNote: attemptRow.admin_report_note ?? null,
    sectionScores: attemptRow.section_scores ?? {},
    scoreSummary: attemptRow.score_summary ?? {},
    metadata: attemptRow.metadata ?? {},
    answers: answers.map((answer) => ({
      id: answer.id,
      sectionKey: answer.section_key,
      questionKey: answer.question_key,
      questionType: answer.question_type,
      questionNumberStart: answer.question_number_start,
      questionNumberEnd: answer.question_number_end,
      title: answer.title,
      prompt: answer.prompt,
      instructions: answer.instructions,
      questionSnapshot: answer.question_snapshot ?? {},
      response: answer.response ?? {},
      responseText: answer.response_text,
      responseFiles: withPlaybackUrls(answer.response_files ?? []),
      durationSeconds: answer.duration_seconds,
      score: mapScore(scoreByAnswerId.get(answer.id)),
    })),
  };
}

export async function publishAdminMockAttemptReport({
  client,
  request,
  attemptId,
  adminUserId,
  note,
}: {
  client: SupabaseClient;
  request: Request;
  attemptId: string;
  adminUserId: string;
  note: string;
}) {
  const detail = await getAdminMockAttemptDetail(client, attemptId);
  if (!detail.studentEmail) {
    const error = "Student email is missing";
    await schema(client).from("attempts").update({ score_email_error: error, admin_report_note: note.trim() || null }).eq("id", attemptId);
    return { ok: false as const, error };
  }

  const origin = getAppOrigin(request);
  const reportUrl = `${origin}/mock-test/report/${attemptId}`;
  const email = await sendMockScoreEmail({
    to: detail.studentEmail,
    studentName: detail.studentName,
    examType: detail.examType,
    title: detail.title,
    status: detail.status,
    overallBand: detail.overallBand,
    pteOverallScore: detail.pteOverallScore,
    answeredCount: detail.answeredCount,
    correctCount: detail.correctCount,
    sectionScores: detail.sectionScores,
    reportUrl,
  });

  if (!email.ok) {
    await schema(client).from("attempts").update({ score_email_error: email.error, admin_report_note: note.trim() || null }).eq("id", attemptId);
    return { ok: false as const, error: email.error };
  }

  const now = new Date().toISOString();
  const { error } = await schema(client)
    .from("attempts")
    .update({
      score_email_sent_at: now,
      score_email_error: null,
      student_report_published_at: now,
      student_report_published_by: adminUserId,
      admin_report_note: note.trim() || null,
    })
    .eq("id", attemptId);

  if (error) throw error;

  await client.from("student_notifications").insert({
    user_id: detail.userId,
    type: "mock_test_report",
    title: "模考成绩已发布",
    message: `${detail.title} 的成绩报告已发布。`,
    href: `/mock-test/report/${attemptId}`,
    metadata: { examType: detail.examType, attemptId },
  });

  return { ok: true as const };
}

export async function getPublishedMockAttemptReport(client: SupabaseClient, userId: string, attemptId: string) {
  const detail = await getAdminMockAttemptDetail(client, attemptId);
  if (detail.userId !== userId || !detail.studentReportPublishedAt) return null;
  return detail;
}

async function loadProfiles(client: SupabaseClient, userIds: string[]) {
  if (userIds.length === 0) return new Map<string, ProfileRow>();
  const { data, error } = await client
    .from("profiles")
    .select("id, full_name, email")
    .in("id", userIds);

  if (error) throw error;
  return new Map(((data ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]));
}

async function loadAttemptAnswers(client: SupabaseClient, attemptId: string) {
  const { data, error } = await schema(client)
    .from("attempt_answers")
    .select("id, section_key, question_key, question_type, question_number_start, question_number_end, title, prompt, instructions, question_snapshot, response, response_text, response_files, duration_seconds")
    .eq("attempt_id", attemptId)
    .order("section_key", { ascending: true })
    .order("question_number_start", { ascending: true });

  if (error) throw error;
  return (data ?? []) as AnswerRow[];
}

async function loadAttemptScores(client: SupabaseClient, attemptId: string) {
  const { data, error } = await schema(client)
    .from("attempt_answer_scores")
    .select("attempt_answer_id, answer_key_snapshot, is_correct, score, max_score, score_detail, feedback, needs_manual_review, scored_by, scored_at")
    .eq("attempt_id", attemptId);

  if (error) throw error;
  return (data ?? []) as ScoreRow[];
}

function mapListItem(attempt: AttemptRow, profile?: ProfileRow): AdminMockAttemptListItem {
  return {
    id: attempt.id,
    userId: attempt.user_id,
    studentName: profile?.full_name?.trim() || profile?.email || attempt.user_id,
    studentEmail: profile?.email ?? null,
    examType: attempt.exam_type,
    title: attempt.title,
    status: attempt.status,
    questionCount: attempt.question_count,
    answeredCount: attempt.answered_count,
    correctCount: attempt.correct_count,
    overallBand: attempt.overall_band,
    pteOverallScore: attempt.pte_overall_score,
    submittedAt: attempt.submitted_at,
    scoreEmailSentAt: attempt.score_email_sent_at,
    studentReportPublishedAt: attempt.student_report_published_at,
    createdAt: attempt.created_at,
    updatedAt: attempt.updated_at,
  };
}

function mapScore(score?: ScoreRow): AdminMockAttemptAnswer["score"] {
  if (!score) return null;
  return {
    isCorrect: score.is_correct,
    score: score.score,
    maxScore: score.max_score,
    answerKeySnapshot: score.answer_key_snapshot ?? {},
    scoreDetail: score.score_detail ?? {},
    feedback: score.feedback ?? {},
    needsManualReview: score.needs_manual_review,
    scoredBy: score.scored_by,
    scoredAt: score.scored_at,
  };
}

function withPlaybackUrls(files: Array<Record<string, unknown>>) {
  return files.map((file) => {
    const key = typeof file.key === "string" ? file.key : "";
    if (!key || file.playbackUrl) return file;
    try {
      return { ...file, playbackUrl: createPrivateR2PlaybackUrl(key), playbackUrlExpiresInSeconds: 900 };
    } catch {
      return file;
    }
  });
}
