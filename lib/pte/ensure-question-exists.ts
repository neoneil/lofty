import type { SupabaseClient } from "@supabase/supabase-js";

type SupabaseQuestionClient = Pick<SupabaseClient, "schema">;

const QUESTION_TABLE_BY_SOURCE: Record<string, string> = {
  asq: "asq",
  di: "di",
  ra: "ra",
  rl: "rl",
  rs: "rs",
  rts: "rts",
  sgd: "sgd",
};

export async function ensurePteQuestionExists(supabase: SupabaseQuestionClient, questionSource: string, questionId: string) {
  const table = QUESTION_TABLE_BY_SOURCE[questionSource];
  if (!table) return false;

  const { data, error } = await supabase
    .schema("pte")
    .from(table)
    .select("id")
    .eq("id", questionId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}
