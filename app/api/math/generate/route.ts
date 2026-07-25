import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { reserveAiUsage, getAiLimitResponse, recordAiUsage } from "@/lib/ai/usage-limit";
import { buildPrompt } from "@/lib/math/prompt-templates";
import { getRandomScenario } from "@/lib/math/scenario-pools";
import { createClient } from "@/lib/supabase/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const AI_FEATURE = "math_generate";
const AI_MODEL = "gpt-5.4-mini";

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
    const { topic, difficulty, count = 1 } = body;

    const usageLimit = await reserveAiUsage(user.id, AI_FEATURE);

    if (!usageLimit.allowed) {
      return NextResponse.json(getAiLimitResponse(usageLimit), { status: 403 });
    }

    const problems = [];
    let promptTokens = 0;
    let completionTokens = 0;
    let totalTokens = 0;

    for (let i = 0; i < count; i++) {
      const scenario = getRandomScenario(topic);
      const prompt = buildPrompt(topic, difficulty, scenario);

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
