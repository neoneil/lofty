import { requireUser } from "@/lib/auth/require-user";
import { PTE_QUESTION_INFO_SELECT, PTE_RL_WITH_STATUS_SELECT } from "@/lib/pte/select-fields";
import RlPageClient from "./rl-page-client";

type RlQuestion = {
  id: string;
  question_type: string;
  source_platform: string | null;
  source_question_id: string | null;
  title: string | null;
  question_title: string | null;
  question_text: string | null;
  audio_url: string | null;
  source_audio_url: string | null;
  storage_path: string | null;
  image_url: string | null;
  question_image_url: string | null;
  original_text: string | null;
  transcript: string | null;
  answer_info: string | null;
  ai_keywords: string | null;
  keywords: string | null;
  difficulty_level: string | null;
  is_prediction: boolean | null;
  is_real_exam: boolean | null;
  is_active: boolean | null;
  tag1: number | null;
  tag2: number | null;
  tag3: number | null;
  tag4: number | null;
  created_at: string;
  updated_at: string;
  search_text: string | null;

  is_practiced: boolean;
  attempt_count: number;
  correct_count: number;
  wrong_count: number;
  last_attempt_at: string | null;
  latest_score: number | null;
  best_score: number | null;
  is_wrong_question: boolean;
};

function chunkIds(ids: string[], size: number) {
  const chunks: string[][] = [];
  for (let index = 0; index < ids.length; index += size) {
    chunks.push(ids.slice(index, index + size));
  }
  return chunks;
}

export default async function PteSpeakingRlPage() {
  const { supabase } = await requireUser("/pte/speaking/rl");

  const { data: questionsData, error: questionsError } = await supabase
    .schema("views")
    .from("v_pte_rl_with_user_status")
    .select(PTE_RL_WITH_STATUS_SELECT)
    .eq("question_type", "RL")
    .order("created_at", { ascending: false })
    .limit(1500);

  const transcriptById = new Map<string, string | null>();
  const questionIds = (questionsData ?? []).map((question) => question.id);

  for (const ids of chunkIds(questionIds, 100)) {
    const { data: transcriptRows } = await supabase
      .schema("pte")
      .from("rl")
      .select("id, transcript")
      .in("id", ids);

    for (const row of transcriptRows ?? []) {
      transcriptById.set(row.id, row.transcript ?? null);
    }
  }

  const questions = (questionsData ?? []).map((q) => ({
    ...q,
    transcript: transcriptById.get(q.id) ?? null,
    is_practiced: q.is_practiced ?? false,
    attempt_count: q.attempt_count ?? 0,
    correct_count: q.correct_count ?? 0,
    wrong_count: q.wrong_count ?? 0,
    last_attempt_at: q.last_attempt_at ?? null,
    latest_score: q.latest_score ?? null,
    best_score: q.best_score ?? null,
    is_wrong_question: q.is_wrong_question ?? false,
  })) as RlQuestion[];

  const { data: questionInfo } = await supabase
    .from("all_question_info")
    .select(PTE_QUESTION_INFO_SELECT)
    .eq("questions", "RL")
    .single();

  return (
    <>
      {questionsError ? (
        <section className="round border border-[color:var(--danger)]/30 bg-[var(--danger-soft)] p-5 text-[var(--danger)] shadow-sm">
          RL 加载失败：{questionsError.message}
        </section>
      ) : (
        <div className="mt-1">
          <RlPageClient questions={questions} questionInfo={questionInfo} />
        </div>
      )}
    </>
  );
}
