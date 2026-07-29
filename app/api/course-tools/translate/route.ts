import OpenAI from "openai";
import { NextResponse } from "next/server";

import { reserveAiUsage, getAiLimitResponse, recordAiUsage } from "@/lib/ai/usage-limit";
import { renderAiPrompt } from "@/lib/ai-prompts/server";
import { createClient } from "@/lib/supabase/server";

const AI_FEATURE = "course_translation";
const AI_MODEL = "gpt-4o-mini";
const MAX_TEXT_LENGTH = 5000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type TranslationDirection = "en-to-zh" | "zh-to-en";

type TranslationRequest = {
  text?: string;
  direction?: TranslationDirection;
};

async function getSystemPrompt(direction: TranslationDirection) {
  const target = direction === "en-to-zh" ? "Simplified Chinese" : "natural, professional English";
  return renderAiPrompt("course.translation.system", { target });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as TranslationRequest;
  const text = body.text?.trim() ?? "";
  const direction = body.direction;

  if (!text || (direction !== "en-to-zh" && direction !== "zh-to-en")) {
    return NextResponse.json({ ok: false, message: "请输入内容并选择翻译方向。" }, { status: 400 });
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ ok: false, message: `翻译内容不能超过 ${MAX_TEXT_LENGTH} 个字符。` }, { status: 400 });
  }

  const usageLimit = await reserveAiUsage(user.id, AI_FEATURE);

  if (!usageLimit.allowed) {
    return NextResponse.json(getAiLimitResponse(usageLimit), { status: 403 });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      temperature: 0.1,
      messages: [
        { role: "system", content: await getSystemPrompt(direction) },
        { role: "user", content: text },
      ],
    });

    const translation = completion.choices[0]?.message?.content?.trim();

    if (!translation) {
      await recordAiUsage({ userId: user.id, feature: AI_FEATURE, model: AI_MODEL, status: "error", errorMessage: "Empty translation response" });
      return NextResponse.json({ ok: false, message: "翻译服务没有返回内容。" }, { status: 502 });
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

    return NextResponse.json({ ok: true, translation, direction });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Translation request failed";
    await recordAiUsage({ userId: user.id, feature: AI_FEATURE, model: AI_MODEL, status: "error", errorMessage: message });
    return NextResponse.json({ ok: false, message: "翻译暂时不可用，请稍后重试。" }, { status: 500 });
  }
}
