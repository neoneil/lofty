import { loadPteQuestionBankPage, type PteQuestionBankPageProps } from "@/lib/pte/question-bank-page";
import { PTE_RO_BANK_CONFIG } from "@/lib/pte/question-bank-presets";
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

export default async function PteReadingRoPage({ searchParams }: PteQuestionBankPageProps) {
  const { questionBank, questionInfo, filters, pagination } = await loadPteQuestionBankPage({
    route: "/pte/reading/ro",
    questionInfoKey: "RO",
    config: PTE_RO_BANK_CONFIG,
    searchParams,
  });

  return questionBank.error ? (
    <section className="round border border-[color:var(--danger)]/30 bg-[var(--danger-soft)] p-5 text-[var(--danger)] shadow-sm">
      RO 加载失败：{questionBank.error.message}
    </section>
  ) : (
    <div className="">
      <RoPageClient questions={questionBank.questions as unknown as RoQuestionWithStatus[]} questionInfo={questionInfo} filters={filters} pagination={pagination} />
    </div>
  );
}
