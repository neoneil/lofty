import { requireUser } from "@/lib/auth/require-user";
import { PTE_QUESTION_INFO_SELECT, PTE_RA_BASE_SELECT } from "@/lib/pte/select-fields";
import {
  PTE_QUESTION_BANK_PAGE_SIZE,
  loadPaginatedPteQuestionBank,
} from "@/lib/pte/question-bank-server";
import { parsePteQuestionBankFilters } from "@/lib/pte/question-bank-pagination";
import { createAdminClient } from "@/lib/supabase/admin";
import RaPageClient from "./ra-page-client";

type RaQuestionWithStatus = {
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

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PteSpeakingPage({ searchParams }: PageProps) {
  const { supabase, user } = await requireUser("/pte/speaking/ra");
  const admin = createAdminClient();
  const filters = parsePteQuestionBankFilters(await searchParams);

  const [questionBank, { data: questionInfo }] = await Promise.all([
    loadPaginatedPteQuestionBank({
      supabase,
      admin,
      userId: user.id,
      filters,
      config: {
        table: "ra",
        questionSource: "ra",
        questionType: "RA",
        select: PTE_RA_BASE_SELECT,
        searchColumn: "question_body_text",
        normalizeQuestion: (q) => ({
          ...q,
          question_text: String(q.question_body_text ?? ""),
          audio_url: null,
          audio_duration_seconds: null,
          ai_voice: null,
          usage_count: null,
        }) as RaQuestionWithStatus,
      },
    }),
    supabase
      .from("all_question_info")
      .select(PTE_QUESTION_INFO_SELECT)
      .eq("questions", "RA")
      .single(),
  ]);

  return (
    <>
      {questionBank.error ? (
        <section className="round border border-[color:var(--danger)]/30 bg-[var(--danger-soft)] p-5 text-[var(--danger)] shadow-sm">
          RA 加载失败：{questionBank.error.message}
        </section>
      ) : (
        <div className="mt-1">
          <RaPageClient
            questions={questionBank.questions as RaQuestionWithStatus[]}
            questionInfo={questionInfo}
            filters={filters}
            pagination={{
              currentPage: questionBank.currentPage,
              pageSize: PTE_QUESTION_BANK_PAGE_SIZE,
              totalCount: questionBank.totalCount,
              totalPages: questionBank.totalPages,
            }}
          />
        </div>
      )}
    </>
  );
}
