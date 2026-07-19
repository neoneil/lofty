import { requireUser } from "@/lib/auth/require-user";
import { PTE_FIBR_WITH_STATUS_SELECT, PTE_QUESTION_INFO_SELECT } from "@/lib/pte/select-fields";

import FibrPageClient from "./fibr-page-client";

type FibrQuestionWithStatus = {
  id: string;
  question_title: string;
  question_body_text: string;
  question_type: string;
  source_platform: string;
  difficulty_level: number | null;
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

export default async function PteReadingFibrPage() {
  const { supabase } =
    await requireUser(
      "/pte/reading/fibr",
    );

  const {
    data: questionsData,
    error: questionsError,
  } = await supabase
    .schema("views")
    .from(
      "v_pte_fibr_with_user_status",
    )
    .select(PTE_FIBR_WITH_STATUS_SELECT)
    .eq("question_type", "FIBR")
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
  })) as FibrQuestionWithStatus[];

  const { data: questionInfo } =
    await supabase
      .from("all_question_info")
      .select(PTE_QUESTION_INFO_SELECT)
      .eq("questions", "FIBR")
      .single();

  return (
    <>
      {questionsError ? (
        <section className="round border border-[color:var(--danger)]/30 bg-[var(--danger-soft)] p-5 text-[var(--danger)] shadow-sm">
          FIB-R 加载失败：
          {
            questionsError.message
          }
        </section>
      ) : (
        <div className="">
          <FibrPageClient
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
