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
};

export default async function PteListeningHiwPage() {
  const { supabase, user } = await requireUser("/pte/listening/hiw");

  const { data: questionsData, error: questionsError } = await supabase
    .schema("pte")
    .from("hiw")
    .select("*")
    .eq("question_type", "HIW")
    .eq("is_prediction", true)
    .order("created_at", { ascending: false })
    .limit(500);

  const questionIds = (questionsData ?? []).map((q) => String(q.id));

  const { data: statsData } = questionIds.length
    ? await supabase
        .from("student_question_stats")
        .select("question_id,is_practiced,attempt_count,correct_count,wrong_count,last_attempt_at,latest_score,best_score,is_in_wrong_book")
        .eq("user_id", user.id)
        .eq("question_source", "hiw")
        .in("question_id", questionIds)
    : { data: [] };

  const statsByQuestionId = new Map((statsData ?? []).map((stat) => [stat.question_id, stat]));

  const questions = (questionsData ?? []).map((q) => {
    const stat = statsByQuestionId.get(String(q.id));

    return {
      ...q,
      is_practiced: stat?.is_practiced ?? false,
      attempt_count: stat?.attempt_count ?? 0,
      correct_count: stat?.correct_count ?? 0,
      wrong_count: stat?.wrong_count ?? 0,
      last_attempt_at: stat?.last_attempt_at ?? null,
      latest_score: stat?.latest_score ?? null,
      best_score: stat?.best_score ?? null,
      is_wrong_question: stat?.is_in_wrong_book ?? false,
    };
  }) as HiwQuestionWithStatus[];

  return (
    <>
      {questionsError ? (
        <section className="round border border-[var(--danger)]/25 bg-[var(--danger-soft)] p-5 text-[var(--danger)] shadow-[var(--shadow-sm)]">
          HIW 加载失败：{questionsError.message}
        </section>
      ) : (
        <HiwPracticeList initialQuestions={questions} />
      )}
    </>
  );
}
