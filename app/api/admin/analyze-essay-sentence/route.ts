import { NextResponse } from "next/server";
import OpenAI from "openai";
import { checkAiUsageLimit, getAiLimitResponse, recordAiUsage } from "@/lib/ai/usage-limit";
import { requireApiAdmin } from "@/lib/auth/require-api-auth";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const AI_FEATURE = "admin_analyze_essay_sentence";
const AI_MODEL = "gpt-4o-mini";

const TAG_OPTIONS = [
  "education",
  "technology",
  "environment",
  "economy",
  "government",
  "society",
  "health",
  "culture",
  "crime",
  "transportation",
  "employment",
  "media",
  "globalization",
  "family",
  "urbanization",
] as const;

const SENTENCE_TYPE_OPTIONS = [
  "argument",
  "example",
  "result",
  "solution",
  "opening",
  "conclusion",
] as const;

const SOURCE_TYPE_OPTIONS = ["essay", "extra"] as const;

const POSITION_TYPE_OPTIONS = [
  "opening",
  "topic_sentence",
  "body",
  "conclusion",
] as const;

const ARGUMENT_PATTERN_OPTIONS = [
  "example",
  "explanation",
  "cause_effect",
  "comparison",
  "concession",
  "classification",
  "statistics",
  "expert_opinion",
  "problem_solution",
  "consequence",
  "analogy",
] as const;

const PEEL_ROLE_OPTIONS = ["point", "explanation", "example", "link"] as const;
const DIFFICULTY_LEVEL_OPTIONS = [1, 2, 3] as const;

function includesOption<T extends readonly (string | number)[]>(
  options: T,
  value: unknown
): value is T[number] {
  return options.includes(value as T[number]);
}

function buildUserPrompt(data: {
  question_text: string;
  essay_text: string;
  sentence_text: string;
}) {
  return `
Analyze the selected sentence from a PTE Write Essay answer.

Question:
${data.question_text}

Full essay:
${data.essay_text}

Selected sentence:
${data.sentence_text}

Return ONLY valid JSON with this exact shape:
{
  "sentence_text": "",
  "chinese_explanation": "",
  "tag1": "",
  "tag2": "",
  "sentence_type": "",
  "source_type": "essay",
  "position_type": "",
  "argument_pattern": "",
  "peel_role": "",
  "difficulty_level": 1,
  "is_featured": false
}

Allowed values:
- tag1/tag2: ${TAG_OPTIONS.join(", ")}
- sentence_type: ${SENTENCE_TYPE_OPTIONS.join(", ")}
- source_type: ${SOURCE_TYPE_OPTIONS.join(", ")}
- position_type: ${POSITION_TYPE_OPTIONS.join(", ")}
- argument_pattern: ${ARGUMENT_PATTERN_OPTIONS.join(", ")}
- peel_role: ${PEEL_ROLE_OPTIONS.join(", ")}
- difficulty_level: 1, 2, 3
- is_featured: true or false

Chinese explanation should explain the role and writing value of the sentence in concise Simplified Chinese.
`;
}

export async function POST(req: Request) {
  try {
    const auth = await requireApiAdmin();
    if (!auth.ok) return auth.response;
    const { user } = auth;

    const body = (await req.json()) as {
      we_id?: string;
      question_text?: string;
      essay_text?: string;
      sentence_text?: string;
    };

    if (
      !body.we_id ||
      !body.question_text ||
      !body.essay_text ||
      !body.sentence_text
    ) {
      return NextResponse.json(
        { error: "Missing required sentence analysis fields" },
        { status: 400 }
      );
    }

    const usageLimit = await checkAiUsageLimit(user.id, AI_FEATURE);

    if (!usageLimit.allowed) {
      return NextResponse.json(getAiLimitResponse(usageLimit), { status: 403 });
    }

    let completion;

    try {
      completion = await openai.chat.completions.create({
        model: AI_MODEL,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are an expert PTE Write Essay teacher. Return only valid JSON using the allowed enum values.",
          },
          {
            role: "user",
            content: buildUserPrompt({
              question_text: body.question_text,
              essay_text: body.essay_text,
              sentence_text: body.sentence_text,
            }),
          },
        ],
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

    await recordAiUsage({
      userId: user.id,
      feature: AI_FEATURE,
      model: AI_MODEL,
      promptTokens: completion.usage?.prompt_tokens ?? 0,
      completionTokens: completion.usage?.completion_tokens ?? 0,
      totalTokens: completion.usage?.total_tokens ?? 0,
      status: "success",
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "Empty response from AI" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(content) as Record<string, unknown>;

    const result = {
      sentence_text:
        typeof parsed.sentence_text === "string"
          ? parsed.sentence_text
          : body.sentence_text,
      chinese_explanation:
        typeof parsed.chinese_explanation === "string"
          ? parsed.chinese_explanation
          : "",
      tag1: includesOption(TAG_OPTIONS, parsed.tag1) ? parsed.tag1 : "",
      tag2: includesOption(TAG_OPTIONS, parsed.tag2) ? parsed.tag2 : "",
      sentence_type: includesOption(
        SENTENCE_TYPE_OPTIONS,
        parsed.sentence_type
      )
        ? parsed.sentence_type
        : "",
      source_type: includesOption(SOURCE_TYPE_OPTIONS, parsed.source_type)
        ? parsed.source_type
        : "essay",
      position_type: includesOption(
        POSITION_TYPE_OPTIONS,
        parsed.position_type
      )
        ? parsed.position_type
        : "",
      argument_pattern: includesOption(
        ARGUMENT_PATTERN_OPTIONS,
        parsed.argument_pattern
      )
        ? parsed.argument_pattern
        : "",
      peel_role: includesOption(PEEL_ROLE_OPTIONS, parsed.peel_role)
        ? parsed.peel_role
        : "",
      difficulty_level: includesOption(
        DIFFICULTY_LEVEL_OPTIONS,
        parsed.difficulty_level
      )
        ? parsed.difficulty_level
        : 1,
      is_featured:
        typeof parsed.is_featured === "boolean" ? parsed.is_featured : false,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analyze essay sentence API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
