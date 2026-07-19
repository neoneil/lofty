import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { checkAiUsageLimit, getAiLimitResponse, recordAiUsage } from "@/lib/ai/usage-limit";
import { transcribeAudio } from "@/lib/pte-speaking/transcribe-audio";
import { updateSpeakingRecordingStats } from "@/lib/pte/update-speaking-recording-stats";
import { getStudentRecordingPlaybackUrl, uploadStudentRecordingToPrivateR2 } from "@/lib/storage/student-recordings";

const MODULE_TYPE = "ASQ";
const QUESTION_SOURCE = "asq";
const AI_FEATURE = "pte_asq";
const AI_MODEL = "gpt-4o-transcribe";

function normalizeAnswer(value: string) {
  return value
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(a|an|the)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getAnswerVariants(answerText: string) {
  const rawVariants = answerText
    .split(/\n|,|;|\||\/|\bor\b/i)
    .map((item) => item.trim())
    .filter(Boolean);

  const variants = rawVariants.length ? rawVariants : [answerText];
  return Array.from(new Set(variants.map(normalizeAnswer).filter(Boolean)));
}

function containsContiguousWords(transcript: string, answer: string) {
  const transcriptWords = transcript.split(" ").filter(Boolean);
  const answerWords = answer.split(" ").filter(Boolean);

  if (!transcriptWords.length || !answerWords.length) return false;
  if (answerWords.length > 4) return false;

  for (let index = 0; index <= transcriptWords.length - answerWords.length; index += 1) {
    if (answerWords.every((word, offset) => transcriptWords[index + offset] === word)) {
      return true;
    }
  }

  return false;
}

function scoreAsqAnswer(transcript: string, answerText: string) {
  const normalizedTranscript = normalizeAnswer(transcript);
  const variants = getAnswerVariants(answerText);
  const matchedAnswer = variants.find((answer) => normalizedTranscript === answer || containsContiguousWords(normalizedTranscript, answer)) ?? null;
  const isCorrect = Boolean(matchedAnswer);

  return {
    isCorrect,
    score: isCorrect ? 90 : 0,
    matchedAnswer,
    normalizedTranscript,
    answerVariants: variants,
  };
}

export async function POST(req: Request) {
  try {
    const { supabase, user } = await requireUser("/pte/speaking/asq");

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const questionId = formData.get("questionId") as string;
    const rawDurationSeconds = Number(formData.get("durationSeconds"));
    const durationSeconds = Number.isFinite(rawDurationSeconds)
      ? Math.max(1, Math.floor(rawDurationSeconds))
      : 1;

    if (!file || !questionId) {
      return NextResponse.json({ error: "no file" }, { status: 400 });
    }

    const { data: question, error: questionError } = await supabase
      .schema("pte")
      .from("asq")
      .select("id, question_text, answer_text")
      .eq("id", questionId)
      .single();

    if (questionError || !question) {
      return NextResponse.json({ ok: false, message: "题目不存在" }, { status: 404 });
    }

    const usageLimit = await checkAiUsageLimit(user.id, AI_FEATURE);

    if (!usageLimit.allowed) {
      return NextResponse.json(getAiLimitResponse(usageLimit), { status: 403 });
    }

    const audioStorageKey = await uploadStudentRecordingToPrivateR2({ file, questionSource: "asq", userId: user.id });
    const audioUrl = getStudentRecordingPlaybackUrl(audioStorageKey);

    const { data: recording, error: insertError } = await supabase
      .from("student_recordings")
      .insert({
        user_id: user.id,
        question_source: "asq",
        question_id: questionId,
        audio_url: audioStorageKey,
        duration_seconds: durationSeconds,
      })
      .select("id, question_source, question_id, audio_url, duration_seconds, created_at")
      .single();

    if (insertError || !recording) {
      return NextResponse.json({ error: insertError?.message ?? "recording insert failed" }, { status: 500 });
    }

    let transcript = "";

    try {
      transcript = await transcribeAudio(file);
    } catch (error) {
      await recordAiUsage({
        userId: user.id,
        feature: AI_FEATURE,
        model: AI_MODEL,
        status: "error",
        errorMessage: error instanceof Error ? error.message : "ASQ transcription failed",
      });

      throw error;
    }

    await recordAiUsage({ userId: user.id, feature: AI_FEATURE, model: AI_MODEL, status: "success" });

    const result = scoreAsqAnswer(transcript, question.answer_text ?? "");
    const nowIso = new Date().toISOString();
    const startedAtIso = new Date(Date.now() - durationSeconds * 1000).toISOString();

    const { data: attempt, error: attemptError } = await supabase
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
        user_answer: transcript,
        correct_answer: question.answer_text ?? null,
        is_correct: result.isCorrect,
        accuracy: result.score,
        score: result.score,
        status: "completed",
        ai_feedback: {
          type: "asq_transcription_match",
          transcript,
          matchedAnswer: result.matchedAnswer,
          answerVariants: result.answerVariants,
        },
      })
      .select("id")
      .single();

    if (attemptError || !attempt) {
      console.error("ASQ student_attempts insert error:", attemptError);
      return NextResponse.json({ ok: false, message: "保存练习记录失败" }, { status: 500 });
    }

    try {
      await updateSpeakingRecordingStats({
        supabase,
        userId: user.id,
        moduleType: MODULE_TYPE,
        questionSource: QUESTION_SOURCE,
        questionId,
        durationSeconds,
        score: result.score,
      });
    } catch (statsError) {
      console.error("ASQ stats update error:", statsError);
      return NextResponse.json({ ok: false, message: "更新题目统计失败" }, { status: 500 });
    }

    if (!result.isCorrect) {
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
          console.error("ASQ wrong question insert error:", wrongInsertError);
          return NextResponse.json({ ok: false, message: "更新错题本失败" }, { status: 500 });
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
          console.error("ASQ wrong question update error:", wrongUpdateError);
          return NextResponse.json({ ok: false, message: "更新错题本失败" }, { status: 500 });
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
        console.error("ASQ wrong question resolve error:", wrongResolveError);
        return NextResponse.json({ ok: false, message: "更新错题本失败" }, { status: 500 });
      }
    }

    return NextResponse.json({
      ok: true,
      audioUrl,
      audioStorageKey,
      recordingId: recording.id,
      recording: { ...recording, audio_url: audioUrl },
      attemptId: attempt.id,
      isCorrect: result.isCorrect,
      score: result.score,
      asqFeedback: {
        transcript,
        correctAnswer: question.answer_text ?? "",
        matchedAnswer: result.matchedAnswer,
        answerVariants: result.answerVariants,
      },
    });
  } catch (error) {
    console.error("ASQ upload API crash:", error);
    return NextResponse.json({ ok: false, message: "server error" }, { status: 500 });
  }
}
