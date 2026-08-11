import { loadPteQuestionBankPage, type PteQuestionBankPageProps } from "@/lib/pte/question-bank-page";
import { PTE_RTS_BANK_CONFIG } from "@/lib/pte/question-bank-presets";
import RtsPageClient from "./rts-page-client";

export type RtsQuestion = {
  id: string;
  question_type: string;
  source_platform: string | null;
  source_question_id: string | null;
  question_num: string | null;
  title: string | null;
  question_title: string | null;
  question_text: string | null;
  question_info: string | null;
  question_info_2: string | null;
  audio_url: string | null;
  answer_info: string | null;
  ai_keywords: string | null;
  tag_topic: string | null;
  difficulty_level: string | null;
  is_prediction: boolean | null;
  is_real_exam: boolean | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
  search_text?: string | null;
  is_practiced: boolean;
  attempt_count: number;
  correct_count: number;
  wrong_count: number;
  last_attempt_at: string | null;
  latest_score: number | null;
  best_score: number | null;
  is_wrong_question: boolean;
};

export default async function PteSpeakingRtsPage({ searchParams }: PteQuestionBankPageProps) {
  const { questionBank, questionInfo, filters, pagination } = await loadPteQuestionBankPage({
    route: "/pte/speaking/rts",
    questionInfoKey: "RTS",
    config: PTE_RTS_BANK_CONFIG,
    searchParams,
  });

  return questionBank.error ? (
    <section className="round border border-[color:var(--danger)]/30 bg-[var(--danger-soft)] p-5 text-[var(--danger)] shadow-sm">
      RTS 加载失败：{questionBank.error.message}
    </section>
  ) : (
    <div className="mt-1">
      <RtsPageClient questions={questionBank.questions as unknown as RtsQuestion[]} questionInfo={questionInfo} filters={filters} pagination={pagination} />
    </div>
  );
}
