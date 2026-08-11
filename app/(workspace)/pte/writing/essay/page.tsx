import { loadPteQuestionBankPage, type PteQuestionBankPageProps } from "@/lib/pte/question-bank-page";
import { PTE_WE_BANK_CONFIG } from "@/lib/pte/question-bank-presets";
import EssayPageClient from "./essay-page-client";

type EssayQuestionWithStatus = {
  id: string;
  question_text: string;
  question_type: string;
  response_type: string | null;
  is_prediction: boolean | null;
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

export default async function PteWritingPage({ searchParams }: PteQuestionBankPageProps) {
  const { questionBank, questionInfo, filters, pagination } = await loadPteQuestionBankPage({
    route: "/pte/writing/essay",
    questionInfoKey: "WE",
    config: PTE_WE_BANK_CONFIG,
    searchParams,
  });

  return questionBank.error ? (
    <section className="round border border-[color:var(--danger)]/30 bg-[var(--danger-soft)] p-5 text-[var(--danger)] shadow-sm">
      Essay 加载失败：{questionBank.error.message}
    </section>
  ) : (
    <div className="mt-1">
      <EssayPageClient questions={questionBank.questions as unknown as EssayQuestionWithStatus[]} questionInfo={questionInfo} filters={filters} pagination={pagination} />
    </div>
  );
}
