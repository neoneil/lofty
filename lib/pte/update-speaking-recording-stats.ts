import type { SupabaseClient } from "@supabase/supabase-js";

import { recordQuestionOutcome } from "@/lib/pte/record-question-outcome";

type SupabaseClientLike = Pick<SupabaseClient, "rpc">;

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
  const hasScore = typeof score === "number";
  await recordQuestionOutcome({
    supabase,
    userId,
    moduleType,
    questionSource,
    questionId,
    durationSeconds,
    isCorrect: hasScore ? score >= 65 : false,
    score: score ?? null,
    updateWrongBook: hasScore,
  });
}
