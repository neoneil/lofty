import { NextResponse } from "next/server";

import { reserveAiUsage, getAiLimitResponse, recordAiUsage } from "@/lib/ai/usage-limit";
import { generatePteEssaySample, PTE_ESSAY_SAMPLE_AI_FEATURE } from "@/lib/admin/pte-essay-samples";
import { requireApiAdmin } from "@/lib/auth/require-api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

type WeQuestion = {
  id: string;
  question_text: string;
  created_at: string;
};

type EssayAnswer = {
  id: string;
  we_id: string;
  thesis: string | null;
  answer_text: string;
  score_target: number | null;
  created_at: string;
};

type EssaySentence = {
  id: string;
  we_id: string;
  essay_answer_id: string;
  sentence_text: string;
  chinese_explanation: string | null;
  tag1: string | null;
  tag2: string | null;
  sentence_type: string | null;
  source_type: string | null;
  position_type: string | null;
  argument_pattern: string | null;
  peel_role: string | null;
  difficulty_level: number | null;
  is_featured: boolean | null;
};

async function findNextMissingQuestion() {
  const supabase = createAdminClient();
  const { data: questionsData, error: questionsError } = await supabase
    .schema("pte")
    .from("we")
    .select("id, question_text, created_at")
    .eq("question_type", "WE")
    .eq("is_prediction", true)
    .order("created_at", { ascending: false });

  if (questionsError) throw new Error(questionsError.message);

  const questions = (questionsData ?? []) as WeQuestion[];
  if (questions.length === 0) return null;

  const questionIds = questions.map((question) => question.id);
  const { data: answersData, error: answersError } = await supabase
    .schema("pte")
    .from("essay_answer")
    .select("we_id")
    .in("we_id", questionIds);

  if (answersError) throw new Error(answersError.message);

  const completed = new Set((answersData ?? []).map((row) => row.we_id as string));
  return questions.find((question) => !completed.has(question.id)) ?? null;
}

export async function POST() {
  const auth = await requireApiAdmin();
  if (!auth.ok) return auth.response;

  const usageLimit = await reserveAiUsage(auth.user.id, PTE_ESSAY_SAMPLE_AI_FEATURE);
  if (!usageLimit.allowed) {
    return NextResponse.json(getAiLimitResponse(usageLimit), { status: 403 });
  }

  const supabase = createAdminClient();
  const question = await findNextMissingQuestion();

  if (!question) {
    return NextResponse.json({ ok: true, done: true, message: "全部活跃 WE 题目都已有范文。" });
  }

  try {
    const { sample, usage, model } = await generatePteEssaySample(question.question_text);

    await recordAiUsage({
      userId: auth.user.id,
      feature: PTE_ESSAY_SAMPLE_AI_FEATURE,
      model,
      promptTokens: usage?.prompt_tokens ?? 0,
      completionTokens: usage?.completion_tokens ?? 0,
      totalTokens: usage?.total_tokens ?? 0,
      status: "success",
    });

    const { data: answerData, error: answerError } = await supabase
      .schema("pte")
      .from("essay_answer")
      .insert({
        we_id: question.id,
        thesis: sample.thesis,
        answer_text: sample.answer_text,
        score_target: 90,
      })
      .select("id,we_id,thesis,answer_text,score_target,created_at")
      .single();

    if (answerError || !answerData) {
      throw new Error(answerError?.message ?? "Failed to save essay answer.");
    }

    const answer = answerData as EssayAnswer;
    const sentenceRows = sample.sentences.map((sentence) => ({
      we_id: question.id,
      essay_answer_id: answer.id,
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

    const { data: sentenceData, error: sentenceError } = await supabase
      .schema("pte")
      .from("essay_sentence")
      .insert(sentenceRows)
      .select("id,we_id,essay_answer_id,sentence_text,chinese_explanation,tag1,tag2,sentence_type,source_type,position_type,argument_pattern,peel_role,difficulty_level,is_featured");

    if (sentenceError) throw new Error(sentenceError.message);

    return NextResponse.json({
      ok: true,
      done: false,
      question,
      answer,
      sentences: (sentenceData ?? []) as EssaySentence[],
      message: "已生成并保存 1 道 PTE 大作文范文。",
    });
  } catch (error) {
    await recordAiUsage({
      userId: auth.user.id,
      feature: PTE_ESSAY_SAMPLE_AI_FEATURE,
      model: "gpt-4o-mini",
      status: "error",
      errorMessage: error instanceof Error ? error.message : "PTE essay sample generation failed",
    });

    console.error("Generate PTE essay sample error:", error);
    return NextResponse.json({ ok: false, message: "生成失败" }, { status: 500 });
  }
}
