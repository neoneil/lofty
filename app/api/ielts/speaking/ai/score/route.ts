import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { reserveAiUsage, getAiLimitResponse, recordAiUsage } from "@/lib/ai/usage-limit";
import { getAiPromptContent, renderAiPrompt } from "@/lib/ai-prompts/server";
import { requireApiUser } from "@/lib/auth/require-api-auth";
import { assessAzurePronunciation } from "@/lib/pte-speaking/azure-pronunciation";
import { openai } from "@/lib/pte-speaking/openai-client";
import { transcribeAudio } from "@/lib/pte-speaking/transcribe-audio";
import { isStudentRecordingUploadError, uploadStudentRecordingToPrivateR2 } from "@/lib/storage/student-recordings";

const AI_FEATURE = "ielts_speaking_score";
const AI_MODEL = "azure-speech-pronunciation+gpt-4o-mini";

type IeltsSpeakingContext = {
  part?: "part1" | "part2" | "part3";
  questionId?: string;
  [key: string]: unknown;
};

function parseQuestionContext(value: string): IeltsSpeakingContext {
  try {
    const parsed = JSON.parse(value) as IeltsSpeakingContext;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function getScore(value: unknown) {
  return typeof value === "object" && value !== null && "score" in value && typeof (value as { score?: unknown }).score === "number" ? (value as { score: number }).score : null;
}

async function saveSpeakingAttempt({
  supabase,
  userId,
  context,
  file,
  transcript,
  durationSeconds,
  azure,
  result,
}: {
  supabase: SupabaseClient;
  userId: string;
  context: IeltsSpeakingContext;
  file: File | null;
  transcript: string;
  durationSeconds: number;
  azure: unknown;
  result: Record<string, unknown>;
}) {
  const part = context.part ?? "part1";
  const questionId = context.questionId || `${part}:${String(context.questionText ?? context.part2Question ?? context.topicTitle ?? "unknown").slice(0, 120)}`;
  let audioStorageKey: string | null = null;

  if (file) {
    audioStorageKey = await uploadStudentRecordingToPrivateR2({ file, questionSource: `ielts_speaking_${part}`, userId });
    const { error: recordingError } = await supabase.from("student_recordings").insert({ user_id: userId, question_source: `ielts_speaking_${part}`, question_id: questionId, audio_url: audioStorageKey, duration_seconds: durationSeconds });
    if (recordingError) console.error("IELTS speaking student_recordings insert error:", recordingError);
  }

  const { error } = await supabase.schema("ielts").from("speaking_attempts").insert({
    user_id: userId,
    question_id: questionId,
    part,
    question_context: context,
    audio_url: audioStorageKey,
    transcript,
    overall_band: typeof result.overall_band === "number" ? result.overall_band : null,
    fluency_score: getScore(result.fluency_coherence),
    lexical_score: getScore(result.lexical_resource),
    grammar_score: getScore(result.grammar_accuracy),
    pronunciation_score: getScore(result.pronunciation),
    duration_seconds: durationSeconds,
    azure_result_json: azure,
    feedback_json: result,
  });

  if (error) console.error("IELTS speaking_attempts insert error:", error);
}

export async function POST(req: Request) {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;
    const { user } = auth;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const questionContext = String(formData.get("questionContext") ?? "").trim();
    const parsedContext = parseQuestionContext(questionContext);
    const rawDurationSeconds = Number(formData.get("durationSeconds"));
    const durationSeconds = Number.isFinite(rawDurationSeconds) ? Math.max(1, Math.floor(rawDurationSeconds)) : 1;

    if (!file) return NextResponse.json({ ok: false, message: "请先完成现场录音" }, { status: 400 });

    const usageLimit = await reserveAiUsage(user.id, AI_FEATURE);
    if (!usageLimit.allowed) return NextResponse.json(getAiLimitResponse(usageLimit), { status: 403 });

    let answerText = "";
    let azurePronunciation = null;

    try {
      const [transcript, azure] = await Promise.all([
        transcribeAudio(file),
        assessAzurePronunciation({ file, referenceText: "", durationSeconds }),
      ]);
      answerText = transcript || azure.summary.recognizedText;
      azurePronunciation = azure;

      const [systemPrompt, userPrompt] = await Promise.all([
        getAiPromptContent("ielts.speaking.score.system"),
        renderAiPrompt("ielts.speaking.score.user", {
          questionContext,
          answerText,
          azureSummary: azurePronunciation?.summary ?? null,
          durationSeconds,
        }),
      ]);

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error("AI 没有返回评分内容");

      const result = JSON.parse(content) as Record<string, unknown>;

      try {
        await saveSpeakingAttempt({ supabase: auth.supabase, userId: user.id, context: parsedContext, file, transcript: answerText, durationSeconds, azure: azurePronunciation?.summary ?? null, result });
      } catch (historyError) {
        const message = historyError instanceof Error ? historyError.message : "IELTS speaking history save failed";
        if (isStudentRecordingUploadError(historyError)) {
          console.error("IELTS speaking recording upload error:", message);
        } else {
          console.error("IELTS speaking history save failed:", historyError);
        }
      }

      await recordAiUsage({ userId: user.id, feature: AI_FEATURE, model: AI_MODEL, promptTokens: completion.usage?.prompt_tokens ?? 0, completionTokens: completion.usage?.completion_tokens ?? 0, totalTokens: completion.usage?.total_tokens ?? 0, status: "success" });

      return NextResponse.json({ ok: true, transcript: answerText, azure: azurePronunciation?.summary ?? null, result });
    } catch (error) {
      await recordAiUsage({ userId: user.id, feature: AI_FEATURE, model: AI_MODEL, status: "error", errorMessage: error instanceof Error ? error.message : "IELTS speaking scoring failed" });
      throw error;
    }
  } catch (error) {
    console.error("IELTS speaking score API error:", error);
    return NextResponse.json({ ok: false, message: "server error" }, { status: 500 });
  }
}
