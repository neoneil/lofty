import type { SupabaseClient } from "@supabase/supabase-js";

type SupabaseClientLike = Pick<SupabaseClient, "from">;

type Args = {
  supabase: SupabaseClientLike;
  userId: string;
  moduleType: string;
  questionSource: string;
  questionId: string;
  durationSeconds?: number | null;
  score?: number | null;
};

export async function updateSpeakingRecordingStats({
  supabase,
  userId,
  moduleType,
  questionSource,
  questionId,
  durationSeconds,
  score,
}: Args) {
  const nowIso = new Date().toISOString();
  const safeDuration = Math.max(0, Math.floor(durationSeconds ?? 0));
  const hasScore = typeof score === "number";
  const isCorrect = hasScore ? score >= 65 : false;

  const { data: existingStat, error: existingStatError } = await supabase
    .from("student_question_stats")
    .select("id, attempt_count, completed_count, correct_count, wrong_count, total_duration_seconds, best_score, latest_score, last_correct_at, last_wrong_at, is_in_wrong_book")
    .eq("user_id", userId)
    .eq("question_source", questionSource)
    .eq("question_id", questionId)
    .maybeSingle();

  if (existingStatError) {
    throw new Error(existingStatError.message);
  }

  if (!existingStat) {
    const { error } = await supabase.from("student_question_stats").insert({
      user_id: userId,
      exam_type: "PTE",
      module_type: moduleType,
      question_source: questionSource,
      question_id: questionId,
      attempt_count: 1,
      completed_count: 1,
      correct_count: hasScore && isCorrect ? 1 : 0,
      wrong_count: hasScore && !isCorrect ? 1 : 0,
      total_duration_seconds: safeDuration,
      last_attempt_at: nowIso,
      last_correct_at: isCorrect ? nowIso : null,
      last_wrong_at: isCorrect ? null : nowIso,
      is_practiced: true,
      is_in_wrong_book: hasScore ? !isCorrect : false,
      best_score: score ?? null,
      latest_score: score ?? null,
    });

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const { error } = await supabase
    .from("student_question_stats")
    .update({
      attempt_count: (existingStat.attempt_count ?? 0) + 1,
      completed_count: (existingStat.completed_count ?? 0) + 1,
      correct_count:
        (existingStat.correct_count ?? 0) + (hasScore && isCorrect ? 1 : 0),
      wrong_count:
        (existingStat.wrong_count ?? 0) + (hasScore && !isCorrect ? 1 : 0),
      total_duration_seconds:
        (existingStat.total_duration_seconds ?? 0) + safeDuration,
      last_attempt_at: nowIso,
      last_correct_at:
        hasScore && isCorrect ? nowIso : existingStat.last_correct_at,
      last_wrong_at:
        hasScore && !isCorrect ? nowIso : existingStat.last_wrong_at,
      is_practiced: true,
      is_in_wrong_book: hasScore
        ? !isCorrect
        : existingStat.is_in_wrong_book ?? false,
      latest_score: hasScore ? score : existingStat.latest_score ?? null,
      best_score:
        typeof score === "number"
          ? Math.max(existingStat.best_score ?? 0, score)
          : existingStat.best_score ?? null,
    })
    .eq("id", existingStat.id);

  if (error) {
    throw new Error(error.message);
  }
}
