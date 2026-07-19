import "server-only";

import OpenAI from "openai";

import { createR2PresignedPutUrl } from "@/lib/r2/presign";
import { createAdminClient } from "@/lib/supabase/admin";
import { PTE_AI_AUDIO_MODEL, PTE_AI_AUDIO_VOICES, getPteAiAudioR2Key, getPteAiAudioRelativePath, type PteAiAudioQuestionType, type PteAiAudioVoice } from "@/lib/pte-ai-audio/voices";

type GenerateOneParams = {
  questionType: PteAiAudioQuestionType;
  questionId: string;
  force?: boolean;
};

type CreateQuestionParams = {
  questionType: PteAiAudioQuestionType;
  questionText: string;
};

type QuestionRow = {
  id: string;
  question_text: string | null;
  audio_status?: string | null;
};

function getTable(questionType: PteAiAudioQuestionType) {
  return questionType === "rs" ? "rs" : "wfd";
}

function getDefaultVoice() {
  return PTE_AI_AUDIO_VOICES[0].id;
}

function getQuestionTypeValue(questionType: PteAiAudioQuestionType) {
  return questionType === "rs" ? "RS" : "WFD";
}

function estimateDurationSeconds(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.round(words / 2.4));
}

async function uploadAudio({ key, body }: { key: string; body: Buffer }) {
  const presigned = createR2PresignedPutUrl({ key });
  const response = await fetch(presigned.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "audio/mpeg",
    },
    body: new Uint8Array(body),
  });

  if (!response.ok) {
    throw new Error(`R2 upload failed for ${key}: ${response.status} ${response.statusText}`);
  }
}

async function createSpeech(openai: OpenAI, voice: PteAiAudioVoice, text: string) {
  const result = await openai.audio.speech.create({
    model: PTE_AI_AUDIO_MODEL,
    voice,
    input: text,
    instructions: "Read this PTE practice sentence clearly in natural English. Keep a steady exam-style pace with no extra commentary.",
    response_format: "mp3",
  });

  return Buffer.from(await result.arrayBuffer());
}

export async function generatePteAiAudioForQuestion({ questionType, questionId, force = false }: GenerateOneParams) {
  const supabase = createAdminClient();
  const table = getTable(questionType);
  const { data: question, error } = await supabase.schema("pte").from(table).select("id, question_text, audio_status").eq("id", questionId).single<QuestionRow>();

  if (error || !question) {
    throw new Error(error?.message || "Question not found.");
  }

  if (!force && question.audio_status === "ready") {
    return { questionId, skipped: true, message: "Already ready." };
  }

  const text = question.question_text?.trim();
  if (!text) {
    throw new Error("Question text is empty.");
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const variants = [];

  await supabase.schema("pte").from(table).update({ audio_status: "generating", audio_error: null }).eq("id", questionId);

  try {
    for (const voice of PTE_AI_AUDIO_VOICES) {
      const key = getPteAiAudioR2Key(questionType, questionId, voice.id);
      const relativePath = getPteAiAudioRelativePath(questionType, questionId, voice.id);
      const audio = await createSpeech(openai, voice.id, text);
      await uploadAudio({ key, body: audio });
      variants.push({
        voice: voice.id,
        model: PTE_AI_AUDIO_MODEL,
        audio_url: relativePath,
        r2_key: key,
        duration_seconds: estimateDurationSeconds(text),
      });
    }

    const defaultVariant = variants.find((variant) => variant.voice === getDefaultVoice()) ?? variants[0];
    const updatePayload: Record<string, unknown> = {
      audio_url: defaultVariant.audio_url,
      audio_duration_seconds: defaultVariant.duration_seconds,
      ai_voice: defaultVariant.voice,
      audio_status: "ready",
      audio_generated_at: new Date().toISOString(),
      audio_error: null,
    };

    if (questionType === "rs") {
      updatePayload.audio_variants_json = variants;
      updatePayload.audio_variant_count = variants.length;
    }

    const { error: updateError } = await supabase.schema("pte").from(table).update(updatePayload).eq("id", questionId);
    if (updateError) throw new Error(updateError.message);

    return { questionId, skipped: false, variants };
  } catch (error) {
    await supabase.schema("pte").from(table).update({ audio_status: "error", audio_error: error instanceof Error ? error.message : "Unknown error" }).eq("id", questionId);
    throw error;
  }
}

export async function createPteAiAudioQuestionAndGenerate({ questionType, questionText }: CreateQuestionParams) {
  const text = questionText.trim();
  if (!text) {
    throw new Error("请输入题目句子。");
  }

  const supabase = createAdminClient();
  const table = getTable(questionType);
  const insertPayload: Record<string, unknown> = {
    question_text: text,
    question_type: getQuestionTypeValue(questionType),
    source_platform: "lofty-admin",
    is_prediction: true,
    is_real_exam: false,
    audio_status: "pending",
  };

  if (questionType === "rs") {
    insertPayload.is_active = true;
  }

  const { data: question, error } = await supabase.schema("pte").from(table).insert(insertPayload).select("id").single<{ id: string }>();
  if (error || !question) {
    throw new Error(error?.message || "创建题目失败。");
  }

  const result = await generatePteAiAudioForQuestion({ questionType, questionId: question.id, force: true });
  return { questionId: question.id, questionType, questionText: text, result };
}
