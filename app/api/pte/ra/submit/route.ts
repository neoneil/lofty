import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scoreRA } from "@/lib/pte-speaking/score-ra";
import { transcribeAudio } from "@/lib/pte-speaking/transcribe-audio";
import { updateSpeakingRecordingStats } from "@/lib/pte/update-speaking-recording-stats";

const MODULE_TYPE = "RA";
const QUESTION_SOURCE = "ra";

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

    const filePath = `students-audio/ra/${user.id}/${Date.now()}.webm`;

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
    const transcript = await transcribeAudio(file);
    const aiResult = await scoreRA({
      questionText: question.question_text ?? "",
      transcript,
    });

    const feedbackJson = {
      feedback: aiResult.feedback,
      suggestions: aiResult.suggestions,
      raw: aiResult,
    };
    const transcriptText = aiResult.transcript || transcript;
    const score = aiResult.overallScore;
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
        correct_answer: question.question_text ?? null,
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
        content_score: aiResult.contentScore,
        fluency_score: aiResult.fluencyScore,
        pronunciation_score: aiResult.pronunciationScore,
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
        supabase: supabase as any,
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
      aiFeedback: aiResult,
    });
  } catch (error) {
    console.error("RA submit API crash:", error);
    return NextResponse.json(
      { ok: false, message: "server error" },
      { status: 500 },
    );
  }
}
