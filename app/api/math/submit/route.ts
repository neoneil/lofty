import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { reserveAiUsage, getAiLimitResponse, recordAiUsage } from "@/lib/ai/usage-limit";
import { gradeNumericAnswer } from "@/lib/math/grade-math-answer";
import { createClient } from "@/lib/supabase/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const AI_FEATURE = "math_feedback";
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

    const body = await req.json();
    const { question, correctAnswer, studentAnswer } = body;

    const grade = gradeNumericAnswer(studentAnswer, correctAnswer);

    let aiFeedback = null;

    if (!grade.isCorrect) {
      const usageLimit = await reserveAiUsage(user.id, AI_FEATURE);

      if (!usageLimit.allowed) {
        return NextResponse.json(getAiLimitResponse(usageLimit), { status: 403 });
      }

      const prompt = `
You are a math tutor reviewing a student's response.

Question:
${question}

Correct answer: ${correctAnswer}
Student answer: ${studentAnswer}

Return JSON only:
{
  "isCorrect": false,
  "errorType": "none | arithmetic_error | misunderstanding | unit_error | setup_error | unknown",
  "feedbackEnglish": "string",
  "feedbackChinese": "string",
  "hintEnglish": "string",
  "hintChinese": "string"
}
`;

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

      const text = response.output_text?.trim();

      if (!text) {
        throw new Error("Model returned empty output");
      }

      aiFeedback = JSON.parse(text);

      await recordAiUsage({
        userId: user.id,
        feature: AI_FEATURE,
        model: AI_MODEL,
        promptTokens: usage?.input_tokens ?? 0,
        completionTokens: usage?.output_tokens ?? 0,
        totalTokens: usage?.total_tokens ?? 0,
        status: "success",
      });
    }

    return NextResponse.json({
      grade,
      aiFeedback,
    });
  } catch (error) {
    console.error("Math submit route error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown server error",
      },
      { status: 500 }
    );
  }
}
