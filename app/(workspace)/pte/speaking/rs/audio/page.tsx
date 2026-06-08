import { requireUser } from "@/lib/auth/require-user";
import RsAudioClient from "./rs-audio-client";

type RsAudioQuestion = {
  id: string;
  question_text: string;
  source_question_id: string | null;
  is_prediction: boolean | null;
  audio_url: string | null;
  audio_duration_seconds: number | null;
};

function getPublicAudioUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/pte-audio/${path}`;
}

function getWordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default async function RsAudioPage() {
  const { supabase } = await requireUser("/pte/speaking/rs/audio");

  const { data, error } = await supabase
    .schema("views")
    .from("v_pte_rs_with_user_status")
    .select(
      "id, question_text, source_question_id, is_prediction, audio_url, audio_duration_seconds",
    )
    .eq("question_type", "RS")
    .not("audio_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(1500);

  const questions = ((data ?? []) as RsAudioQuestion[])
    .filter((question) => question.audio_url)
    .map((question) => ({
      ...question,
      audio_url: getPublicAudioUrl(question.audio_url as string),
    }))
    .sort((a, b) => getWordCount(a.question_text) - getWordCount(b.question_text));

  if (error) {
    return (
      <section className="rounded-[var(--radius-md)] border border-[color:var(--danger)]/30 bg-[var(--danger-soft)] p-5 text-sm text-[var(--danger)] shadow-[var(--shadow-sm)]">
        RS 音频加载失败：{error.message}
      </section>
    );
  }

  return <RsAudioClient questions={questions} />;
}
