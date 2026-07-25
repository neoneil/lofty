import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { reserveAiUsage, getAiLimitResponse, recordAiUsage } from "@/lib/ai/usage-limit";
import { assessAzurePronunciation } from "@/lib/pte-speaking/azure-pronunciation";
import { scoreRA } from "@/lib/pte-speaking/score-ra";
import { transcribeAudio } from "@/lib/pte-speaking/transcribe-audio";
import { updateSpeakingRecordingStats } from "@/lib/pte/update-speaking-recording-stats";
import { getStudentRecordingPlaybackUrl, isStudentRecordingUploadError, uploadStudentRecordingToPrivateR2 } from "@/lib/storage/student-recordings";

const MODULE_TYPE = "RA";
const QUESTION_SOURCE = "ra";
const AI_FEATURE = "pte_ra";
const AI_MODEL = "gpt-4o-transcribe+gpt-4o-mini";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, message: "未登录" },
        { status: 401 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const questionId = String(formData.get("questionId") ?? "").trim();
    const rawDurationSeconds = Number(formData.get("durationSeconds"));
    const durationSeconds = Number.isFinite(rawDurationSeconds)
      ? Math.max(1, Math.floor(rawDurationSeconds))
      : 1;

    if (!file || !questionId) {
      return NextResponse.json(
        { ok: false, message: "参数不完整" },
        { status: 400 },
      );
    }

    const { data: question, error: questionError } = await supabase
      .schema("views")
      .from("v_pte_ra_with_user_status")
      .select("id, question_text")
      .eq("id", questionId)
      .single();

    if (questionError || !question) {
      return NextResponse.json(
        { ok: false, message: "题目不存在" },
        { status: 404 },
      );
    }

    const usageLimit = await reserveAiUsage(user.id, AI_FEATURE);

    if (!usageLimit.allowed) {
      return NextResponse.json(getAiLimitResponse(usageLimit), { status: 403 });
    }

    const audioStorageKey = await uploadStudentRecordingToPrivateR2({ file, questionSource: QUESTION_SOURCE, userId: user.id });
    const audioUrl = getStudentRecordingPlaybackUrl(audioStorageKey);

    const { error: recordingInsertError } = await supabase
      .from("student_recordings")
      .insert({
        user_id: user.id,
        question_source: QUESTION_SOURCE,
        question_id: questionId,
        audio_url: audioStorageKey,
        duration_seconds: durationSeconds,
      });

    if (recordingInsertError) {
      console.error("student_recordings insert error:", recordingInsertError);
      return NextResponse.json(
        { ok: false, message: "保存录音记录失败" },
        { status: 500 },
      );
    }

    const questionText = question.question_text ?? "";
    let transcript: string;
    let azurePronunciation;
    let aiResult;

    try {
      [transcript, azurePronunciation] = await Promise.all([
        transcribeAudio(file),
        assessAzurePronunciation({
          file,
          referenceText: questionText,
          durationSeconds,
        }),
      ]);
      aiResult = await scoreRA({
        questionText,
        transcript,
      });
    } catch (error) {
      await recordAiUsage({
        userId: user.id,
        feature: AI_FEATURE,
        model: AI_MODEL,
        status: "error",
        errorMessage: error instanceof Error ? error.message : "AI scoring failed",
      });

      throw error;
    }

    await recordAiUsage({ userId: user.id, feature: AI_FEATURE, model: AI_MODEL, status: "success" });
    const azurePronunciationScore =
      azurePronunciation.summary.pronunciationScorePte ??
      aiResult.pronunciationScore;
    const enhancedResult = {
      ...aiResult,
      pronunciationScore: azurePronunciationScore,
      overallScore: Math.round(
        (
          aiResult.contentScore +
          aiResult.fluencyScore +
          azurePronunciationScore
        ) / 3,
      ),
      azure: azurePronunciation.summary,
    };

    const feedbackJson = {
      feedback: enhancedResult.feedback,
      suggestions: enhancedResult.suggestions,
      raw: enhancedResult,
      azure: {
        summary: azurePronunciation.summary,
        raw: azurePronunciation.raw,
      },
    };
    const transcriptText =
      enhancedResult.transcript ||
      azurePronunciation.summary.recognizedText ||
      transcript;
    const score = enhancedResult.overallScore;
    const isCorrect = score >= 65;
    const nowIso = new Date().toISOString();
    const startedAtIso = new Date(
      Date.now() - durationSeconds * 1000,
    ).toISOString();

    const { data: studentAttempt, error: studentAttemptError } = await supabase
      .from("student_attempts")
      .insert({
        user_id: user.id,
        exam_type: "PTE",
        module_type: MODULE_TYPE,
        question_source: QUESTION_SOURCE,
        question_id: questionId,
        started_at: startedAtIso,
        submitted_at: nowIso,
        duration_seconds: durationSeconds,
        user_answer: transcriptText,
        correct_answer: questionText || null,
        is_correct: isCorrect,
        accuracy: score,
        score,
        status: "completed",
        ai_feedback: feedbackJson,
      })
      .select("id")
      .single();

    if (studentAttemptError || !studentAttempt) {
      console.error("student_attempts insert error:", studentAttemptError);
      return NextResponse.json(
        { ok: false, message: "保存练习记录失败" },
        { status: 500 },
      );
    }

    const { error: attemptError } = await supabase
      .schema("pte")
      .from("speaking_attempts")
      .insert({
        user_id: user.id,
        question_type: MODULE_TYPE,
        question_id: questionId,
        audio_url: audioStorageKey,
        transcript: transcriptText,
        overall_score: score,
        content_score: enhancedResult.contentScore,
        fluency_score: enhancedResult.fluencyScore,
        pronunciation_score: enhancedResult.pronunciationScore,
        accuracy_score: azurePronunciation.summary.accuracyScore,
        completeness_score: azurePronunciation.summary.completenessScore,
        azure_result_json: {
          summary: azurePronunciation.summary,
          raw: azurePronunciation.raw,
        },
        feedback_json: feedbackJson,
      });

    if (attemptError) {
      console.error("speaking_attempts insert error:", attemptError);
      return NextResponse.json(
        { ok: false, message: "保存评分记录失败" },
        { status: 500 },
      );
    }

    try {
      await updateSpeakingRecordingStats({
        supabase,
        userId: user.id,
        moduleType: MODULE_TYPE,
        questionSource: QUESTION_SOURCE,
        questionId,
        durationSeconds,
        score,
      });
    } catch (statsError) {
      console.error("RA speaking stats update error:", statsError);
      return NextResponse.json(
        { ok: false, message: "更新题目统计失败" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      audioUrl,
      audioStorageKey,
      attemptId: studentAttempt.id,
      isCorrect,
      score,
      aiFeedback: enhancedResult,
    });
  } catch (error) {
    if (isStudentRecordingUploadError(error)) {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: error.status },
      );
    }

    console.error("RA submit API crash:", error);
    return NextResponse.json(
      { ok: false, message: "server error" },
      { status: 500 },
    );
  }
}
