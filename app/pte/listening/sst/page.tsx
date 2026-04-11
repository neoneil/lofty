import Container from "@/components/site/container";
import PTESidebar from "@/components/site/pte-sidebar";
import { requireUser } from "@/lib/auth/require-user";
import SstPracticeList from "./sst-practice-list";

type SstQuestionWithStatus = {
  id: number;
  question_text: string;
  source_question_id: string | null;
  question_type: string;
  is_prediction: boolean | null;
  difficulty_level: string | null;
  is_real_exam: boolean | null;
  has_original_audio: boolean | null;
  has_similar_audio: boolean | null;
  answer_text: string | null;
  transcript_text: string | null;
  created_at: string;
  updated_at: string;
  audio_url: string | null;
  teacher_video_url: string | null;
  source_audio_url: string | null;
  storage_path: string | null;

  is_practiced: boolean;
  attempt_count: number;
  correct_count: number;
  wrong_count: number;
  last_attempt_at: string | null;
  latest_score: number | null;
  best_score: number | null;
  is_wrong_question: boolean;
  is_favorite?: boolean;
};

export default async function PteListeningSstPage() {
  const { supabase } = await requireUser("/pte/listening/sst");

  const { data: questionsData, error: questionsError } = await supabase
    .from("v_pte_sst_with_user_status")
    .select("*")
    .eq("question_type", "SST")
    .eq("is_prediction", "true")
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
    is_favorite: q.is_favorite ?? false,
  })) as SstQuestionWithStatus[];

  return (
    <main className="pb-10 pt-6 sm:pb-12 sm:pt-8 lg:pb-16">
      <Container>
        {questionsError ? (
          <section className="rounded-[28px] border border-red-200 bg-red-50 p-5 text-red-600 shadow-sm">
            SST 加载失败：{questionsError.message}
          </section>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)] 2xl:grid-cols-[260px_minmax(0,1fr)]">
            <div className="xl:sticky xl:top-24 xl:self-start">
              <PTESidebar currentMain="listening" currentSub="sst" />
            </div>

            <section className="space-y-6">
              <section className="rounded-[30px] border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--theme)]/80">
                  PTE Listening
                </p>
                <h1 className="text-2xl font-bold leading-tight tracking-tight text-[var(--theme)] lg:text-3xl">
                  SST - Summarize Spoken Text
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-8 text-gray-600 sm:text-base">
                  当前版本先支持音频播放、总结提交、练习统计与最近练习记录。
                  自动评分后续再接入。
                </p>
              </section>

              <SstPracticeList initialQuestions={questions} />
            </section>
          </div>
        )}
      </Container>
    </main>
  );
}