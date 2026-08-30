import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { reserveAiUsage, getAiLimitResponse, recordAiUsage } from "@/lib/ai/usage-limit";
import { buildPrompt } from "@/lib/math/prompt-templates";
import { getRandomScenario } from "@/lib/math/scenario-pools";
import { createClient } from "@/lib/supabase/server";
import { clampInteger, isTextTooLong } from "@/lib/api/request-limits";
import type { Difficulty, MathWordProblemType } from "@/types/math";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const AI_FEATURE = "math_generate";
const AI_MODEL = "gpt-5.4-mini";
const MAX_GENERATED_PROBLEMS = 3;
const MAX_MATH_FIELD_LENGTH = 120;
const ALLOWED_TOPICS = new Set<MathWordProblemType>([
  "speed_distance_time",
  "ratio_sharing",
  "percentage_change",
  "money_cost",
  "age_problem",
  "work_rate",
  "fraction_context",
  "measurement_geometry",
  "average_data",
  "simple_probability",
]);
const ALLOWED_DIFFICULTIES = new Set<Difficulty>(["easy", "medium", "hard"]);

function parseTopic(value: string): MathWordProblemType | null {
  return ALLOWED_TOPICS.has(value as MathWordProblemType) ? value as MathWordProblemType : null;
}

function parseDifficulty(value: string): Difficulty | null {
  return ALLOWED_DIFFICULTIES.has(value as Difficulty) ? value as Difficulty : null;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const topic = String(body.topic ?? "").trim();
    const difficulty = String(body.difficulty ?? "").trim();
    const count = clampInteger(body.count, { min: 1, max: MAX_GENERATED_PROBLEMS, fallback: 1 });

    if (!topic || !difficulty || isTextTooLong(topic, MAX_MATH_FIELD_LENGTH) || isTextTooLong(difficulty, MAX_MATH_FIELD_LENGTH)) {
      return NextResponse.json({ error: "Invalid topic or difficulty." }, { status: 400 });
    }

    const parsedTopic = parseTopic(topic);
    const parsedDifficulty = parseDifficulty(difficulty);
    if (!parsedTopic || !parsedDifficulty) {
      return NextResponse.json({ error: "Invalid topic or difficulty." }, { status: 400 });
    }

    const usageLimit = await reserveAiUsage(user.id, AI_FEATURE);

    if (!usageLimit.allowed) {
      return NextResponse.json(getAiLimitResponse(usageLimit), { status: 403 });
    }

    const problems = [];
    let promptTokens = 0;
    let completionTokens = 0;
    let totalTokens = 0;

    for (let i = 0; i < count; i++) {
      const scenario = getRandomScenario(parsedTopic);
      const prompt = buildPrompt(parsedTopic, parsedDifficulty, scenario);

      let response;

      try {
        response = await client.responses.create({
          model: AI_MODEL,
          input: prompt,
        });
      } catch (error) {
        await recordAiUsage({
          userId: user.id,
          feature: AI_FEATURE,
          model: AI_MODEL,
          status: "error",
          errorMessage: error instanceof Error ? error.message : "OpenAI request failed",
        });

        throw error;
      }

      const usage = response.usage as { input_tokens?: number; output_tokens?: number; total_tokens?: number } | undefined;
      promptTokens += usage?.input_tokens ?? 0;
      completionTokens += usage?.output_tokens ?? 0;
      totalTokens += usage?.total_tokens ?? 0;

      const text = response.output_text?.trim();

      if (!text) {
        throw new Error("Model returned empty output");
      }

      const parsed = JSON.parse(text);
      problems.push({
        ...parsed,
        id: `generated-${Date.now()}-${i}`,
      });
    }

    await recordAiUsage({
      userId: user.id,
      feature: AI_FEATURE,
      model: AI_MODEL,
      promptTokens,
      completionTokens,
      totalTokens,
      status: "success",
    });

    return NextResponse.json({ problems });
  } catch (error) {
    console.error("Math generate route error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown server error",
      },
      { status: 500 }
    );
  }
}
