import IeltsModuleHero from "@/components/site/ielts-module-hero";
import IELTSSubnav from "@/components/site/ielts-subnav";
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
    <main className="container-main space-y-6 py-5 text-[var(--text)] sm:py-7">
      <IELTSSubnav current="speaking" />

      <IeltsModuleHero
        badge="IELTS Speaking"
        title="雅思口语"
        description="同步全球近 3 个月的口语真题，系统训练 Part 1、Part 2 与 Part 3 的表达能力。"
        image="/ielts-nav/speaking.webp"
        imageAlt="IELTS Speaking interview practice"
      />

      {part1Error ? (
        <p className="rounded-[var(--radius-md)] border border-[color:var(--danger)]/30 bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
          Part 1 加载失败，请稍后再试。
        </p>
      ) : null}

      {part2Error ? (
        <p className="rounded-[var(--radius-md)] border border-[color:var(--danger)]/30 bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
          Part 2 加载失败，请稍后再试。
        </p>
      ) : null}

      {!part1Error && !part2Error && (
        <SpeakingBrowser
          part1Questions={part1Questions}
          part2Topics={part2Topics}
        />
      )}
    </main>
  );
}
