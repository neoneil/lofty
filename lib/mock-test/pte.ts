import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { PteMockExamData, PteMockQuestion } from "@/lib/mock-assessment/pte-mock-types";
import { assertCanStartMockAttempt } from "@/lib/mock-test/access";
import type { MockAttemptSummary, MockAttemptStatus } from "@/lib/mock-test/types";

type AttemptRow = {
  id: string;
  exam_type: "pte";
  title: string;
  status: MockAttemptStatus;
  current_section_key: string | null;
  current_question_key: string | null;
  question_count: number;
  answered_count: number;
  correct_count: number;
  overall_band: number | null;
  pte_overall_score: number | null;
  submitted_at: string | null;
  score_email_sent_at: string | null;
  student_report_published_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type PteAnswerRow = {
  id: string;
  section_key: string;
  question_key: string;
  question_type: string;
  question_snapshot: PteMockQuestion;
  response: Record<string, unknown>;
  response_text: string | null;
};

export type PteSectionResponsePayload = {
  questionKey: string;
  question: PteMockQuestion;
  response: Record<string, unknown>;
  responseText?: string;
  responseFiles?: Array<Record<string, unknown>>;
};

function schema(client: SupabaseClient) {
  return client.schema("mock_exam");
}

function mapAttempt(row: AttemptRow): MockAttemptSummary {
  return {
    id: row.id,
    examType: row.exam_type,
    title: row.title,
    status: row.status,
    currentSectionKey: row.current_section_key,
    currentQuestionKey: row.current_question_key,
    questionCount: row.question_count,
    answeredCount: row.answered_count,
    correctCount: row.correct_count,
    overallBand: row.overall_band,
    pteOverallScore: row.pte_overall_score,
    submittedAt: row.submitted_at,
    scoreEmailSentAt: row.score_email_sent_at,
    studentReportPublishedAt: row.student_report_published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    metadata: row.metadata ?? {},
  };
}

export async function getOrCreatePteMockAttempt(client: SupabaseClient, userId: string, exam: PteMockExamData) {
  const existing = await schema(client)
    .from("attempts")
    .select("id, exam_type, title, status, current_section_key, current_question_key, question_count, answered_count, correct_count, overall_band, pte_overall_score, submitted_at, score_email_sent_at, student_report_published_at, metadata, created_at, updated_at")
    .eq("user_id", userId)
    .eq("exam_type", "pte")
    .eq("status", "in_progress")
    .order("created_at", { ascending: false })
    .limit(1);

  if (existing.error) throw existing.error;
  const first = ((existing.data ?? []) as AttemptRow[])[0];
  if (first) return mapAttempt(first);

  await assertCanStartMockAttempt(userId);

  const totalQuestions = exam.speaking.length + exam.writing.length + exam.reading.length + exam.listening.length;
  const inserted = await schema(client)
    .from("attempts")
    .insert({
      user_id: userId,
      exam_type: "pte",
      title: "PTE Academic Mock Test - Current 36 Questions",
      status: "in_progress",
      delivery_mode: "computer",
      current_section_key: "speaking",
      current_question_key: exam.speaking[0] ? `speaking:${exam.speaking[0].type}:${exam.speaking[0].id}` : null,
      question_count: totalQuestions,
      metadata: {
        blueprintCode: "pte-current-36",
        paper: exam,
        sectionCompletion: {},
        source: "pte_current_mock",
      },
    })
    .select("id, exam_type, title, status, current_section_key, current_question_key, question_count, answered_count, correct_count, overall_band, pte_overall_score, submitted_at, score_email_sent_at, student_report_published_at, metadata, created_at, updated_at")
    .single();

  if (inserted.error) throw inserted.error;
  return mapAttempt(inserted.data as AttemptRow);
}

export async function savePteMockSection({
  client,
  userId,
  attemptId,
  sectionKey,
  responses,
  nextSectionKey,
}: {
  client: SupabaseClient;
  userId: string;
  attemptId: string;
  sectionKey: string;
  responses: PteSectionResponsePayload[];
  nextSectionKey: string | null;
}) {
  const rows = responses.map((item, index) => ({
    attempt_id: attemptId,
    user_id: userId,
    section_key: sectionKey,
    section_type: sectionKey,
    question_key: item.questionKey,
    question_type: item.question.type,
    source_schema: "pte",
    source_table: item.question.type.toLowerCase(),
    source_id: item.question.id,
    title: item.question.title,
    prompt: item.question.prompt,
    question_snapshot: item.question,
    response: item.response,
    response_text: item.responseText ?? "",
    response_files: item.responseFiles ?? [],
    answered_at: new Date().toISOString(),
    metadata: { sectionSaveOrder: index },
  }));

  if (rows.length > 0) {
    const { error } = await schema(client)
      .from("attempt_answers")
      .upsert(rows, { onConflict: "attempt_id,question_key" });
    if (error) throw error;
  }

  const { count: answeredCount, error: countError } = await schema(client)
    .from("attempt_answers")
    .select("id", { count: "exact", head: true })
    .eq("attempt_id", attemptId)
    .eq("user_id", userId);
  if (countError) throw countError;

  const { data: existing } = await schema(client)
    .from("attempts")
    .select("metadata")
    .eq("id", attemptId)
    .eq("user_id", userId)
    .single();
  const metadata = ((existing as { metadata?: Record<string, unknown> } | null)?.metadata ?? {}) as Record<string, unknown>;
  const sectionCompletion = typeof metadata.sectionCompletion === "object" && metadata.sectionCompletion ? metadata.sectionCompletion as Record<string, unknown> : {};

  const { error: updateError } = await schema(client)
    .from("attempts")
    .update({
      current_section_key: nextSectionKey ?? "submitted",
      current_question_key: null,
      answered_count: answeredCount ?? rows.length,
      metadata: {
        ...metadata,
        sectionCompletion: {
          ...sectionCompletion,
          [sectionKey]: new Date().toISOString(),
        },
      },
    })
    .eq("id", attemptId)
    .eq("user_id", userId)
    .eq("status", "in_progress");

  if (updateError) throw updateError;
}

export async function submitPteMockAttempt(client: SupabaseClient, userId: string, attemptId: string) {
  const { data: answers, error: answersError } = await schema(client)
    .from("attempt_answers")
    .select("id, section_key, question_key, question_type, question_snapshot, response, response_text")
    .eq("attempt_id", attemptId)
    .eq("user_id", userId);
  if (answersError) throw answersError;

  const scoringSummary = await scorePteMockAnswers(client, userId, attemptId, (answers ?? []) as PteAnswerRow[]);

  const { error } = await schema(client)
    .from("attempts")
    .update({
      status: "needs_review",
      submitted_at: new Date().toISOString(),
      answered_count: (answers ?? []).length,
      correct_count: scoringSummary.correctCount,
      section_scores: scoringSummary.sectionScores,
      score_summary: {
        ...scoringSummary,
        message: "PTE mock test submitted. Auto-scored objective items are saved; speaking, writing, and AI-heavy items need teacher review.",
        needs_review: true,
      },
    })
    .eq("id", attemptId)
    .eq("user_id", userId)
    .eq("status", "in_progress");

  if (error) throw error;
}

async function scorePteMockAnswers(client: SupabaseClient, userId: string, attemptId: string, answers: PteAnswerRow[]) {
  const now = new Date().toISOString();
  const rows = answers.map((answer) => {
    const result = scorePteAnswer(answer);
    return {
      attempt_answer_id: answer.id,
      attempt_id: attemptId,
      user_id: userId,
      answer_key_snapshot: result.answerKeySnapshot,
      is_correct: result.isCorrect,
      score: result.score,
      max_score: result.maxScore,
      score_detail: result.scoreDetail,
      feedback: result.feedback,
      needs_manual_review: result.needsManualReview,
      scored_by: result.needsManualReview ? "teacher_required" : "system",
      scored_at: now,
    };
  });

  if (rows.length > 0) {
    const { error } = await schema(client)
      .from("attempt_answer_scores")
      .upsert(rows, { onConflict: "attempt_answer_id" });
    if (error) throw error;
  }

  const sectionScores = rows.reduce<Record<string, { autoScore: number; autoMaxScore: number; autoScoredCount: number; needsReviewCount: number }>>((current, row, index) => {
    const section = answers[index]?.section_key ?? "unknown";
    const entry = current[section] ?? { autoScore: 0, autoMaxScore: 0, autoScoredCount: 0, needsReviewCount: 0 };
    if (row.needs_manual_review) entry.needsReviewCount += 1;
    if (!row.needs_manual_review) {
      entry.autoScore += row.score ?? 0;
      entry.autoMaxScore += row.max_score ?? 0;
      entry.autoScoredCount += 1;
    }
    current[section] = entry;
    return current;
  }, {});

  return {
    autoScoredCount: rows.filter((row) => !row.needs_manual_review).length,
    needsReviewCount: rows.filter((row) => row.needs_manual_review).length,
    correctCount: rows.filter((row) => row.is_correct === true).length,
    sectionScores,
  };
}

function scorePteAnswer(answer: PteAnswerRow) {
  if (answer.question_type === "RO") return scoreOrderAnswer(answer);
  if (answer.question_type === "FIBRW" || answer.question_type === "FIBR") return scoreBlankAnswer(answer);
  if (answer.question_type === "WFD") return scoreWfdAnswer(answer);
  return manualReviewScore(answer, "该题型需要 AI 或老师复查后确认分数。");
}

function scoreOrderAnswer(answer: PteAnswerRow) {
  const correct = Array.isArray(answer.question_snapshot.sentences) ? answer.question_snapshot.sentences : [];
  const selected = Array.isArray(answer.response.orderedItems) ? answer.response.orderedItems.map(String) : [];
  const score = correct.reduce((sum, sentence, index) => sum + (selected[index] === sentence ? 1 : 0), 0);
  return {
    answerKeySnapshot: { orderedItems: correct },
    isCorrect: correct.length > 0 ? score === correct.length : null,
    score,
    maxScore: correct.length,
    scoreDetail: { selected, correct, mode: "position_match" },
    feedback: { mode: "auto_scored", message: "RO 按正确位置数量自动评分。" },
    needsManualReview: false,
  };
}

function scoreBlankAnswer(answer: PteAnswerRow) {
  const blanks = Array.isArray(answer.question_snapshot.blanks) ? answer.question_snapshot.blanks : [];
  const values = answer.response.values && typeof answer.response.values === "object" ? answer.response.values as Record<string, unknown> : {};
  const rows = blanks.map((blank) => {
    const selected = String(values[String(blank.index)] ?? "").trim();
    return { index: blank.index, selected, answer: blank.answer, isCorrect: normalizeText(selected) === normalizeText(blank.answer) };
  });
  const score = rows.filter((row) => row.isCorrect).length;
  return {
    answerKeySnapshot: { blanks: blanks.map((blank) => ({ index: blank.index, answer: blank.answer })) },
    isCorrect: rows.length > 0 ? score === rows.length : null,
    score,
    maxScore: rows.length,
    scoreDetail: { rows, mode: "blank_exact_match" },
    feedback: { mode: "auto_scored", message: "填空题按每空答案自动评分。" },
    needsManualReview: false,
  };
}

function scoreWfdAnswer(answer: PteAnswerRow) {
  const correctWords = normalizeText(answer.question_snapshot.prompt).split(" ").filter(Boolean);
  const userWords = new Set(normalizeText(answer.response_text ?? "").split(" ").filter(Boolean));
  const matched = correctWords.filter((word) => userWords.has(word)).length;
  return {
    answerKeySnapshot: { answer: answer.question_snapshot.prompt },
    isCorrect: correctWords.length > 0 ? matched === correctWords.length : null,
    score: matched,
    maxScore: correctWords.length,
    scoreDetail: { matched, totalWords: correctWords.length, userAnswer: answer.response_text ?? "", mode: "word_match" },
    feedback: { mode: "auto_scored", message: "WFD 第一版按命中正确单词数自动评分。" },
    needsManualReview: false,
  };
}

function manualReviewScore(answer: PteAnswerRow, message: string) {
  return {
    answerKeySnapshot: { answer: answer.question_snapshot.answer ?? null },
    isCorrect: null,
    score: null,
    maxScore: null,
    scoreDetail: { questionType: answer.question_type, userAnswer: answer.response_text, response: answer.response },
    feedback: { mode: "needs_manual_review", message },
    needsManualReview: true,
  };
}

function normalizeText(value: unknown) {
  return String(value ?? "").toLowerCase().replace(/[^\p{L}\p{N}\s']/gu, " ").replace(/\s+/g, " ").trim();
}
