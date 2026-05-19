import Container from "@/components/site/container";
import Sidebar from "@/components/site/sidebar";
//import PTESidebar from "@/components/site/pte-sidebar";
import PTETopNav from "@/components/site/pte-top-nav";
import { requireUser } from "@/lib/auth/require-user";
import WfdPracticeList from "./wfd-practice-list";
import WfdList from "./wfd-list";
import QuestionInfoCard from "@/components/site/QuestionInfoCard";
import WfdPageClient from "./wfd-page-client";
type WfdQuestionWithStatus = {
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

export default async function PteListeningPage() {
  const { supabase } = await requireUser("/pte/listening/wfd");

  const { data: questionsData, error: questionsError } = await supabase
    .schema("views")
    .from("v_pte_wfd_with_user_status")
    .select("*")
    .eq("question_type", "WFD")
    // .eq("is_prediction", true)
    .order("created_at", { ascending: false })
    .limit(1500);

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
  })) as WfdQuestionWithStatus[];

  const { data: questionInfo } = await supabase
    .from("all_question_info")
    .select("*")
    .eq("questions", "WFD")
    .single();

  return (
    <main className="relative pb-10 pt-6 sm:pb-12 sm:pt-8 lg:pb-16">
      {/* background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <img
          src="/images/listeningPage.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center opacity-95" />
        <div className="absolute inset-0" />
      </div>

      <Container className="relative z-10">

        {questionsError ? (
          <section className="round border border-red-200 bg-red-50 p-5 text-red-600 shadow-sm">
            WFD 加载失败：{questionsError.message}
          </section>
        ) : (
          <div className="mt-5 grid gap-8 xl:grid-cols-[240px_minmax(0,1fr)] 2xl:grid-cols-[260px_minmax(0,1fr)]">
            {/* sidebar */}
            <div className="xl:sticky xl:top-24 xl:self-start">
              <Sidebar />
            </div>

            {/* right content */}
            <WfdPageClient
              questions={questions}
              questionInfo={questionInfo}
            />
            {/* <section
              className="mx-auto w-fit max-w-[1320px] space-y-5">
              <PTETopNav currentMain="listening" currentSub="wfd" />
              <QuestionInfoCard questionInfo={questionInfo} />
              <WfdList initialQuestions={questions} />
            </section> */}
          </div>
        )}
      </Container>
    </main>
  );
}

{/* <WfdPracticeList initialQuestions={questions} /> */ }