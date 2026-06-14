import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import GenerateEssayAnswerClient, {
  type ReviewedSentence,
  type WeQuestion,
} from "./generate-essay-answer-client";

export type SaveEssayAnswerState = {
  ok: boolean;
  message: string;
};

export default async function GenerateEssayAnswerPage() {
  await requireAdmin("/admin/generate_essay_answer");

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .schema("pte")
    .from("we")
    .select("id, question_text, is_prediction, created_at")
    .eq("is_prediction", true)
    .order("created_at", { ascending: false });

  async function saveEssayAnswer(payload: {
    we_id: string;
    thesis: string;
    answer_text: string;
    sentences: ReviewedSentence[];
  }): Promise<SaveEssayAnswerState> {
    "use server";

    await requireAdmin("/admin/generate_essay_answer");

    if (!payload.we_id || !payload.thesis || !payload.answer_text) {
      return { ok: false, message: "Missing essay answer data." };
    }

    if (
      payload.sentences.length === 0 ||
      payload.sentences.some(
        (sentence) => sentence.review_status !== "completed"
      )
    ) {
      return {
        ok: false,
        message: "All sentences must be completed before upload.",
      };
    }

    const reviewedSentences = payload.sentences.filter(
      (sentence) => sentence.review_status === "completed"
    );

    if (reviewedSentences.length === 0) {
      return { ok: false, message: "No reviewed sentences to save." };
    }

    const supabase = createAdminClient();

    const { data: essayAnswer, error: answerError } = await supabase
      .schema("pte")
      .from("essay_answer")
      .insert({
        we_id: payload.we_id,
        thesis: payload.thesis,
        answer_text: payload.answer_text,
        score_target: 90,
      })
      .select("id")
      .single();

    if (answerError || !essayAnswer) {
      return {
        ok: false,
        message: answerError?.message ?? "Failed to save essay answer.",
      };
    }

    const sentenceRows = reviewedSentences.map((sentence) => ({
      we_id: payload.we_id,
      essay_answer_id: essayAnswer.id,
      sentence_text: sentence.sentence_text,
      chinese_explanation: sentence.chinese_explanation,
      tag1: sentence.tag1,
      tag2: sentence.tag2,
      sentence_type: sentence.sentence_type,
      source_type: sentence.source_type,
      position_type: sentence.position_type,
      argument_pattern: sentence.argument_pattern,
      peel_role: sentence.peel_role,
      difficulty_level: sentence.difficulty_level,
      is_featured: sentence.is_featured,
    }));

    const { error: sentenceError } = await supabase
      .schema("pte")
      .from("essay_sentence")
      .insert(sentenceRows);

    if (sentenceError) {
      return {
        ok: false,
        message: sentenceError.message,
      };
    }

    revalidatePath("/admin/generate_essay_answer");

    return {
      ok: true,
      message: `Saved essay answer and ${sentenceRows.length} reviewed sentences.`,
    };
  }

  return (
    <GenerateEssayAnswerClient
      questions={(data ?? []) as WeQuestion[]}
      loadError={error?.message ?? null}
      saveEssayAnswer={saveEssayAnswer}
    />
  );
}
