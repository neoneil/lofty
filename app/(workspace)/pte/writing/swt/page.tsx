import { loadPteQuestionBankPage, type PteQuestionBankPageProps } from "@/lib/pte/question-bank-page";
import { PTE_SWT_BANK_CONFIG } from "@/lib/pte/question-bank-presets";
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

export default async function PteWritingPage({ searchParams }: PteQuestionBankPageProps) {
  const { questionBank, questionInfo, filters, pagination } = await loadPteQuestionBankPage({
    route: "/pte/writing/swt",
    questionInfoKey: "SWT",
    config: PTE_SWT_BANK_CONFIG,
    searchParams,
  });

  return questionBank.error ? (
    <section className="round border border-[color:var(--danger)]/30 bg-[var(--danger-soft)] p-5 text-[var(--danger)] shadow-sm">
      SWT 加载失败：{questionBank.error.message}
    </section>
  ) : (
    <div>
      <SwtPageClient questions={questionBank.questions as unknown as SwtQuestionWithStatus[]} questionInfo={questionInfo} filters={filters} pagination={pagination} />
    </div>
  );
}
