import { NextResponse } from "next/server";
import { checkAiUsageLimit, getAiLimitResponse, recordAiUsage } from "@/lib/ai/usage-limit";
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

const SYSTEM_PROMPT = `You are an IELTS Speaking coach. Return ONLY valid JSON. All explanations must be Simplified Chinese. Spoken answers must be natural English.

Requirements:
- Only answer the selected part in context.part. Do not generate answers for other parts.
- If context.part is part1, answer only the Part 1 question in 2 natural sentences.
- If context.part is part2, create only one Part 2 response script that can be spoken within 2 minutes.
- If context.part is part3, answer only the selected Part 3 discussion question in 2-3 sentences.
- Part 3 answers should preferably use comparison or contrast.
- Use the student's Chinese keywords/details as content inspiration, but write the final speaking answers in English.
- Match the requested target band, but keep answers realistic and speakable.`;

function buildPrompt(body: SampleRequest) {
  return `IELTS Speaking context:
${JSON.stringify(body.context, null, 2)}

Target band: ${body.targetBand || "7.0"}
Student keywords/details in Chinese or English:
${body.keywords || ""}

Extra information:
${body.details || ""}

Return JSON:
{
  "target_band": "7.0",
  "part": "${body.context.part}",
  "strategy_cn": "中文说明：这个答案如何围绕学生思路展开。",
  "part1_answers": [
    { "question": "", "answer": "" }
  ],
  "part2_script": "",
  "part3_answers": [
    { "question": "", "answer": "" }
  ],
  "useful_phrases": [
    { "phrase": "", "meaning_cn": "" }
  ]
}

Important:
- If part is part1, fill part1_answers only and keep part2_script empty and part3_answers empty.
- If part is part2, fill part2_script only and keep part1_answers empty and part3_answers empty.
- If part is part3, fill part3_answers only and keep part1_answers empty and part2_script empty.`;
}

export async function POST(req: Request) {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;
    const { user } = auth;
    const body = (await req.json()) as SampleRequest;

    const usageLimit = await checkAiUsageLimit(user.id, AI_FEATURE);
    if (!usageLimit.allowed) return NextResponse.json(getAiLimitResponse(usageLimit), { status: 403 });

    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: AI_MODEL,
        temperature: 0.35,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildPrompt(body) },
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
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "server error" }, { status: 500 });
  }
}
