import { NextResponse } from "next/server";
import OpenAI from "openai";
import { reserveAiUsage, getAiLimitResponse, recordAiUsage } from "@/lib/ai/usage-limit";
import { getAiPromptContent, renderAiPrompt } from "@/lib/ai-prompts/server";
import { requireApiAdmin } from "@/lib/auth/require-api-auth";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const AI_FEATURE = "admin_generate_essay_answer";
const AI_MODEL = "gpt-4o-mini";

export async function POST(req: Request) {
  try {
    const auth = await requireApiAdmin();
    if (!auth.ok) return auth.response;
    const { user } = auth;

    const body = (await req.json()) as {
      we_id?: string;
      question_text?: string;
    };

    if (!body.we_id || !body.question_text) {
      return NextResponse.json(
        { error: "Missing we_id or question_text" },
        { status: 400 }
      );
    }

    const usageLimit = await reserveAiUsage(user.id, AI_FEATURE);

    if (!usageLimit.allowed) {
      return NextResponse.json(getAiLimitResponse(usageLimit), { status: 403 });
    }

    let completion;

    try {
      const [systemPrompt, userPrompt] = await Promise.all([
        getAiPromptContent("admin.pte.essay-answer.system"),
        renderAiPrompt("admin.pte.essay-answer.user", { questionText: body.question_text }),
      ]);

      completion = await openai.chat.completions.create({
        model: AI_MODEL,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          { role: "user", content: userPrompt },
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

    const parsed = JSON.parse(content) as {
      thesis?: unknown;
      answer_text?: unknown;
    };

    if (
      typeof parsed.thesis !== "string" ||
      typeof parsed.answer_text !== "string"
    ) {
      return NextResponse.json(
        { error: "AI response missing thesis or answer_text" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      thesis: parsed.thesis,
      answer_text: parsed.answer_text,
    });
  } catch (error) {
    console.error("Generate essay answer API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
