import { NextRequest, NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth/require-api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPteAnalyticsForUser } from "@/lib/analytics/pte-analytics";

const SPEAKING_AI_TYPES = new Set(["RA", "DI", "RL", "SGD"]);

type StudentAttempt = {
  id: string;
  question_source: string;
  question_id: string;
  submitted_at: string | null;
  duration_seconds: number | null;
  score: number | null;
  accuracy: number | null;
  is_correct: boolean | null;
  user_answer: string | null;
  correct_answer: string | null;
  ai_feedback: {
    feedback?: string;
    suggestions?: string[];
    raw?: {
      feedback?: string;
      suggestions?: string[];
    };
  } | null;
};

type SpeakingAttempt = {
  id: string;
  question_type: string;
  question_id: string;
  audio_url: string | null;
  transcript: string | null;
  overall_score: number | null;
  content_score: number | null;
  fluency_score: number | null;
  pronunciation_score: number | null;
  accuracy_score: number | null;
  completeness_score: number | null;
  feedback_json: {
    feedback?: string;
    suggestions?: string[];
    raw?: {
      feedback?: string;
      suggestions?: string[];
    };
  } | null;
  created_at: string | null;
};

type IeltsSpeakingAttempt = {
  id: string;
  question_id: string;
  part: "part1" | "part2" | "part3";
  question_context: {
    topicTitle?: string;
    questionText?: string;
    part2Question?: string;
    category?: string | null;
  } | null;
  audio_url: string | null;
  transcript: string | null;
  overall_band: number | null;
  fluency_score: number | null;
  lexical_score: number | null;
  grammar_score: number | null;
  pronunciation_score: number | null;
  feedback_json: {
    summary_cn?: string;
    better_answer?: string;
    better_answer_en?: string;
    better_answer_cn?: string;
  } | null;
  created_at: string | null;
};

type IeltsWritingAttempt = {
  id: string;
  task_type: string | null;
  prompt_question: string;
  essay_text: string;
  target_band: number | null;
  overall_band: number | null;
  word_count: number | null;
  feedback_json: {
    overall_feedback?: {
      summary_cn?: string;
      summary?: string;
      priority_actions?: string[];
      improvement_priority?: string[];
    };
    band8_model_essay?: {
      band8_essay?: string;
    };
  } | null;
  created_at: string | null;
};

function isMissingTableError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && ["42P01", "PGRST205"].includes(String((error as { code?: unknown }).code));
}

function getFeedback(feedbackJson: StudentAttempt["ai_feedback"]) {
  return feedbackJson?.feedback ?? feedbackJson?.raw?.feedback ?? "";
}

