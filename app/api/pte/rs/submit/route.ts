import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAiUsageLimit, getAiLimitResponse, recordAiUsage } from "@/lib/ai/usage-limit";
import { assessAzurePronunciation } from "@/lib/pte-speaking/azure-pronunciation";
import { scoreRS } from "@/lib/pte-speaking/score-rs";
import { transcribeAudio } from "@/lib/pte-speaking/transcribe-audio";
import { updateSpeakingRecordingStats } from "@/lib/pte/update-speaking-recording-stats";

const MODULE_TYPE = "RS";
const QUESTION_SOURCE = "rs";
const AI_FEATURE = "pte_rs";
const AI_MODEL = "gpt-4o-transcribe+gpt-4o-mini";

function getAudioExtension(file: File) {
  if (file.type.includes("wav")) return "wav";
  if (file.type.includes("ogg")) return "ogg";
  return "webm";
}

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
      .from("v_pte_rs_with_user_status")
      .select("id, question_text")
      .eq("id", questionId)
      .single();

    if (questionError || !question) {
      return NextResponse.json(
        { ok: false, message: "题目不存在" },
        { status: 404 },
      );
    }

    const usageLimit = await checkAiUsageLimit(user.id, AI_FEATURE);

    if (!usageLimit.allowed) {
      return NextResponse.json(getAiLimitResponse(usageLimit), { status: 403 });
    }

    const filePath = `students-audio/rs/${user.id}/${Date.now()}.${getAudioExtension(file)}`;

    const { error: uploadError } = await supabase.storage
      .from("pte-audio")
      .upload(filePath, file);

    if (uploadError) {
      return NextResponse.json(
        { ok: false, message: uploadError.message },
        { status: 500 },
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from("pte-audio")
      .getPublicUrl(filePath);

    const audioUrl = publicUrlData.publicUrl;

    const { error: recordingInsertError } = await supabase
      .from("student_recordings")
      .insert({
        user_id: user.id,
        question_source: QUESTION_SOURCE,
        question_id: questionId,
        audio_url: audioUrl,
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
      aiResult = await scoreRS({
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
        audio_url: audioUrl,
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
      console.error("RS speaking stats update error:", statsError);
      return NextResponse.json(
        { ok: false, message: "更新题目统计失败" },
        { status: 500 },
      );
    }

    if (!isCorrect) {
      const { data: existingWrong } = await supabase
        .from("student_wrong_questions")
        .select("id, wrong_count")
        .eq("user_id", user.id)
        .eq("question_source", QUESTION_SOURCE)
        .eq("question_id", questionId)
        .maybeSingle();

      if (!existingWrong) {
        const { error: wrongInsertError } = await supabase
          .from("student_wrong_questions")
          .insert({
            user_id: user.id,
            exam_type: "PTE",
            module_type: MODULE_TYPE,
            question_source: QUESTION_SOURCE,
            question_id: questionId,
            first_wrong_at: nowIso,
            last_wrong_at: nowIso,
            wrong_count: 1,
            is_resolved: false,
          });

        if (wrongInsertError) {
          console.error("student_wrong_questions insert error:", wrongInsertError);
          return NextResponse.json(
            { ok: false, message: "更新错题本失败" },
            { status: 500 },
          );
        }
      } else {
        const { error: wrongUpdateError } = await supabase
          .from("student_wrong_questions")
          .update({
            last_wrong_at: nowIso,
            wrong_count: (existingWrong.wrong_count ?? 0) + 1,
            is_resolved: false,
            resolved_at: null,
          })
          .eq("id", existingWrong.id);

        if (wrongUpdateError) {
          console.error("student_wrong_questions update error:", wrongUpdateError);
          return NextResponse.json(
            { ok: false, message: "更新错题本失败" },
            { status: 500 },
          );
        }
      }
    } else {
      const { error: wrongResolveError } = await supabase
        .from("student_wrong_questions")
        .update({
          is_resolved: true,
          resolved_at: nowIso,
        })
        .eq("user_id", user.id)
        .eq("question_source", QUESTION_SOURCE)
        .eq("question_id", questionId);

      if (wrongResolveError) {
        console.error("student_wrong_questions resolve error:", wrongResolveError);
        return NextResponse.json(
          { ok: false, message: "更新错题本失败" },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      ok: true,
      audioUrl,
      attemptId: studentAttempt.id,
      isCorrect,
      score,
      aiFeedback: enhancedResult,
    });
  } catch (error) {
    console.error("RS submit API crash:", error);
    return NextResponse.json(
      { ok: false, message: "server error" },
      { status: 500 },
    );
  }
}
