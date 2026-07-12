import { NextResponse } from "next/server";
import { checkAiUsageLimit, getAiLimitResponse, recordAiUsage } from "@/lib/ai/usage-limit";
import { requireApiUser } from "@/lib/auth/require-api-auth";
import { assessAzurePronunciation } from "@/lib/pte-speaking/azure-pronunciation";
import { openai } from "@/lib/pte-speaking/openai-client";
import { transcribeAudio } from "@/lib/pte-speaking/transcribe-audio";

const AI_FEATURE = "ielts_speaking_score";
const AI_MODEL = "azure-speech-pronunciation+gpt-4o-mini";

const SYSTEM_PROMPT = `You are an IELTS Speaking examiner. Return ONLY valid JSON. All feedback and explanations must be Simplified Chinese.

Evaluate IELTS Speaking using:
- Fluency and Coherence
- Lexical Resource
- Grammatical Range and Accuracy
- Pronunciation

If Azure pronunciation data is available, use it for pronunciation and fluency comments. If not, score pronunciation as null and explain that text-only scoring cannot evaluate pronunciation.`;

function buildPrompt({ questionContext, answerText, azureSummary }: { questionContext: string; answerText: string; azureSummary: unknown }) {
  return `Question context:
${questionContext}

Student answer/transcript:
${answerText}

Azure pronunciation summary:
${JSON.stringify(azureSummary, null, 2)}

Return JSON:
{
  "overall_band": 0,
  "fluency_coherence": { "score": 0, "feedback_cn": "" },
  "lexical_resource": { "score": 0, "feedback_cn": "" },
  "grammar_accuracy": { "score": 0, "feedback_cn": "" },
  "pronunciation": { "score": null, "feedback_cn": "" },
  "summary_cn": "",
  "strengths_cn": [],
  "improvements_cn": [],
  "better_answer": "",
  "pronunciation_focus_cn": []
}`;
}

export async function POST(req: Request) {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;
    const { user } = auth;

    const formData = await req.formData();
    const mode = String(formData.get("mode") ?? "text");
    const file = formData.get("file") as File | null;
    const textAnswer = String(formData.get("textAnswer") ?? "").trim();
    const questionContext = String(formData.get("questionContext") ?? "").trim();
    const rawDurationSeconds = Number(formData.get("durationSeconds"));
    const durationSeconds = Number.isFinite(rawDurationSeconds) ? Math.max(1, Math.floor(rawDurationSeconds)) : 1;

    if (mode === "audio" && !file) return NextResponse.json({ ok: false, message: "请上传音频文件" }, { status: 400 });
    if (mode !== "audio" && !textAnswer) return NextResponse.json({ ok: false, message: "请输入口语文字稿" }, { status: 400 });

    const usageLimit = await checkAiUsageLimit(user.id, AI_FEATURE);
    if (!usageLimit.allowed) return NextResponse.json(getAiLimitResponse(usageLimit), { status: 403 });

    let answerText = textAnswer;
    let azurePronunciation = null;

    try {
      if (mode === "audio" && file) {
        const [transcript, azure] = await Promise.all([
          transcribeAudio(file),
          assessAzurePronunciation({ file, referenceText: "", durationSeconds }),
        ]);
        answerText = transcript || azure.summary.recognizedText;
        azurePronunciation = azure;
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildPrompt({ questionContext, answerText, azureSummary: azurePronunciation?.summary ?? null }) },
        ],
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error("AI 没有返回评分内容");

      await recordAiUsage({ userId: user.id, feature: AI_FEATURE, model: AI_MODEL, promptTokens: completion.usage?.prompt_tokens ?? 0, completionTokens: completion.usage?.completion_tokens ?? 0, totalTokens: completion.usage?.total_tokens ?? 0, status: "success" });

      return NextResponse.json({ ok: true, transcript: answerText, azure: azurePronunciation?.summary ?? null, result: JSON.parse(content) });
    } catch (error) {
      await recordAiUsage({ userId: user.id, feature: AI_FEATURE, model: AI_MODEL, status: "error", errorMessage: error instanceof Error ? error.message : "IELTS speaking scoring failed" });
      throw error;
    }
  } catch (error) {
    console.error("IELTS speaking score API error:", error);
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "server error" }, { status: 500 });
  }
}
