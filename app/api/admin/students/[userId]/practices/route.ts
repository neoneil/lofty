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
    getPteAnalyticsForUser(supabase, userId),
  ]);

  if (attemptsError || studyPlanError) {
    return NextResponse.json(
      {
        ok: false,
        message: attemptsError?.message ?? studyPlanError?.message,
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
      { ok: false, message: error.message },
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
