import { requireUser } from "@/lib/auth/require-user";
import RoPageClient from "./ro-page-client";

type RoQuestionWithStatus = {
  id: string;
  question_title: string;
  source_question_id: string | null;
  difficulty_level: number | null;
  is_prediction: boolean | null;
  sentence_count: number;
  question_body_text: string[];
  created_at: string;
  updated_at: string;

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

export default async function PteReadingRoPage() {
  const { supabase } = await requireUser("/pte/reading/ro");

  const { data: questionsData, error: questionsError } = await supabase
    .schema("views")
    .from("v_pte_ro_with_user_status")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1500);

  const questions = (questionsData ?? []).map((q) => ({
    ...q,
    is_practiced: q.is_practiced ?? false,
    attempt_count: q.attempt_count ?? 0,
    correct_count: q.correct_count ?? 0,
    wrong_count: q.wrong_count ?? 0,
    completed_count: q.completed_count ?? 0,
    last_attempt_at: q.last_attempt_at ?? null,
    latest_score: q.latest_score ?? null,
    best_score: q.best_score ?? null,
    is_wrong_question: q.is_wrong_question ?? false,
  })) as RoQuestionWithStatus[];

  const { data: questionInfo } = await supabase
    .from("all_question_info")
    .select("*")
    .eq("questions", "RO")
    .single();

  return (
    <>
      {questionsError ? (
        <section className="round border border-red-200 bg-red-50 p-5 text-red-600 shadow-sm">
          RO 加载失败：{questionsError.message}
        </section>
      ) : (
        <div className="">
          <RoPageClient
            questions={questions}
            questionInfo={questionInfo}
          />
        </div>
      )}
    </>
  );
}