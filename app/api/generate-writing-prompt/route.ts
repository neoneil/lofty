import OpenAI from "openai";
import { NextResponse } from "next/server";
import { checkAiUsageLimit, getAiLimitResponse, recordAiUsage } from "@/lib/ai/usage-limit";
import { requireApiAdmin } from "@/lib/auth/require-api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const AI_FEATURE = "admin_generate_writing_prompt";
const AI_MODEL = "gpt-5.4";

type RequestBody = {
  writingType?: string;
  difficulty?: string;
};

function normalizeQuestionType(input: string) {
  if (input === "creative") return "narrative";
  if (input === "persuasive") return "persuasive";
  return input;
}

export async function POST(req: Request) {
  try {
    const auth = await requireApiAdmin();
    if (!auth.ok) return auth.response;
    const { user } = auth;

    const body = (await req.json()) as RequestBody;

    const writingType = String(body.writingType ?? "mixed");
    const difficulty = String(body.difficulty ?? "medium");

    const schema = {
      name: "writing_prompt",
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          actualQuestionType: {
            type: "string",
            enum: ["narrative", "persuasive"],
          },
          title: { type: "string" },
          instruction: { type: "string" },
          wordCount: { type: "string" },
          tips: {
            type: "array",
            items: { type: "string" },
          },
          ideas: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: [
          "actualQuestionType",
          "title",
          "instruction",
          "wordCount",
          "tips",
          "ideas",
        ],
      },
      strict: true,
    };

    const requestedTypeForPrompt =
      writingType === "creative"
        ? "narrative"
        : writingType === "mixed"
        ? "mixed"
        : writingType;

    const usageLimit = await checkAiUsageLimit(user.id, AI_FEATURE);

    if (!usageLimit.allowed) {
      return NextResponse.json(getAiLimitResponse(usageLimit), { status: 403 });
    }

    let response;

    try {
      response = await client.responses.create({
      model: AI_MODEL,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: `
You are an expert prompt writer for an Australian selective school writing practice website.

Your task:
- Generate one high-quality writing prompt for a school-aged student.
- The prompt should be suitable for selective school practice.
- Supported writing types: narrative, persuasive, and mixed.
- Supported difficulty: easy, medium, hard.
- If writingType is mixed, choose either narrative or persuasive.
- Return the final chosen type as actualQuestionType.
- Keep the prompt age-appropriate, clear, and engaging.
- Return only valid JSON.
              `.trim(),
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `
Writing type: ${requestedTypeForPrompt}
Difficulty: ${difficulty}
              `.trim(),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          ...schema,
        },
      },
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

    await recordAiUsage({
      userId: user.id,
      feature: AI_FEATURE,
      model: AI_MODEL,
      promptTokens: usage?.input_tokens ?? 0,
      completionTokens: usage?.output_tokens ?? 0,
      totalTokens: usage?.total_tokens ?? 0,
      status: "success",
    });

    const parsed = JSON.parse(response.output_text) as {
      actualQuestionType: "narrative" | "persuasive";
      title: string;
      instruction: string;
      wordCount: string;
      tips: string[];
      ideas: string[];
    };

    const finalQuestionType =
      writingType === "mixed"
        ? parsed.actualQuestionType
        : normalizeQuestionType(writingType);

    const supabase = createAdminClient();

    const insertPayload = {
      question_type: finalQuestionType,
      title: parsed.title,
      instruction_text: parsed.instruction,
      question_body_text: parsed.instruction,
      stimulus_text: null,
      difficulty_level: difficulty,
      tags: ["selective", "writing", finalQuestionType, difficulty],
      source_type: "ai_generated",
      generator_model: "gpt-5.4",
      metadata_json: {
        requestedWritingType: writingType,
        actualQuestionType: finalQuestionType,
        wordCount: parsed.wordCount,
        tips: parsed.tips,
        ideas: parsed.ideas,
      },
    };

    const { data: insertedRow, error: insertError } = await supabase
      .schema("selective")
      .from("writing_questions")
      .insert(insertPayload)
      .select("id, created_at, question_type")
      .single();

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      return NextResponse.json(
        { error: "Prompt generated, but failed to save to database." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: insertedRow.id,
      createdAt: insertedRow.created_at,
      questionType: insertedRow.question_type,
      title: parsed.title,
      instruction: parsed.instruction,
      wordCount: parsed.wordCount,
      tips: parsed.tips,
      ideas: parsed.ideas,
    });
  } catch (error) {
    console.error("generate-writing-prompt error:", error);
    return NextResponse.json(
      { error: "Failed to generate prompt." },
      { status: 500 }
    );
  }
}
