import { NextResponse } from "next/server";
import { reserveAiUsage, getAiLimitResponse, recordAiUsage } from "@/lib/ai/usage-limit";
import { getAiPromptContent, renderAiPrompt } from "@/lib/ai-prompts/server";
import { requireApiUser } from "@/lib/auth/require-api-auth";
import { openai } from "@/lib/pte-speaking/openai-client";

const AI_FEATURE = "ielts_speaking_sample";
const AI_MODEL = "gpt-4o-mini";

type SampleRequest = {
  context: {
    part: "part1" | "part2" | "part3";
    topicTitle?: string;
    questionText?: string;
    part2Question?: string;
    cueCards?: string[];
    part3Questions?: string[];
    category?: string | null;
  };
  targetBand?: string;
  keywords?: string;
  details?: string;
};

export async function POST(req: Request) {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;
    const { user } = auth;
    const body = (await req.json()) as SampleRequest;

    const usageLimit = await reserveAiUsage(user.id, AI_FEATURE);
    if (!usageLimit.allowed) return NextResponse.json(getAiLimitResponse(usageLimit), { status: 403 });

    let completion;
    try {
      const [systemPrompt, userPrompt] = await Promise.all([
        getAiPromptContent("ielts.speaking.sample.system"),
        renderAiPrompt("ielts.speaking.sample.user", {
          context: body.context,
          targetBand: body.targetBand || "7.0",
          keywords: body.keywords || "",
          details: body.details || "",
          part: body.context.part,
        }),
      ]);

      completion = await openai.chat.completions.create({
        model: AI_MODEL,
        temperature: 0.35,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });
    } catch (error) {
      await recordAiUsage({ userId: user.id, feature: AI_FEATURE, model: AI_MODEL, status: "error", errorMessage: error instanceof Error ? error.message : "OpenAI request failed" });
      throw error;
    }

    const content = completion.choices[0]?.message?.content;
    if (!content) return NextResponse.json({ ok: false, message: "AI 没有返回内容" }, { status: 500 });

    await recordAiUsage({ userId: user.id, feature: AI_FEATURE, model: AI_MODEL, promptTokens: completion.usage?.prompt_tokens ?? 0, completionTokens: completion.usage?.completion_tokens ?? 0, totalTokens: completion.usage?.total_tokens ?? 0, status: "success" });

    return NextResponse.json({ ok: true, result: JSON.parse(content) });
  } catch (error) {
    console.error("IELTS speaking sample API error:", error);
    return NextResponse.json({ ok: false, message: "server error" }, { status: 500 });
  }
}
