
import { requireUser } from "@/lib/auth/require-user";
import { PTE_QUESTION_INFO_SELECT, PTE_WFD_WITH_STATUS_SELECT } from "@/lib/pte/select-fields";
import WfdPageClient from "./wfd-page-client";
type WfdQuestionWithStatus = {
  id: string;
  question_text: string;
  question_type: string;
  source_platform: string | null;
  source_question_id: string | null;
  difficulty_level: string | null;
  tags: string[] | null;
  is_prediction: boolean | null;
  audio_url: string | null;
  audio_duration_seconds: number | null;
  ai_voice: string | null;
  usage_count: number | null;
  created_at: string;
  updated_at: string;
  is_real_exam: boolean | null;

  is_practiced: boolean;
  attempt_count: number;
  correct_count: number;
  wrong_count: number;
  completed_count: number;
  last_attempt_at: string | null;
  latest_score: number | null;
  best_score: number | null;
  is_wrong_question: boolean;
};

export default async function PteListeningPage() {
  const { supabase } = await requireUser("/pte/listening/wfd");

  const { data: questionsData, error: questionsError } = await supabase
    .schema("views")
    .from("v_pte_wfd_with_user_status")
    .select(PTE_WFD_WITH_STATUS_SELECT)
    .eq("question_type", "WFD")
    // .eq("is_prediction", true)
    .order("created_at", { ascending: false })
    .limit(1500);

  const questions = (questionsData ?? []).map((q) => ({
    ...q,
    is_practiced: q.is_practiced ?? false,
    attempt_count: q.attempt_count ?? 0,
    correct_count: q.correct_count ?? 0,
    wrong_count: q.wrong_count ?? 0,
    completed_count: 0,
    last_attempt_at: q.last_attempt_at ?? null,
    latest_score: q.latest_score ?? null,
    best_score: q.best_score ?? null,
    is_wrong_question: q.is_wrong_question ?? false,
  })) as WfdQuestionWithStatus[];

  const { data: questionInfo } = await supabase
    .from("all_question_info")
    .select(PTE_QUESTION_INFO_SELECT)
    .eq("questions", "WFD")
    .single();

  return (
    <>
        {questionsError ? (
          <section className="round border border-red-200 bg-red-50 p-5 text-red-600 shadow-sm">
            WFD 加载失败：{questionsError.message}
          </section>
        ) : (
          <div className="mt-1">
            <WfdPageClient
              questions={questions}
              questionInfo={questionInfo}
            />
          </div>
        )}
    </>
  );
}
