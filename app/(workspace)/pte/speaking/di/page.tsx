import { requireUser } from "@/lib/auth/require-user";
import DiPageClient from "./di-page-client";

type DiQuestionWithStatus = {
  id: string;
  question_type: string;
  source_platform: string | null;
  title: string | null;
  question_text: string | null;
  image_url: string | null;
  answer_info: string | null;
  video_url: string | null;
  ai_keywords: string[] | null;
  difficulty_level: string | null;
  difficulty_raw: string | null;
  is_prediction: boolean | null;
  is_real_exam: boolean | null;
  is_active: boolean | null;
  tag1: string | null;
  tag2: string | null;
  tag3: string | null;
  tag4: string | null;
  raw_json: unknown;
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

export default async function PteSpeakingDiPage() {
  const { supabase } = await requireUser("/pte/speaking/di");

  const { data: questionsData, error: questionsError } = await supabase
    .schema("views")
    .from("v_pte_di_with_user_status")
    .select("*")
    .eq("question_type", "DI")
    .order("created_at", { ascending: false })
    .limit(1500);

  const questions = (questionsData ?? []).map((q) => ({
    ...q,
    is_practiced: q.is_practiced ?? false,
    attempt_count: q.attempt_count ?? 0,
    correct_count: q.correct_count ?? 0,
    wrong_count: q.wrong_count ?? 0,
    last_attempt_at: q.last_attempt_at ?? null,
    latest_score: q.latest_score ?? null,
    best_score: q.best_score ?? null,
    is_wrong_question: q.is_wrong_question ?? false,
  })) as DiQuestionWithStatus[];

  const { data: questionInfo } = await supabase
    .from("all_question_info")
    .select("*")
    .eq("questions", "DI")
    .single();

  return (
    <>
      {questionsError ? (
        <section className="round border border-red-200 bg-red-50 p-5 text-red-600 shadow-sm">
          DI 加载失败：{questionsError.message}
        </section>
      ) : (
        <div className="mt-1">
          <DiPageClient questions={questions} questionInfo={questionInfo} />
        </div>
      )}
    </>
  );
}
