import { loadPteQuestionBankPage, type PteQuestionBankPageProps } from "@/lib/pte/question-bank-page";
import { PTE_DI_BANK_CONFIG } from "@/lib/pte/question-bank-presets";
import DiPageClient from "./di-page-client";

type DiQuestionWithStatus = {
  id: string;
  question_type: string;
  source_platform: string | null;
  title: string | null;
  question_text: string | null;
  image_url: string | null;
  answer_info: string | null;
  video_url: string | null;
  ai_keywords: string | null;
  difficulty_level: string | null;
  difficulty_raw: string | null;
  is_prediction: boolean | null;
  is_real_exam: boolean | null;
  is_active: boolean | null;
  tag1: string | number | null;
  tag2: string | number | null;
  tag3: string | number | null;
  tag4: string | number | null;
  raw_json: unknown;
  created_at: string;
  updated_at: string;
  search_text: string | null;
  is_practiced: boolean;
  attempt_count: number;
  correct_count: number;
  wrong_count: number;
  last_attempt_at: string | null;
  latest_score: number | null;
  best_score: number | null;
  is_wrong_question: boolean;
};

export default async function PteSpeakingDiPage({ searchParams }: PteQuestionBankPageProps) {
  const { questionBank, questionInfo, filters, pagination } = await loadPteQuestionBankPage({
    route: "/pte/speaking/di",
    questionInfoKey: "DI",
    config: PTE_DI_BANK_CONFIG,
    searchParams,
  });

  return questionBank.error ? (
    <section className="round border border-[color:var(--danger)]/30 bg-[var(--danger-soft)] p-5 text-[var(--danger)] shadow-sm">
      DI 加载失败：{questionBank.error.message}
    </section>
  ) : (
    <div className="mt-1">
      <DiPageClient questions={questionBank.questions as unknown as DiQuestionWithStatus[]} questionInfo={questionInfo} filters={filters} pagination={pagination} />
    </div>
  );
}
