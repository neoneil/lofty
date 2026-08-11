import { loadPteQuestionBankPage, type PteQuestionBankPageProps } from "@/lib/pte/question-bank-page";
import { PTE_RS_BANK_CONFIG } from "@/lib/pte/question-bank-presets";
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
  const { questionBank, questionInfo, filters, pagination } = await loadPteQuestionBankPage({
    route: "/pte/speaking/rs",
    questionInfoKey: "RS",
    config: PTE_RS_BANK_CONFIG,
    searchParams,
  });

  return questionBank.error ? (
    <section className="round border border-[color:var(--danger)]/30 bg-[var(--danger-soft)] p-5 text-[var(--danger)] shadow-sm">
      RS 加载失败：{questionBank.error.message}
    </section>
  ) : (
    <div className="mt-1">
      <RsPageClient questions={questionBank.questions as unknown as RSQuestionWithStatus[]} questionInfo={questionInfo} filters={filters} pagination={pagination} />
    </div>
  );
}
