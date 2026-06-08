import { requireUser } from "@/lib/auth/require-user";
import SgdPageClient from "./sgd-page-client";

export type SgdQuestion = {
  id: string;
  question_type: string;
  source_platform: string | null;
  source_question_id: string | null;
  question_num: string | null;
  title: string | null;
  question_title: string | null;
  question_text: string | null;
  audio_url: string | null;
  source_audio_url: string | null;
  storage_path: string | null;
  answer_info: string | null;
  answer_info_html: string | null;
  original_text: string | null;
  question_info: string | null;
  ai_keywords: string | null;
  keywords: string | null;
  tag_topic: string | null;
  difficulty_level: string | null;
  is_prediction: boolean | null;
  is_real_exam: boolean | null;
  is_active: boolean | null;
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

export default async function PteSpeakingSgdPage() {
  const { supabase } = await requireUser("/pte/speaking/sgd");

  const { data: questionsData, error: questionsError } = await supabase
    .schema("views")
    .from("v_pte_sgd_with_user_status")
    .select("*")
    .eq("question_type", "SGD")
    .order("created_at", { ascending: false })
    .limit(1500);

  const questions = (questionsData ?? []) as SgdQuestion[];

  const { data: questionInfo } = await supabase
    .from("all_question_info")
    .select("*")
    .eq("questions", "SGD")
    .single();

  return questionsError ? (
    <section className="round border border-[color:var(--danger)]/30 bg-[var(--danger-soft)] p-5 text-[var(--danger)] shadow-sm">
      SGD 加载失败：{questionsError.message}
    </section>
  ) : (
    <div className="mt-1">
      <SgdPageClient questions={questions} questionInfo={questionInfo} />
    </div>
  );
}
