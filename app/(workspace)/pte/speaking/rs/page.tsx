import type { PteQuestionBankPageProps } from "@/lib/pte/question-bank-page";
import { PTE_RS_BANK_CONFIG } from "@/lib/pte/question-bank-presets";
import { PTE_QUESTION_INFO_SELECT } from "@/lib/pte/select-fields";
import { PTE_QUESTION_BANK_PAGE_SIZE, loadPaginatedPteQuestionBank } from "@/lib/pte/question-bank-server";
import { parsePteQuestionBankFilters } from "@/lib/pte/question-bank-pagination";
import { requireUser } from "@/lib/auth/require-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyPteQuestionStatus, loadPteQuestionStatusMap } from "@/lib/pte/question-status";
import { getPteAiAudioRelativePath, PTE_AI_AUDIO_DEFAULT_VOICE } from "@/lib/pte-ai-audio/voices";
import { RS_CORE_DRILLS } from "@/content/pte/rs-core-drills";
import RsPageClient from "./rs-page-client";

type RSQuestionWithStatus = {
  id: string;
  question_text: string;
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

export default async function PteSpeakingPage({ searchParams }: PteQuestionBankPageProps) {
  const { supabase, user } = await requireUser("/pte/speaking/rs");
  const admin = createAdminClient();
  const filters = parsePteQuestionBankFilters(await searchParams);
  const databaseFilters = { ...filters, page: Math.max(1, filters.page - 8) };
  const [questionBank, { data: questionInfo }, staticStatusMap] = await Promise.all([
    loadPaginatedPteQuestionBank({ supabase, admin, userId: user.id, filters: databaseFilters, config: PTE_RS_BANK_CONFIG }),
    supabase.from("all_question_info").select(PTE_QUESTION_INFO_SELECT).eq("questions", "RS").single(),
    filters.page <= 8
      ? loadPteQuestionStatusMap({ admin, userId: user.id, questionSource: "rs", questionIds: RS_CORE_DRILLS.map((question) => question.id) })
      : Promise.resolve(new Map()),
  ]);

  const staticQuestions = RS_CORE_DRILLS.map((question) => applyPteQuestionStatus({
    id: question.id,
    question_text: question.question_text,
    question_type: "RS",
    source_question_id: `RS-CORE-${question.id.slice(-3)}`,
    difficulty_level: null,
    is_prediction: true,
    audio_url: getPteAiAudioRelativePath("rs", question.id, PTE_AI_AUDIO_DEFAULT_VOICE),
    audio_duration_seconds: null,
    ai_voice: PTE_AI_AUDIO_DEFAULT_VOICE,
    usage_count: null,
    created_at: "2026-09-20T00:00:00.000Z",
    updated_at: "2026-09-20T00:00:00.000Z",
    is_real_exam: false,
  }, staticStatusMap.get(question.id)));
  const totalPages = 8 + questionBank.totalPages;
  const currentPage = filters.page <= 8 ? filters.page : 8 + questionBank.currentPage;
  const questions = currentPage <= 8
    ? staticQuestions.slice((currentPage - 1) * PTE_QUESTION_BANK_PAGE_SIZE, currentPage * PTE_QUESTION_BANK_PAGE_SIZE)
    : questionBank.questions;

  return questionBank.error ? (
    <section className="round border border-[color:var(--danger)]/30 bg-[var(--danger-soft)] p-5 text-[var(--danger)] shadow-sm">
      RS 加载失败：{questionBank.error.message}
    </section>
  ) : (
    <div className="mt-1">
      <RsPageClient
        questions={questions as unknown as RSQuestionWithStatus[]}
        questionInfo={questionInfo}
        filters={filters}
        pagination={{
          currentPage,
          pageSize: PTE_QUESTION_BANK_PAGE_SIZE,
          totalCount: RS_CORE_DRILLS.length + questionBank.totalCount,
          totalPages,
        }}
      />
    </div>
  );
}
