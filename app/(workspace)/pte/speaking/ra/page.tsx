import { requireUser } from "@/lib/auth/require-user";
import { PTE_QUESTION_INFO_SELECT } from "@/lib/pte/select-fields";
import {
  PTE_QUESTION_BANK_PAGE_SIZE,
  loadPaginatedPteQuestionBank,
} from "@/lib/pte/question-bank-server";
import { parsePteQuestionBankFilters } from "@/lib/pte/question-bank-pagination";
import { createAdminClient } from "@/lib/supabase/admin";
import { PTE_RA_BANK_CONFIG } from "@/lib/pte/question-bank-presets";
import { applyPteQuestionStatus, loadPteQuestionStatusMap } from "@/lib/pte/question-status";
import { RA_PRONUNCIATION_DRILLS } from "@/content/pte/ra-pronunciation-drills";
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
  const databaseFilters = { ...filters, page: Math.max(1, filters.page - 2) };

  const [questionBank, { data: questionInfo }, staticStatusMap] = await Promise.all([
    loadPaginatedPteQuestionBank({
      supabase,
      admin,
      userId: user.id,
      filters: databaseFilters,
      config: PTE_RA_BANK_CONFIG,
    }),
    supabase
      .from("all_question_info")
      .select(PTE_QUESTION_INFO_SELECT)
      .eq("questions", "RA")
      .single(),
    filters.page <= 2
      ? loadPteQuestionStatusMap({
          admin,
          userId: user.id,
          questionSource: "ra",
          questionIds: RA_PRONUNCIATION_DRILLS.map((question) => question.id),
        })
      : Promise.resolve(new Map()),
  ]);

  const staticQuestions = RA_PRONUNCIATION_DRILLS.map((question) =>
    applyPteQuestionStatus(
      {
        id: question.id,
        question_text: question.question_text,
        question_type: "RA",
        source_platform: "lofty-static",
        source_question_id: `RA-PRON-${question.id.slice(-3)}`,
        difficulty_level: null,
        tags: question.tags,
        is_prediction: true,
        audio_url: null,
        audio_duration_seconds: null,
        ai_voice: null,
        usage_count: null,
        created_at: "2026-09-20T00:00:00.000Z",
        updated_at: "2026-09-20T00:00:00.000Z",
        is_real_exam: false,
      },
      staticStatusMap.get(question.id),
    ),
  );
  const totalPages = 2 + questionBank.totalPages;
  const currentPage = filters.page <= 2 ? filters.page : 2 + questionBank.currentPage;
  const questions = currentPage <= 2
    ? staticQuestions.slice((currentPage - 1) * PTE_QUESTION_BANK_PAGE_SIZE, currentPage * PTE_QUESTION_BANK_PAGE_SIZE)
    : questionBank.questions;

  return (
    <>
      {questionBank.error ? (
        <section className="round border border-[color:var(--danger)]/30 bg-[var(--danger-soft)] p-5 text-[var(--danger)] shadow-sm">
          RA 加载失败：{questionBank.error.message}
        </section>
      ) : (
        <div className="mt-1">
          <RaPageClient
            questions={questions as RaQuestionWithStatus[]}
            questionInfo={questionInfo}
            filters={filters}
            pagination={{
              currentPage,
              pageSize: PTE_QUESTION_BANK_PAGE_SIZE,
              totalCount: RA_PRONUNCIATION_DRILLS.length + questionBank.totalCount,
              totalPages,
            }}
          />
        </div>
      )}
    </>
  );
}
