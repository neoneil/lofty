
import Container from "@/components/site/container";
import PTESidebar from "@/components/site/pte-sidebar";
import { requireUser } from "@/lib/auth/require-user";
import RsPracticeList from "./rs-practice-list";

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

export default async function PteSpeakingPage() {
  const { supabase } = await requireUser("/pte/speaking/rs");

  const { data: questionsData, error: questionsError } = await supabase
    .schema("views")   
    .from("v_pte_rs_with_user_status")
    .select("*")
    .eq("question_type", "RS")
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
  })) as RSQuestionWithStatus[];

  return (
    <main className="pb-10 pt-6 sm:pb-12 sm:pt-8 lg:pb-16">
      <Container>
        {questionsError ? (
          <section className="rounded-[28px] border border-red-200 bg-red-50 p-5 text-red-600 shadow-sm">
            RA 加载失败：{questionsError.message}
          </section>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)] 2xl:grid-cols-[260px_minmax(0,1fr)] mt-5">
            <div className="xl:sticky xl:top-24 xl:self-start">
              <PTESidebar currentMain="speaking" currentSub="rs" />
            </div>

            <section className="space-y-6">
              <section className="rounded-[30px] border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--theme)]/80">
                  PTE Speaking
                </p>
                <h1 className="text-2xl font-bold leading-tight tracking-tight text-[var(--theme)] lg:text-3xl">
                  RA - Repeat Sentence
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-8 text-gray-600 sm:text-base">
                  本题型评分规则：Speaking
                </p>
              </section>

              <RsPracticeList initialQuestions={questions} />
            </section>
          </div>
        )}
      </Container>
    </main>
  );
}

