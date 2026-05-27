import { requireUser } from "@/lib/auth/require-user";

import FibrwPageClient from "./fibrw-page-client";

type FibrwQuestionWithStatus = {
  id: string;

  question_title: string;

  question_body_text: string;

  question_type: string;

  source_platform: string;

  difficulty_level: string | null;

  tags: string[];

  is_prediction: boolean;

  is_real_exam: boolean;

  blanks_json: {
    answer: string;
    options: string[];
    blank_index: number;
  }[];

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

export default async function PteReadingFibrwPage() {

  const { supabase } =
    await requireUser(
      "/pte/reading/fibrw",
    );

  const {
    data: questionsData,
    error: questionsError,
  } = await supabase
    .schema("views")
    .from(
      "v_pte_fibrw_with_user_status",
    )
    .select("*")
    .eq("question_type", "FIBRW")
    .order("created_at", {
      ascending: false,
    })
    .limit(1500);

  const questions = (
    questionsData ?? []
  ).map((q) => ({
    ...q,

    is_practiced:
      q.is_practiced ?? false,

    attempt_count:
      q.attempt_count ?? 0,

    correct_count:
      q.correct_count ?? 0,

    wrong_count:
      q.wrong_count ?? 0,

    completed_count:
      q.completed_count ?? 0,

    last_attempt_at:
      q.last_attempt_at ?? null,

    latest_score:
      q.latest_score ?? null,

    best_score:
      q.best_score ?? null,

    is_wrong_question:
      q.is_wrong_question ?? false,
  })) as FibrwQuestionWithStatus[];

  const { data: questionInfo } =
    await supabase
      .from("all_question_info")
      .select("*")
      .eq("questions", "FIBRW")
      .single();

  return (
    <>
      {questionsError ? (
        <section className="round border border-red-200 bg-red-50 p-5 text-red-600 shadow-sm">
          FIB-RW 加载失败：
          {
            questionsError.message
          }
        </section>
      ) : (
        <div className="">
          <FibrwPageClient
            questions={questions}
            questionInfo={
              questionInfo
            }
          />
        </div>
      )}
    </>
  );
}