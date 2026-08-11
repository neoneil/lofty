import "server-only";

import { requireUser } from "@/lib/auth/require-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { PTE_QUESTION_INFO_SELECT } from "@/lib/pte/select-fields";
import { parsePteQuestionBankFilters } from "@/lib/pte/question-bank-pagination";
import {
  PTE_QUESTION_BANK_PAGE_SIZE,
  loadPaginatedPteQuestionBank,
  type QuestionBankConfig,
  type QuestionRow,
} from "@/lib/pte/question-bank-server";

export type PteQuestionBankPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function loadPteQuestionBankPage<T extends QuestionRow>({
  route,
  questionInfoKey,
  config,
  searchParams,
}: {
  route: string;
  questionInfoKey: string;
  config: QuestionBankConfig<T>;
  searchParams: PteQuestionBankPageProps["searchParams"];
}) {
  const { supabase, user } = await requireUser(route);
  const admin = createAdminClient();
  const filters = parsePteQuestionBankFilters(await searchParams);

  const [questionBank, { data: questionInfo }] = await Promise.all([
    loadPaginatedPteQuestionBank({
      supabase,
      admin,
      userId: user.id,
      filters,
      config,
    }),
    supabase
      .from("all_question_info")
      .select(PTE_QUESTION_INFO_SELECT)
      .eq("questions", questionInfoKey)
      .single(),
  ]);

  return {
    filters,
    questionBank,
    questionInfo,
    pagination: {
      currentPage: questionBank.currentPage,
      pageSize: PTE_QUESTION_BANK_PAGE_SIZE,
      totalCount: questionBank.totalCount,
      totalPages: questionBank.totalPages,
    },
  };
}
