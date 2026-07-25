import type { SupabaseClient } from "@supabase/supabase-js";

type SupabaseRpcClient = Pick<SupabaseClient, "rpc">;

type Args = {
  supabase: SupabaseRpcClient;
  userId: string;
  examType?: string;
  moduleType: string;
  questionSource: string;
  questionId: string;
  durationSeconds?: number | null;
  isCorrect: boolean;
  score?: number | null;
  updateWrongBook?: boolean;
};

export async function recordQuestionOutcome({
  supabase,
  userId,
  examType = "PTE",
  moduleType,
  questionSource,
  questionId,
  durationSeconds,
  isCorrect,
  score,
  updateWrongBook = true,
}: Args) {
  const safeDuration = Math.max(0, Math.floor(durationSeconds ?? 0));
  const { error } = await supabase.rpc("record_student_question_outcome", {
    p_user_id: userId,
    p_exam_type: examType,
    p_module_type: moduleType,
    p_question_source: questionSource,
    p_question_id: questionId,
    p_duration_seconds: safeDuration,
    p_is_correct: isCorrect,
    p_score: score ?? null,
    p_update_wrong_book: updateWrongBook,
  });

  if (error) {
    throw new Error(error.message);
  }
}
