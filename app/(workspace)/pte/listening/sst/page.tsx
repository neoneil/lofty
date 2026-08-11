import { loadPteQuestionBankPage, type PteQuestionBankPageProps } from "@/lib/pte/question-bank-page";
import { PTE_SST_BANK_CONFIG } from "@/lib/pte/question-bank-presets";
import SstPageClient from "./sst-page-client";

type SstQuestionWithStatus = {
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

export default async function PteListeningPage({ searchParams }: PteQuestionBankPageProps) {
  const { questionBank, questionInfo, filters, pagination } = await loadPteQuestionBankPage({
    route: "/pte/listening/sst",
    questionInfoKey: "SST",
    config: PTE_SST_BANK_CONFIG,
    searchParams,
  });

  return questionBank.error ? (
    <section className="round border border-[var(--danger)]/25 bg-[var(--danger-soft)] p-5 text-[var(--danger)] shadow-[var(--shadow-sm)]">
      SST 加载失败：{questionBank.error.message}
    </section>
  ) : (
    <div className="">
      <SstPageClient questions={questionBank.questions as unknown as SstQuestionWithStatus[]} questionInfo={questionInfo} filters={filters} pagination={pagination} />
    </div>
  );
}
