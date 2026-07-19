import { requireUser } from "@/lib/auth/require-user";
import { PTE_ASQ_WITH_STATUS_SELECT, PTE_QUESTION_INFO_SELECT } from "@/lib/pte/select-fields";
import AsqPageClient from "./asq-page-client";

type ASQQuestionWithStatus = {
  id: string;
  question_text: string | null;
  answer_text: string | null;
  question_type: string;
  source_question_id: string | null;
  difficulty_level: string | null;
  is_prediction: boolean | null;
  audio_url: string | null;
  audio_duration_seconds: number | null;
  created_at: string;
  updated_at: string;
  is_real_exam: boolean | null;

  is_practiced: boolean;
  attempt_count: number;
  correct_count: number;
  wrong_count: number;
  last_attempt_at: string | null;
  latest_score: number | null;
  best_score: number | null;
  is_wrong_question: boolean;
};

export default async function PteAsqPage() {
  const { supabase } = await requireUser("/pte/speaking/asq");

  const { data: questionsData, error: questionsError } = await supabase
    .schema("views")
    .from("v_pte_asq_with_user_status")
    .select(PTE_ASQ_WITH_STATUS_SELECT)
    .eq("question_type", "ASQ")
    .order("created_at", { ascending: false })
    .limit(1500);

  const questions = (questionsData ?? []).map((q) => ({
    ...q,
    question_text: q.question_text ?? null,
    answer_text: q.answer_text ?? null,
    source_question_id: null,
    difficulty_level: null,
    audio_url: null,
    audio_duration_seconds: null,
    is_real_exam: null,
    is_practiced: q.is_practiced ?? false,
    attempt_count: q.attempt_count ?? 0,
    correct_count: q.correct_count ?? 0,
    wrong_count: q.wrong_count ?? 0,
    last_attempt_at: q.last_attempt_at ?? null,
    latest_score: q.latest_score ?? null,
    best_score: q.best_score ?? null,
    is_wrong_question: q.is_wrong_question ?? false,
  })) as ASQQuestionWithStatus[];

  const { data: questionInfo } = await supabase
    .from("all_question_info")
    .select(PTE_QUESTION_INFO_SELECT)
    .eq("questions", "ASQ")
    .single();

  return (
    <>
      {questionsError ? (
        <section className="round border border-[color:var(--danger)]/30 bg-[var(--danger-soft)] p-5 text-[var(--danger)] shadow-sm">
          ASQ 加载失败：{questionsError.message}
        </section>
      ) : (
        <div className="mt-1">
          <AsqPageClient questions={questions} questionInfo={questionInfo} />
        </div>
      )}
    </>
  );
}
