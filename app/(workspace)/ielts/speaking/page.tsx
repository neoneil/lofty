import Container from "@/components/site/container";
import SpeakingBrowser from "@/components/site/speaking-browser";
import { requireUser } from "@/lib/auth/require-user";

type SpeakingPart1Question = {
  id: number;
  topic_title: string;
  question_number: number;
  question_text: string;
  answer_text?: string | null;
};

type SpeakingPart2Topic = {
  id: number;
  chinese_title: string | null;
  english_title: string | null;
  part2_question: string | null;
  cue_card_1: string | null;
  cue_card_2: string | null;
  cue_card_3: string | null;
  cue_card_4: string | null;
  part3_q1: string | null;
  part3_q2: string | null;
  part3_q3: string | null;
  part3_q4: string | null;
  part3_q5: string | null;
  part3_q6: string | null;
  part3_q7: string | null;
  part3_q8: string | null;
  part3_q9: string | null;
  part3_q10: string | null;
  category: string | null;
  difficulty: string | null;
  status: string | null;
  sort_order: number | null;
};

export default async function IeltsSpeakingPage() {
  const { supabase } = await requireUser("/ielts/speaking");

  const [part1Result, part2Result] = await Promise.all([
    supabase
      .schema("ielts")
      .from("ielts_speaking_part1_questions")
      .select("id, topic_title, question_number, question_text")
      .order("topic_title", { ascending: true })
      .order("question_number", { ascending: true })
      .limit(500),

    supabase
      .schema("ielts")
      .from("ielts_speaking_part2_3")
      .select("id, chinese_title, english_title, part2_question, cue_card_1, cue_card_2, cue_card_3, cue_card_4, part3_q1, part3_q2, part3_q3, part3_q4, part3_q5, part3_q6, part3_q7, part3_q8, part3_q9, part3_q10, category, difficulty, status, sort_order")
      .eq("status", "published")
      .order("sort_order", { ascending: true })
      .limit(300),
  ]);

  const { data: part1Data, error: part1Error } = part1Result;
  const { data: part2Data, error: part2Error } = part2Result;

  const part1Questions = (part1Data ?? []) as SpeakingPart1Question[];
  const part2Topics = (part2Data ?? []) as SpeakingPart2Topic[];

  return (
    <main className="py-12 text-[var(--text)] sm:py-16 lg:py-20">
      <Container>
        <section className="mb-10 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-sm)] sm:p-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-faint)] sm:text-sm">
            IELTS SPEAKING
          </p>

          <h1 className="mb-5 text-3xl font-bold tracking-tight text-[var(--primary)] sm:text-4xl">
            雅思口语
          </h1>

          <p className="max-w-3xl text-base leading-7 text-[var(--text-soft)] sm:text-lg sm:leading-8">
            同步全球近3个月的口语真题 - 题目稳定期间命中率 100%
          </p>
        </section>

        {part1Error ? (
          <p className="mb-4 rounded-[var(--radius-md)] border border-[color:var(--danger)]/30 bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
            Part 1 加载失败，请稍后再试。
          </p>
        ) : null}

        {part2Error ? (
          <p className="mb-4 rounded-[var(--radius-md)] border border-[color:var(--danger)]/30 bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
            Part 2 加载失败，请稍后再试。
          </p>
        ) : null}

        {!part1Error && !part2Error && (
          <SpeakingBrowser
            part1Questions={part1Questions}
            part2Topics={part2Topics}
          />
        )}
      </Container>
    </main>
  );
}
