
import { requireUser } from "@/lib/auth/require-user";
import SwtPageClient from "./swt-page-client";
type SwtQuestionWithStatus = {
  id: string;
  question_title: string;
  question_text: string;
  question_type: string;
  difficulty_level: string | null;
  is_prediction: boolean | null;
  usage_count: number | null;
  created_at: string;
  updated_at: string;
  is_real_exam: boolean | null;
  source_question_id: string | null;
  answer: string | null;

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

export default async function PteWritingPage() {
  const { supabase } = await requireUser("/pte/writing/swt");

  const { data: questionsData, error: questionsError } = await supabase
    .schema("views")
    .from("v_pte_swt_with_user_status")
    .select("*")
    .eq("question_type", "SWT")
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
  })) as SwtQuestionWithStatus[];

  const { data: questionInfo } = await supabase
    .from("all_question_info")
    .select("*")
    .eq("questions", "SWT")
    .single();

  return (
    <>
        {questionsError ? (
          <section className="round border border-red-200 bg-red-50 p-5 text-red-600 shadow-sm">
            SWT 加载失败：{questionsError.message}
          </section>
        ) : (
          <div>
            <SwtPageClient
              questions={questions}
              questionInfo={questionInfo}
            />
          </div>
        )}
    </>
  );
}