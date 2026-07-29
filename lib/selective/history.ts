import type { SupabaseClient } from "@supabase/supabase-js";

type StudentAttemptRow = {
  id: string;
  user_id: string;
  student_name: string | null;
  question_table: string;
  question_id: string;
  question_type: string | null;
  submitted_answer_text: string | null;
  submitted_answer_json: {
    topicCategory?: string;
    subtopic?: string;
    finalAnswer?: string;
  } | null;
  score: number | null;
  max_score: number | null;
  is_correct: boolean | null;
  submitted_at: string | null;
  submitted_on: string | null;
};

type MathQuestionRow = {
  id: string;
  title: string | null;
  question_type: string | null;
  instruction_text: string | null;
  question_body_text: string;
  difficulty_level: string | null;
  topic_category: string | null;
  subtopic: string | null;
  metadata_json: {
    finalAnswer?: string;
    solutionSteps?: string[];
    hints?: string[];
  } | null;
};

export async function getSelectiveHistoryRows(supabase: SupabaseClient, userId?: string) {
  let writingQuery = supabase
    .schema("selective")
    .from("v_writing_history")
    .select("*")
    .order("submitted_at", { ascending: false });

  let attemptsQuery = supabase
    .schema("selective")
    .from("student_attempts")
    .select("*")
    .eq("question_table", "math_questions")
    .order("submitted_at", { ascending: false });

  if (userId) {
    writingQuery = writingQuery.eq("user_id", userId);
    attemptsQuery = attemptsQuery.eq("user_id", userId);
  }

  const [{ data: writingRows, error: writingError }, { data: attemptRows, error: attemptError }] = await Promise.all([
    writingQuery,
    attemptsQuery,
  ]);

  if (writingError) throw new Error(writingError.message);
  if (attemptError) throw new Error(attemptError.message);

  const mathAttemptRows = (attemptRows as StudentAttemptRow[]) ?? [];
  const mathQuestionIds = Array.from(new Set(mathAttemptRows.map((row) => row.question_id).filter(Boolean)));

  let mathQuestionMap = new Map<string, MathQuestionRow>();

  if (mathQuestionIds.length > 0) {
    const { data: mathQuestionRows, error: mathQuestionError } = await supabase
      .schema("selective")
      .from("math_questions")
      .select("id, title, question_type, instruction_text, question_body_text, difficulty_level, topic_category, subtopic, metadata_json")
      .in("id", mathQuestionIds);

    if (mathQuestionError) throw new Error(mathQuestionError.message);

    mathQuestionMap = new Map(((mathQuestionRows as MathQuestionRow[]) ?? []).map((row) => [row.id, row]));
  }

  const mathRows = mathAttemptRows.map((attempt) => {
    const question = mathQuestionMap.get(attempt.question_id);

    return {
      attempt_id: attempt.id,
      user_id: attempt.user_id,
      student_name: attempt.student_name,
      question_id: attempt.question_id,
      question_type: attempt.question_type ?? question?.question_type ?? null,
      submitted_answer_text: attempt.submitted_answer_text,
      submitted_answer_json: attempt.submitted_answer_json,
      score: attempt.score,
      max_score: attempt.max_score,
      is_correct: attempt.is_correct,
      submitted_at: attempt.submitted_at,
      submitted_on: attempt.submitted_on,
      title: question?.title ?? null,
      instruction_text: question?.instruction_text ?? null,
      question_body_text: question?.question_body_text ?? null,
      difficulty_level: question?.difficulty_level ?? null,
      topic_category: question?.topic_category ?? attempt.submitted_answer_json?.topicCategory ?? null,
      subtopic: question?.subtopic ?? attempt.submitted_answer_json?.subtopic ?? null,
      final_answer: question?.metadata_json?.finalAnswer ?? attempt.submitted_answer_json?.finalAnswer ?? null,
      solution_steps: question?.metadata_json?.solutionSteps ?? [],
      hints: question?.metadata_json?.hints ?? [],
    };
  });

  return {
    writingRows: writingRows ?? [],
    mathRows,
  };
}
