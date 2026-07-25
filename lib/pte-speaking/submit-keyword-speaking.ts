import { NextResponse } from "next/server";

import { reserveAiUsage, getAiLimitResponse, recordAiUsage } from "@/lib/ai/usage-limit";
import { requireApiUser } from "@/lib/auth/require-api-auth";
import { assessAzurePronunciation } from "@/lib/pte-speaking/azure-pronunciation";
import { scoreKeywordContent } from "@/lib/pte-speaking/score-keyword-content";
import { updateSpeakingRecordingStats } from "@/lib/pte/update-speaking-recording-stats";
import { getStudentRecordingPlaybackUrl, isStudentRecordingUploadError, uploadStudentRecordingToPrivateR2 } from "@/lib/storage/student-recordings";

type KeywordSpeakingConfig = {
  questionTable: "di" | "rl" | "rts" | "sgd";
  questionType: "DI" | "RL" | "RTS" | "SGD";
  questionSource: "di" | "rl" | "rts" | "sgd";
  aiFeature: "pte_di" | "pte_rl" | "pte_rts" | "pte_sgd";
  storageFolder: "di" | "rl" | "rts" | "sgd";
  contentFocus: string;
};

const AI_MODEL = "azure-speech-pronunciation";

function toPteScore(value: number | null) {
  return value === null ? 0 : Math.round(Math.max(0, Math.min(100, value)) * 0.9);
}

function buildFeedback({ contentScore, fluencyScore, pronunciationScore, matchedCount, targetMatches, contentFocus }: { contentScore: number; fluencyScore: number; pronunciationScore: number; matchedCount: number; targetMatches: number; contentFocus: string }) {
  const suggestions: string[] = [];
  if (contentScore < 65) suggestions.push(`内容关键词命中 ${matchedCount}/${targetMatches}，优先复述${contentFocus}。`);
  if (fluencyScore < 65) suggestions.push("减少停顿和重复，使用稳定的开头、主体与总结结构连续描述。");
  if (pronunciationScore < 65) suggestions.push("放慢语速并清晰处理重音和词尾，避免为了速度牺牲发音完整度。");
  if (suggestions.length === 0) suggestions.push("三项表现稳定，可继续增加关键细节和总结句来提升表达质量。");

  return {
    feedback: contentScore >= 65 ? "内容覆盖较好，录音已识别到多项题目关键词。" : "内容覆盖仍可加强，需要加入更多与当前题目直接相关的关键词。",
    suggestions,
  };
}

export async function submitKeywordSpeaking(req: Request, config: KeywordSpeakingConfig) {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;
    const { supabase, user } = auth;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const questionId = String(formData.get("questionId") ?? "").trim();
    const rawDurationSeconds = Number(formData.get("durationSeconds"));
    const durationSeconds = Number.isFinite(rawDurationSeconds) ? Math.max(1, Math.floor(rawDurationSeconds)) : 1;

    if (!file || !questionId) return NextResponse.json({ ok: false, message: "参数不完整" }, { status: 400 });

    const { data: question, error: questionError } = await supabase.schema("pte").from(config.questionTable).select("id, ai_keywords").eq("id", questionId).single();
    if (questionError || !question) return NextResponse.json({ ok: false, message: "题目不存在" }, { status: 404 });

    const usageLimit = await reserveAiUsage(user.id, config.aiFeature);
    if (!usageLimit.allowed) return NextResponse.json(getAiLimitResponse(usageLimit), { status: 403 });

    const audioStorageKey = await uploadStudentRecordingToPrivateR2({ file, questionSource: config.storageFolder, userId: user.id });
    const audioUrl = getStudentRecordingPlaybackUrl(audioStorageKey);
    const { error: recordingInsertError } = await supabase.from("student_recordings").insert({ user_id: user.id, question_source: config.questionSource, question_id: questionId, audio_url: audioStorageKey, duration_seconds: durationSeconds });
    if (recordingInsertError) return NextResponse.json({ ok: false, message: "保存录音记录失败" }, { status: 500 });

    let azurePronunciation;
    try {
      azurePronunciation = await assessAzurePronunciation({ file, referenceText: "", durationSeconds });
    } catch (error) {
      await recordAiUsage({ userId: user.id, feature: config.aiFeature, model: AI_MODEL, status: "error", errorMessage: error instanceof Error ? error.message : "Azure scoring failed" });
      throw error;
    }

    const transcript = azurePronunciation.summary.recognizedText.trim();
    const content = scoreKeywordContent({ transcript, rawKeywords: question.ai_keywords });
    const pronunciationScore = azurePronunciation.summary.pronunciationScorePte ?? 0;
    const fluencyScore = toPteScore(azurePronunciation.summary.fluencyScore);
    const overallScore = Math.round((content.score + fluencyScore + pronunciationScore) / 3);
    const feedback = buildFeedback({ contentScore: content.score, fluencyScore, pronunciationScore, matchedCount: content.matchedKeywords.length, targetMatches: content.targetMatches, contentFocus: config.contentFocus });
    const aiResult = { overallScore, contentScore: content.score, fluencyScore, pronunciationScore, transcript, feedback: feedback.feedback, suggestions: feedback.suggestions, keywordAssessment: content, azure: azurePronunciation.summary };
    const feedbackJson = { feedback: aiResult.feedback, suggestions: aiResult.suggestions, raw: aiResult, azure: { summary: azurePronunciation.summary, raw: azurePronunciation.raw } };

    await recordAiUsage({ userId: user.id, feature: config.aiFeature, model: AI_MODEL, status: "success" });

    const score = overallScore;
    const isCorrect = score >= 65;
    const nowIso = new Date().toISOString();
    const startedAtIso = new Date(Date.now() - durationSeconds * 1000).toISOString();
    const { data: studentAttempt, error: studentAttemptError } = await supabase.from("student_attempts").insert({ user_id: user.id, exam_type: "PTE", module_type: config.questionType, question_source: config.questionSource, question_id: questionId, started_at: startedAtIso, submitted_at: nowIso, duration_seconds: durationSeconds, user_answer: transcript, correct_answer: question.ai_keywords || null, is_correct: isCorrect, accuracy: score, score, status: "completed", ai_feedback: feedbackJson }).select("id").single();
    if (studentAttemptError || !studentAttempt) return NextResponse.json({ ok: false, message: "保存练习记录失败" }, { status: 500 });

    const { error: speakingAttemptError } = await supabase.schema("pte").from("speaking_attempts").insert({ user_id: user.id, question_type: config.questionType, question_id: questionId, audio_url: audioStorageKey, transcript, overall_score: score, content_score: content.score, fluency_score: fluencyScore, pronunciation_score: pronunciationScore, accuracy_score: azurePronunciation.summary.accuracyScore, completeness_score: azurePronunciation.summary.completenessScore, azure_result_json: { summary: azurePronunciation.summary, raw: azurePronunciation.raw }, feedback_json: feedbackJson });
    if (speakingAttemptError) return NextResponse.json({ ok: false, message: "保存评分记录失败" }, { status: 500 });

    await updateSpeakingRecordingStats({ supabase, userId: user.id, moduleType: config.questionType, questionSource: config.questionSource, questionId, durationSeconds, score });

    return NextResponse.json({ ok: true, audioUrl, audioStorageKey, attemptId: studentAttempt.id, isCorrect, score, aiFeedback: aiResult });
  } catch (error) {
    if (isStudentRecordingUploadError(error)) {
      return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    }

    console.error(`${config.questionType} submit API crash:`, error);
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "server error" }, { status: 500 });
  }
}