function getSuggestions(feedbackJson: StudentAttempt["ai_feedback"]) {
  return feedbackJson?.suggestions ?? feedbackJson?.raw?.suggestions ?? [];
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const adminCheck = await requireApiAdmin();

  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  const { userId } = await params;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type")?.toLowerCase() ?? "";
  const supabase = createAdminClient();

  const [
    { data: allAttempts, error: attemptsError },
    { data: studyPlan, error: studyPlanError },
    { data: ieltsSpeakingAttempts, error: ieltsSpeakingError },
    ieltsWritingResult,
    analytics,
  ] = await Promise.all([
    supabase
      .from("student_attempts")
      .select("question_source, submitted_at, score, is_correct")
      .eq("user_id", userId),
    supabase
      .from("study_plans")
      .select("exam_type, overall_target, overall_current, listening_target, listening_current, reading_target, reading_current, writing_target, writing_current, speaking_target, speaking_current, exam_deadline, study_goal, daily_study_hours, additional_notes")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .schema("ielts")
      .from("speaking_attempts")
      .select("id, question_id, part, question_context, audio_url, transcript, overall_band, fluency_score, lexical_score, grammar_score, pronunciation_score, feedback_json, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .schema("ielts")
      .from("writing_attempts")
      .select("id, task_type, prompt_question, essay_text, target_band, overall_band, word_count, feedback_json, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    getPteAnalyticsForUser(supabase, userId),
  ]);

  const ieltsWritingError = ieltsWritingResult.error;

  if (
    attemptsError ||
    studyPlanError ||
    ieltsSpeakingError ||
    (ieltsWritingError && !isMissingTableError(ieltsWritingError))
  ) {
    return NextResponse.json(
      {
        ok: false,
        message: attemptsError?.message ?? studyPlanError?.message ?? ieltsSpeakingError?.message ?? ieltsWritingError?.message,
      },
      { status: 500 },
    );
  }

  const summaryMap = new Map<
    string,
    {
      questionSource: string;
      attempts: number;
      correctCount: number;
      wrongCount: number;
      latestSubmittedAt: string | null;
    }
  >();

  for (const attempt of allAttempts ?? []) {
    const source = attempt.question_source;
    const existing =
      summaryMap.get(source) ??
      {
        questionSource: source,
        attempts: 0,
        correctCount: 0,
        wrongCount: 0,
        latestSubmittedAt: null,
      };

    existing.attempts += 1;
    existing.correctCount += attempt.is_correct ? 1 : 0;
    existing.wrongCount += attempt.is_correct === false ? 1 : 0;
    if (
      attempt.submitted_at &&
      (!existing.latestSubmittedAt ||
        attempt.submitted_at > existing.latestSubmittedAt)
    ) {
      existing.latestSubmittedAt = attempt.submitted_at;
    }

    summaryMap.set(source, existing);
  }

  for (const attempt of (ieltsSpeakingAttempts ?? []) as IeltsSpeakingAttempt[]) {
    const source = "ielts_speaking_ai";
    const existing = summaryMap.get(source) ?? {
      questionSource: source,
      attempts: 0,
      correctCount: 0,
      wrongCount: 0,
      latestSubmittedAt: null,
    };

    existing.attempts += 1;
    if (attempt.created_at && (!existing.latestSubmittedAt || attempt.created_at > existing.latestSubmittedAt)) {
      existing.latestSubmittedAt = attempt.created_at;
    }
    summaryMap.set(source, existing);
  }

  for (const attempt of (ieltsWritingResult.data ?? []) as IeltsWritingAttempt[]) {
    const source = "ielts_writing_ai";
    const existing = summaryMap.get(source) ?? {
      questionSource: source,
      attempts: 0,
      correctCount: 0,
      wrongCount: 0,
      latestSubmittedAt: null,
    };

    existing.attempts += 1;
    if (attempt.created_at && (!existing.latestSubmittedAt || attempt.created_at > existing.latestSubmittedAt)) {
      existing.latestSubmittedAt = attempt.created_at;
    }
    summaryMap.set(source, existing);
  }

  const summaries = Array.from(summaryMap.values()).sort(
    (a, b) => b.attempts - a.attempts,
  );

  if (!type) {
    return NextResponse.json({
      ok: true,
      summaries,
      studyPlan,
      analytics,
      practices: [],
    });
  }

  const upperType = type.toUpperCase();

  if (type === "ielts_speaking_ai") {
    const practices = ((ieltsSpeakingAttempts ?? []) as IeltsSpeakingAttempt[]).map((attempt) => {
      const context = attempt.question_context ?? {};
      const questionText = context.questionText ?? context.part2Question ?? context.topicTitle ?? attempt.question_id;
      const betterAnswer = attempt.feedback_json?.better_answer_en ?? attempt.feedback_json?.better_answer ?? attempt.feedback_json?.better_answer_cn ?? null;

      return {
        id: attempt.id,
        sourceKind: "ielts_speaking_attempts",
        questionSource: type,
        questionId: attempt.question_id,
        questionPrompt: questionText,
        submittedAt: attempt.created_at,
        audioUrl: attempt.audio_url,
        score: attempt.overall_band,
        contentScore: attempt.lexical_score,
        fluencyScore: attempt.fluency_score,
        pronunciationScore: attempt.pronunciation_score,
        accuracyScore: attempt.grammar_score,
        transcript: attempt.transcript,
        userAnswer: questionText,
        correctAnswer: betterAnswer,
        feedback: attempt.feedback_json?.summary_cn ?? "",
        suggestions: [],
      };
    });

    return NextResponse.json({
      ok: true,
      summaries,
      studyPlan,
      analytics,
      practices,
      ieltsWritingHistoryReady: !ieltsWritingError,
    });
  }

  if (type === "ielts_writing_ai") {
    const practices = ((ieltsWritingResult.data ?? []) as IeltsWritingAttempt[]).map((attempt) => ({
      id: attempt.id,
      sourceKind: "ielts_writing_attempts",
      questionSource: type,
      questionId: attempt.id,
      questionPrompt: attempt.prompt_question,
      submittedAt: attempt.created_at,
      durationSeconds: null,
      score: attempt.overall_band,
      accuracy: null,
      isCorrect: null,
      userAnswer: `${attempt.prompt_question}\n\n${attempt.essay_text}`,
      correctAnswer: attempt.feedback_json?.band8_model_essay?.band8_essay ?? null,
      feedback: attempt.feedback_json?.overall_feedback?.summary_cn ?? attempt.feedback_json?.overall_feedback?.summary ?? "",
      suggestions: attempt.feedback_json?.overall_feedback?.priority_actions ?? attempt.feedback_json?.overall_feedback?.improvement_priority ?? [],
    }));

    return NextResponse.json({
      ok: true,
      summaries,
      studyPlan,
      analytics,
      practices,
      ieltsWritingHistoryReady: !ieltsWritingError,
    });
  }

  if (SPEAKING_AI_TYPES.has(upperType)) {
    const { data: speakingAttempts, error: speakingError } = await supabase
      .schema("pte")
      .from("speaking_attempts")
      .select("id, question_type, question_id, audio_url, transcript, overall_score, content_score, fluency_score, pronunciation_score, accuracy_score, completeness_score, feedback_json, created_at")
      .eq("user_id", userId)
      .eq("question_type", upperType)
      .order("created_at", { ascending: false })
      .limit(80);

    if (speakingError) {
      return NextResponse.json(
        { ok: false, message: speakingError.message },
        { status: 500 },
      );
    }

    const practices = ((speakingAttempts ?? []) as SpeakingAttempt[]).map(
      (attempt) => ({
        id: attempt.id,
        sourceKind: "speaking_attempts",
        questionSource: type,
        questionId: attempt.question_id,
        submittedAt: attempt.created_at,
        audioUrl: attempt.audio_url,
        score: attempt.overall_score,
        contentScore: attempt.content_score,
        fluencyScore: attempt.fluency_score,
        pronunciationScore: attempt.pronunciation_score,
        accuracyScore: attempt.accuracy_score,
        completenessScore: attempt.completeness_score,
        transcript: attempt.transcript,
        feedback: getFeedback(attempt.feedback_json),
        suggestions: getSuggestions(attempt.feedback_json),
      }),
    );

    return NextResponse.json({
      ok: true,
      summaries,
      studyPlan,
      analytics,
      practices,
    });
  }

  const { data: attempts, error } = await supabase
    .from("student_attempts")
    .select("id, question_source, question_id, submitted_at, duration_seconds, score, accuracy, is_correct, user_answer, correct_answer, ai_feedback")
    .eq("user_id", userId)
    .eq("question_source", type)
    .order("submitted_at", { ascending: false })
    .limit(80);

  if (error) {
    return NextResponse.json(
      { ok: false, message: "练习记录加载失败。" },
      { status: 500 },
    );
  }

  const practices = ((attempts ?? []) as StudentAttempt[]).map((attempt) => ({
    id: attempt.id,
    sourceKind: "student_attempts",
    questionSource: attempt.question_source,
    questionId: attempt.question_id,
    submittedAt: attempt.submitted_at,
    durationSeconds: attempt.duration_seconds,
    score: attempt.score,
    accuracy: attempt.accuracy,
    isCorrect: attempt.is_correct,
    userAnswer: attempt.user_answer,
    correctAnswer: attempt.correct_answer,
    feedback: getFeedback(attempt.ai_feedback),
    suggestions: getSuggestions(attempt.ai_feedback),
  }));

  return NextResponse.json({
    ok: true,
    summaries,
    studyPlan,
    analytics,
    practices,
  });
}
