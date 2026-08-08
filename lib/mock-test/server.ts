import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { assertCanStartMockAttempt, getMockTestAccess } from "@/lib/mock-test/access";
import { buildIeltsMockExamPayload, buildIeltsMockSubmitSummary, IELTS_MOCK_BOOK_NUMBER, IELTS_SECTION_DURATIONS, loadIeltsMockSource } from "@/lib/mock-test/ielts";
import type { IeltsMockExamPayload, IeltsMockSectionKey, IeltsMockSpeakingTask, IeltsMockSubmitSummary, MockAttemptStatus, MockAttemptSummary, MockExamType, MockTestDashboardData } from "@/lib/mock-test/types";

type MockAttemptRow = {
  id: string;
  user_id: string;
  exam_id: string | null;
  blueprint_id: string | null;
  exam_type: MockExamType;
  title: string;
  status: MockAttemptStatus;
  current_section_key: string | null;
  current_question_key: string | null;
  question_count: number;
  answered_count: number;
  correct_count: number;
  overall_band: number | null;
  pte_overall_score: number | null;
  score_email_sent_at: string | null;
  student_report_published_at: string | null;
  submitted_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type MockAnswerRow = {
  id: string;
  question_key: string;
  response: Record<string, unknown>;
  response_text: string | null;
  duration_seconds: number;
  flagged: boolean;
};

type SpeakingPart1Row = {
  topic_title: string;
  question_text: string;
  question_number: number | null;
};

type SpeakingPart23Row = {
  english_title: string | null;
  part2_question: string | null;
  cue_card_1: string | null;
  cue_card_2: string | null;
  cue_card_3: string | null;
  cue_card_4: string | null;
  part3_q1: string | null;
  part3_q2: string | null;
  part3_q3: string | null;
  part3_q4: string | null;
  part3_q5: string | null;
  part3_q6: string | null;
  part3_q7: string | null;
  part3_q8: string | null;
  part3_q9: string | null;
  part3_q10: string | null;
};

function mapAttempt(row: MockAttemptRow): MockAttemptSummary {
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

function getSchema(client: SupabaseClient) {
  return client.schema("mock_exam");
}

export async function getMockTestDashboard(client: SupabaseClient, userId: string): Promise<MockTestDashboardData> {
  const { data, error } = await getSchema(client)
    .from("attempts")
    .select("id, user_id, exam_id, blueprint_id, exam_type, title, status, current_section_key, current_question_key, question_count, answered_count, correct_count, overall_band, pte_overall_score, score_email_sent_at, student_report_published_at, submitted_at, metadata, created_at, updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  const attempts = ((data ?? []) as MockAttemptRow[]).map(mapAttempt);
  const access = await getMockTestAccess(userId);

  return {
    totalAttempts: attempts.length,
    ieltsAttempts: attempts.filter((attempt) => attempt.examType === "ielts").length,
    pteAttempts: attempts.filter((attempt) => attempt.examType === "pte").length,
    latestSubmittedAt: attempts.find((attempt) => attempt.submittedAt)?.submittedAt ?? null,
    inProgressAttempts: attempts.filter((attempt) => attempt.status === "in_progress"),
    publishedReports: attempts.filter((attempt) => attempt.studentReportPublishedAt),
    access,
  };
}

export async function getOrCreateIeltsMockAttempt(client: SupabaseClient, userId: string, testNumber: number) {
  const title = `Cambridge IELTS ${IELTS_MOCK_BOOK_NUMBER} Test ${testNumber}`;
  const schema = getSchema(client);
  const { data: existing, error: existingError } = await schema
    .from("attempts")
    .select("id, user_id, exam_id, blueprint_id, exam_type, title, status, current_section_key, current_question_key, question_count, answered_count, correct_count, overall_band, pte_overall_score, score_email_sent_at, student_report_published_at, submitted_at, metadata, created_at, updated_at")
    .eq("user_id", userId)
    .eq("exam_type", "ielts")
    .eq("status", "in_progress")
    .contains("metadata", { bookNumber: IELTS_MOCK_BOOK_NUMBER, testNumber })
    .order("created_at", { ascending: false })
    .limit(1);

  if (existingError) throw existingError;
  const first = ((existing ?? []) as MockAttemptRow[])[0];
  if (first) return mapAttempt(first);

  await assertCanStartMockAttempt(userId);

  const source = await loadIeltsMockSource(client, testNumber);
  const speaking = await loadIeltsMockSpeaking(client);
  const writingTask2 = await loadRandomIeltsWritingTask2(client);
  const metadata = {
    bookNumber: IELTS_MOCK_BOOK_NUMBER,
    testNumber,
    timers: IELTS_SECTION_DURATIONS,
    source: "ielts_static_practice",
    speaking,
    writingTask2,
  };

  const { data, error } = await schema
    .from("attempts")
    .insert({
      user_id: userId,
      exam_type: "ielts",
      title,
      status: "in_progress",
      delivery_mode: "computer",
      duration_seconds: IELTS_SECTION_DURATIONS.listening + IELTS_SECTION_DURATIONS.reading + IELTS_SECTION_DURATIONS.writing + IELTS_SECTION_DURATIONS.speaking,
      current_section_key: "listening",
      current_question_key: "listening:1",
      question_count: countIeltsMockQuestions(source, speaking),
      metadata,
    })
    .select("id, user_id, exam_id, blueprint_id, exam_type, title, status, current_section_key, current_question_key, question_count, answered_count, correct_count, overall_band, pte_overall_score, score_email_sent_at, student_report_published_at, submitted_at, metadata, created_at, updated_at")
    .single();

  if (error) throw error;
  return mapAttempt(data as MockAttemptRow);
}

export async function loadIeltsMockAttemptPayload(client: SupabaseClient, userId: string, testNumber: number): Promise<IeltsMockExamPayload> {
  const source = await loadIeltsMockSource(client, testNumber);
  const attempt = await getOrCreateIeltsMockAttempt(client, userId, testNumber);
  const answers = await listAttemptAnswers(client, attempt.id, userId);
  const timers = typeof attempt.metadata.timers === "object" && attempt.metadata.timers ? attempt.metadata.timers as Record<string, unknown> : undefined;
  const speaking = isSpeakingTask(attempt.metadata.speaking) ? attempt.metadata.speaking : await loadIeltsMockSpeaking(client);
  const writingTask2 = isWritingTask(attempt.metadata.writingTask2) ? attempt.metadata.writingTask2 : await loadRandomIeltsWritingTask2(client);
  if ((!isSpeakingTask(attempt.metadata.speaking) && speaking) || (!isWritingTask(attempt.metadata.writingTask2) && writingTask2)) {
    await getSchema(client)
      .from("attempts")
      .update({ metadata: { ...attempt.metadata, speaking, writingTask2 } })
      .eq("id", attempt.id)
      .eq("user_id", userId)
      .eq("status", "in_progress");
  }

  return buildIeltsMockExamPayload({
    source,
    testNumber,
    attempt,
    answers,
    timers,
    speaking,
    writingTask2,
  });
}

export async function listAttemptAnswers(client: SupabaseClient, attemptId: string, userId: string) {
  const { data, error } = await getSchema(client)
    .from("attempt_answers")
    .select("id, question_key, response, response_text, duration_seconds, flagged")
    .eq("attempt_id", attemptId)
    .eq("user_id", userId);

  if (error) throw error;
  return Object.fromEntries(((data ?? []) as MockAnswerRow[]).map((row) => [row.question_key, typeof row.response_text === "string" ? row.response_text : stringValue(row.response.answer)]));
}

export async function saveMockAnswer({
  client,
  userId,
  attemptId,
  sectionKey,
  questionKey,
  questionType,
  responseText,
  durationSeconds,
  currentQuestionKey,
  timers,
}: {
  client: SupabaseClient;
  userId: string;
  attemptId: string;
  sectionKey: string;
  questionKey: string;
  questionType: string;
  responseText: string;
  durationSeconds?: number;
  currentQuestionKey?: string;
  timers?: Partial<Record<IeltsMockSectionKey, number>>;
}) {
  const schema = getSchema(client);
  const now = new Date().toISOString();
  const { error } = await schema
    .from("attempt_answers")
    .upsert({
      attempt_id: attemptId,
      user_id: userId,
      section_key: sectionKey,
      section_type: sectionKey,
      question_key: questionKey,
      question_type: questionType,
      response: { answer: responseText },
      response_text: responseText,
      duration_seconds: Math.max(0, Number(durationSeconds ?? 0)),
      answered_at: responseText.trim() ? now : null,
    }, { onConflict: "attempt_id,question_key" });

  if (error) throw error;

  await updateAttemptProgress({
    client,
    userId,
    attemptId,
    currentSectionKey: sectionKey,
    currentQuestionKey: currentQuestionKey ?? questionKey,
    timers,
  });
}

export async function updateAttemptProgress({
  client,
  userId,
  attemptId,
  currentSectionKey,
  currentQuestionKey,
  timers,
}: {
  client: SupabaseClient;
  userId: string;
  attemptId: string;
  currentSectionKey: string;
  currentQuestionKey: string;
  timers?: Partial<Record<IeltsMockSectionKey, number>>;
}) {
  const answers = await listAttemptAnswers(client, attemptId, userId);
  const updatePayload: Record<string, unknown> = {
    current_section_key: currentSectionKey,
    current_question_key: currentQuestionKey,
    answered_count: Object.values(answers).filter((value) => value.trim()).length,
  };

  if (timers) {
    const { data: existing } = await getSchema(client)
      .from("attempts")
      .select("metadata")
      .eq("id", attemptId)
      .eq("user_id", userId)
      .single();
    const currentMetadata = ((existing as { metadata?: Record<string, unknown> } | null)?.metadata ?? {}) as Record<string, unknown>;
    updatePayload.metadata = { ...currentMetadata, timers: { ...(typeof currentMetadata.timers === "object" && currentMetadata.timers ? currentMetadata.timers : {}), ...timers } };
  }

  const { error } = await getSchema(client)
    .from("attempts")
    .update(updatePayload)
    .eq("id", attemptId)
    .eq("user_id", userId)
    .eq("status", "in_progress");

  if (error) throw error;
}

export async function submitIeltsMockAttempt(client: SupabaseClient, userId: string, attemptId: string) {
  const attempt = await getAttemptById(client, userId, attemptId);
  const testNumber = Number(attempt.metadata.testNumber);
  const source = await loadIeltsMockSource(client, testNumber);
  const answers = await listAttemptAnswers(client, attemptId, userId);
  const summary = buildIeltsMockSubmitSummary(source, answers);

  await saveIeltsScores(client, userId, attemptId, summary);

  const { data, error } = await getSchema(client)
    .from("attempts")
    .update({
      status: "scored",
      submitted_at: new Date().toISOString(),
      scored_at: new Date().toISOString(),
      answered_count: summary.answeredCount,
      correct_count: summary.correctCount,
      raw_score: summary.correctCount,
      overall_band: averageBand(summary.listening?.bandScore, summary.reading?.bandScore),
      section_scores: summary.sectionScores,
      score_summary: {
        writing: summary.writing,
        speaking: summary.speaking,
        message: "IELTS Listening and Reading were auto-scored. Writing and Speaking answers were saved for review.",
      },
      current_section_key: "submitted",
      current_question_key: null,
    })
    .eq("id", attemptId)
    .eq("user_id", userId)
    .select("id, user_id, exam_id, blueprint_id, exam_type, title, status, current_section_key, current_question_key, question_count, answered_count, correct_count, overall_band, pte_overall_score, score_email_sent_at, student_report_published_at, submitted_at, metadata, created_at, updated_at")
    .single();

  if (error) throw error;
  return { attempt: mapAttempt(data as MockAttemptRow), summary };
}

async function loadIeltsMockSpeaking(client: SupabaseClient): Promise<IeltsMockSpeakingTask | null> {
  const [part1Result, part23Result] = await Promise.all([
    client
      .schema("ielts")
      .from("ielts_speaking_part1_questions")
      .select("topic_title, question_text, question_number")
      .limit(500),
    client
      .schema("ielts")
      .from("ielts_speaking_part2_3")
      .select("english_title, part2_question, cue_card_1, cue_card_2, cue_card_3, cue_card_4, part3_q1, part3_q2, part3_q3, part3_q4, part3_q5, part3_q6, part3_q7, part3_q8, part3_q9, part3_q10")
      .eq("status", "published")
      .limit(300),
  ]);

  if (part1Result.error || part23Result.error) return null;
  const part1Rows = (part1Result.data ?? []) as SpeakingPart1Row[];
  const part23Rows = (part23Result.data ?? []) as SpeakingPart23Row[];
  const groups = new Map<string, SpeakingPart1Row[]>();
  for (const row of part1Rows) {
    if (!row.topic_title || !row.question_text) continue;
    groups.set(row.topic_title, [...(groups.get(row.topic_title) ?? []), row]);
  }
  const part1Group = shuffle([...groups.entries()].filter(([, rows]) => rows.length > 0))[0];
  const part23 = shuffle(part23Rows.filter((row) => row.part2_question))[0];
  if (!part1Group || !part23?.part2_question) return null;

  const part1Questions = shuffle(part1Group[1]).slice(0, 3).sort((a, b) => Number(a.question_number ?? 0) - Number(b.question_number ?? 0)).map((row) => row.question_text);
  const cueCards = [part23.cue_card_1, part23.cue_card_2, part23.cue_card_3, part23.cue_card_4].filter(Boolean) as string[];
  const part3Questions = shuffle([part23.part3_q1, part23.part3_q2, part23.part3_q3, part23.part3_q4, part23.part3_q5, part23.part3_q6, part23.part3_q7, part23.part3_q8, part23.part3_q9, part23.part3_q10].filter(Boolean) as string[]).slice(0, 5);

  return {
    part1Topic: part1Group[0],
    part1Questions,
    part2Title: part23.english_title || "Speaking Part 2",
    part2Question: part23.part2_question,
    cueCards,
    part3Questions,
  };
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

function isSpeakingTask(value: unknown): value is IeltsMockSpeakingTask {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return typeof row.part2Question === "string" && Array.isArray(row.part1Questions) && Array.isArray(row.part3Questions);
}

async function loadRandomIeltsWritingTask2(client: SupabaseClient) {
  const { data, error } = await client
    .schema("ielts")
    .from("ielts_writing_topics")
    .select("id, question_en, question_type, topic_category")
    .limit(300);
  if (error) return null;
  const row = shuffle((data ?? []).filter((item): item is { id: string; question_en: string; question_type: string | null; topic_category: string | null } => Boolean(item.question_en)))[0];
  if (!row) return null;
  return {
    taskKey: "task2" as const,
    title: "Writing Task 2",
    prompt: `<p><strong>${escapeHtml(row.question_en)}</strong></p><p>Give reasons for your answer and include any relevant examples from your own knowledge or experience.</p><p>Write at least 250 words.</p>`,
    instructions: "You should spend about 40 minutes on this task.",
    imageUrls: [],
  };
}

function isWritingTask(value: unknown): value is IeltsMockExamPayload["sections"]["writing"][number] {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return row.taskKey === "task2" && typeof row.prompt === "string";
}

function countIeltsMockQuestions(source: Awaited<ReturnType<typeof loadIeltsMockSource>>, speaking: IeltsMockSpeakingTask | null) {
  const listeningModuleIds = source.modules.filter((module) => module.module_type === "listening").map((module) => module.id);
  const readingModuleIds = source.modules.filter((module) => module.module_type === "reading").map((module) => module.id);
  const listeningSectionIds = source.sections.filter((section) => listeningModuleIds.includes(section.module_id)).map((section) => section.id);
  const readingSectionIds = source.sections.filter((section) => readingModuleIds.includes(section.module_id)).map((section) => section.id);
  const lrCount = source.questions
    .filter((question) => listeningSectionIds.includes(question.section_id) || readingSectionIds.includes(question.section_id))
    .reduce((sum, question) => sum + Math.max(1, Number(question.question_number_end ?? question.question_number_start) - Number(question.question_number_start) + 1), 0);
  const speakingCount = speaking ? speaking.part1Questions.length + 1 + speaking.part3Questions.length : 0;
  return lrCount + 2 + speakingCount;
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

async function saveIeltsScores(client: SupabaseClient, userId: string, attemptId: string, summary: IeltsMockSubmitSummary) {
  const listeningRows = (summary.listening?.rows ?? []).map((row) => ({ sectionKey: "listening", row }));
  const readingRows = (summary.reading?.rows ?? []).map((row) => ({ sectionKey: "reading", row }));
  const scoredRows = [...listeningRows, ...readingRows];
  const rows = scoredRows.map(({ sectionKey, row }) => ({
    attempt_id: attemptId,
    user_id: userId,
    section_key: sectionKey,
    section_type: sectionKey,
    question_key: `${sectionKey}:${row.questionNumber}`,
    question_type: "ielts_answer",
    question_number_start: row.questionNumber,
    question_number_end: row.questionNumber,
    response: { answer: row.userAnswer },
    response_text: row.userAnswer,
    answered_at: row.isAnswered ? new Date().toISOString() : null,
  }));

  if (rows.length === 0) return;

  const { data: savedAnswers, error } = await getSchema(client)
    .from("attempt_answers")
    .upsert(rows, { onConflict: "attempt_id,question_key" })
    .select("id, question_key");

  if (error) throw error;

  const answerIdByKey = new Map(((savedAnswers ?? []) as Array<{ id: string; question_key: string }>).map((row) => [row.question_key, row.id]));
  const scoreRows = scoredRows.map(({ sectionKey, row }) => {
    const questionKey = `${sectionKey}:${row.questionNumber}`;
    const answerId = answerIdByKey.get(questionKey);
    if (!answerId) return null;
    return {
      attempt_answer_id: answerId,
      attempt_id: attemptId,
      user_id: userId,
      answer_key_snapshot: { officialAnswer: row.officialAnswer },
      is_correct: row.isCorrect,
      score: row.isCorrect ? 1 : 0,
      max_score: 1,
      score_detail: {
        questionNumber: row.questionNumber,
        userAnswer: row.userAnswer,
        officialAnswer: row.officialAnswer,
        isAnswered: row.isAnswered,
      },
      feedback: {},
      needs_manual_review: false,
      scored_by: "system",
      scored_at: new Date().toISOString(),
    };
  }).filter((row): row is NonNullable<typeof row> => Boolean(row));

  if (scoreRows.length > 0) {
    const { error: scoreError } = await getSchema(client)
      .from("attempt_answer_scores")
      .upsert(scoreRows, { onConflict: "attempt_answer_id" });
    if (scoreError) throw scoreError;
  }
}

async function getAttemptById(client: SupabaseClient, userId: string, attemptId: string) {
  const { data, error } = await getSchema(client)
    .from("attempts")
    .select("id, user_id, exam_id, blueprint_id, exam_type, title, status, current_section_key, current_question_key, question_count, answered_count, correct_count, overall_band, pte_overall_score, score_email_sent_at, student_report_published_at, submitted_at, metadata, created_at, updated_at")
    .eq("id", attemptId)
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return mapAttempt(data as MockAttemptRow);
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function averageBand(first?: number, second?: number) {
  const values = [first, second].filter((value): value is number => typeof value === "number");
  if (values.length === 0) return null;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 2) / 2;
}
