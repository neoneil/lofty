// app/pte/listening/hiw/page.tsx

import Container from "@/components/site/container";
import { requireUser } from "@/lib/auth/require-user";
import HiwPracticeList from "./hiw-practice-list";

type HiwIncorrectWord = {
  index: number;
  shown_word: string;
  correct_word: string;
};

type HiwQuestionWithStatus = {
  id: number;
  source_question_id: string | null;
  question_category: string | null;
  question_type: string;
  question_text: string;
  instruction_text: string | null;
  question_body_text: string | null;
  incorrect_words_json: HiwIncorrectWord[] | null;

  is_prediction: boolean | null;
  difficulty_level: string | null;
  is_real_exam: boolean | null;
  audio_url: string | null;
  audio_duration_seconds: number | null;
  created_at: string;
  updated_at: string;

  is_practiced: boolean;
  attempt_count: number;
  correct_count: number;
  wrong_count: number;
  last_attempt_at: string | null;
  latest_score: number | null;
  best_score: number | null;
  is_wrong_question: boolean;
  // is_favorite?: boolean;
};

export default async function PteListeningHiwPage() {
  const { supabase } = await requireUser("/pte/listening/hiw");

  const { data: questionsData, error: questionsError } = await supabase
    .schema("pte")
    .from("hiw")
    .select("*")
    .eq("question_type", "HIW")
    .eq("is_prediction", true)
    .order("created_at", { ascending: false })
    .limit(500);

  const questions = (questionsData ?? []).map((q) => ({
    ...q,
    is_practiced: q.is_practiced ?? false,
    attempt_count: q.attempt_count ?? 0,
    correct_count: q.correct_count ?? 0,
    wrong_count: q.wrong_count ?? 0,
    last_attempt_at: q.last_attempt_at ?? null,
    latest_score: q.latest_score ?? null,
    best_score: q.best_score ?? null,
    is_wrong_question: q.is_wrong_question ?? false,
    // is_favorite: q.is_favorite ?? false,
  })) as HiwQuestionWithStatus[];

  return (
    <main className="pb-10 pt-6 sm:pb-12 sm:pt-8 lg:pb-16">
      <Container>
        {questionsError ? (
          <section className="round border border-red-200 bg-red-50 p-5 text-red-600 shadow-sm">
            HIW 加载失败：{questionsError.message}
          </section>
        ) : (
          <div className="mt-1">
            <section className="space-y-6">
              <section className="round border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--theme)]/80">
                  PTE Listening
                </p>

                <h1 className="text-2xl font-bold leading-tight tracking-tight text-[var(--theme)] lg:text-3xl">
                  HIW - Highlight Incorrect Words
                </h1>

                <p className="mt-4 max-w-3xl text-sm leading-8 text-gray-600 sm:text-base">
                  听录音并阅读文本，点击你认为与录音不一致的单词。提交后系统会根据
                  incorrect_words_json 自动判断漏选、错选和正确答案。
                </p>
              </section>

              <HiwPracticeList initialQuestions={questions} />
            </section>
          </div>
        )}
      </Container>
    </main>
  );
}