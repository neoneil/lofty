import { NextResponse } from "next/server";

import { reserveAiUsage, getAiLimitResponse, recordAiUsage } from "@/lib/ai/usage-limit";
import { generatePteSwtSample, PTE_SWT_SAMPLE_AI_FEATURE } from "@/lib/admin/pte-swt-samples";
import { requireApiAdmin } from "@/lib/auth/require-api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 120;

type SwtQuestion = {
  id: string;
  question_title: string | null;
  question_text: string;
  answer: string | null;
  created_at: string;
};

type SwtAnswer = {
  id: string;
  swt_id: string;
  answer_text: string;
  chinese_explanation: string | null;
  word_count: number | null;
  score_target: number | null;
  created_at: string;
};

type SwtComponent = {
  id: string;
  swt_id: string | null;
  swt_answer_id: string | null;
  component_text: string;
  chinese_explanation: string | null;
  component_role: string | null;
  grammar_pattern: string | null;
  source_idea: string | null;
  created_at: string;
};

async function findNextMissingQuestion() {
  const supabase = createAdminClient();
  const { data: questionsData, error: questionsError } = await supabase
    .schema("pte")
    .from("swt")
    .select("id, question_title, question_text, answer, created_at")
    .eq("is_prediction", true)
    .order("created_at", { ascending: false });

  if (questionsError) throw new Error(questionsError.message);

  const questions = (questionsData ?? []) as SwtQuestion[];
  if (questions.length === 0) return null;

  const questionIds = questions.map((question) => question.id);
  const { data: answersData, error: answersError } = await supabase
    .schema("pte")
    .from("swt_answer")
    .select("swt_id")
    .in("swt_id", questionIds);

  if (answersError) throw new Error(answersError.message);

  const completed = new Set((answersData ?? []).map((row) => row.swt_id as string));
  return questions.find((question) => !completed.has(question.id)) ?? null;
}

export async function POST() {
  const auth = await requireApiAdmin();
  if (!auth.ok) return auth.response;

  const usageLimit = await reserveAiUsage(auth.user.id, PTE_SWT_SAMPLE_AI_FEATURE);
  if (!usageLimit.allowed) {
    return NextResponse.json(getAiLimitResponse(usageLimit), { status: 403 });
  }

  const supabase = createAdminClient();
  const question = await findNextMissingQuestion();

  if (!question) {
    return NextResponse.json({ ok: true, done: true, message: "全部活跃 SWT 预测题都已有范文。" });
  }

  try {
    const { sample, usage, model, wordCount } = await generatePteSwtSample(question.question_text, question.answer);

    const { data: answerData, error: answerError } = await supabase
      .schema("pte")
      .from("swt_answer")
      .insert({
        swt_id: question.id,
        answer_text: sample.answer_text,
        chinese_explanation: sample.answer_translation_zh,
        word_count: wordCount,
        score_target: 90,
      })
      .select("id,swt_id,answer_text,chinese_explanation,word_count,score_target,created_at")
      .single();

    if (answerError || !answerData) {
      throw new Error(answerError?.message ?? "Failed to save SWT answer.");
    }

    const answer = answerData as SwtAnswer;
    const componentRows = [
      {
        swt_id: question.id,
        swt_answer_id: answer.id,
        component_text: question.question_text,
        chinese_explanation: sample.source_translation_zh,
        component_role: "source_translation",
        grammar_pattern: "source_text_translation",
        source_idea: "original_passage",
      },
      ...sample.components.map((component) => ({
        swt_id: question.id,
        swt_answer_id: answer.id,
        component_text: component.component_text,
        chinese_explanation: component.chinese_explanation,
        component_role: component.component_role,
        grammar_pattern: component.grammar_pattern,
        source_idea: component.source_idea,
      })),
    ];

    const { data: componentData, error: componentError } = await supabase
      .schema("pte")
      .from("swt_component")
      .insert(componentRows)
      .select("id,swt_id,swt_answer_id,component_text,chinese_explanation,component_role,grammar_pattern,source_idea,created_at");

    if (componentError) throw new Error(componentError.message);

    await recordAiUsage({
      userId: auth.user.id,
      feature: PTE_SWT_SAMPLE_AI_FEATURE,
      model,
      promptTokens: usage?.prompt_tokens ?? 0,
      completionTokens: usage?.completion_tokens ?? 0,
      totalTokens: usage?.total_tokens ?? 0,
      status: "success",
    });

    return NextResponse.json({
      ok: true,
      done: false,
      question,
      answer,
      components: (componentData ?? []) as SwtComponent[],
      message: "已生成并保存 1 道 PTE SWT 范文。",
    });
  } catch (error) {
    await recordAiUsage({
      userId: auth.user.id,
      feature: PTE_SWT_SAMPLE_AI_FEATURE,
      model: "gpt-4o-mini",
      status: "error",
      errorMessage: error instanceof Error ? error.message : "PTE SWT sample generation failed",
    });

    console.error("Generate PTE SWT sample error:", error);
    return NextResponse.json({ ok: false, message: "生成失败" }, { status: 500 });
  }
}
