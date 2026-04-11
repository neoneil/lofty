import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { buildPrompt } from "@/lib/math/prompt-templates";
import { getRandomScenario } from "@/lib/math/scenario-pools";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { topic, difficulty, count = 1 } = body;

    const problems = [];

    for (let i = 0; i < count; i++) {
      const scenario = getRandomScenario(topic);
      const prompt = buildPrompt(topic, difficulty, scenario);

      const response = await client.responses.create({
        model: "gpt-5.4-mini",
        input: prompt,
      });

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