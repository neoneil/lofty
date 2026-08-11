import { loadPteQuestionBankPage, type PteQuestionBankPageProps } from "@/lib/pte/question-bank-page";
import { PTE_FIBR_BANK_CONFIG } from "@/lib/pte/question-bank-presets";
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

export default async function PteReadingFibrPage({ searchParams }: PteQuestionBankPageProps) {
  const { questionBank, questionInfo, filters, pagination } = await loadPteQuestionBankPage({
    route: "/pte/reading/fibr",
    questionInfoKey: "FIBR",
    config: PTE_FIBR_BANK_CONFIG,
    searchParams,
  });

  return questionBank.error ? (
    <section className="round border border-[color:var(--danger)]/30 bg-[var(--danger-soft)] p-5 text-[var(--danger)] shadow-sm">
      FIB-R 加载失败：{questionBank.error.message}
    </section>
  ) : (
    <div className="">
      <FibrPageClient questions={questionBank.questions as unknown as FibrQuestionWithStatus[]} questionInfo={questionInfo} filters={filters} pagination={pagination} />
    </div>
  );
}
