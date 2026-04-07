import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const EXAM_TYPE = "PTE";
const MODULE_TYPE = "SST";
const QUESTION_SOURCE = "sst";
const QUESTION_TABLE = "sst";
const QUESTION_SCHEMA = "pte";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, message: "未登录" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const rawQuestionId = String(body.questionId ?? "").trim();
    const userAnswer = String(body.userAnswer ?? "").trim();
    const startedAt = Number(body.startedAt ?? Date.now());

    if (!rawQuestionId || !userAnswer) {
      return NextResponse.json(
        { ok: false, message: "参数不完整" },
        { status: 400 }
      );
    }

    const parsedQuestionId = Number(rawQuestionId);
    if (!Number.isFinite(parsedQuestionId)) {
      return NextResponse.json(
        { ok: false, message: "题目 ID 不合法" },
        { status: 400 }
      );
    }

    const { data: question, error: questionError } = await supabase
      .schema(QUESTION_SCHEMA)
      .from(QUESTION_TABLE)
      .select("id, question_text, transcript_text, audio_url")
      .eq("id", parsedQuestionId)
      .single();

    if (questionError || !question) {
      return NextResponse.json(
        { ok: false, message: "题目不存在" },
        { status: 404 }
      );
    }

    const nowIso = new Date().toISOString();
    const startedAtIso = new Date(startedAt).toISOString();
    const durationSeconds = Math.max(
      1,
      Math.floor((Date.now() - startedAt) / 1000)
    );

    const { data: attempt, error: attemptError } = await supabase
      .from("student_attempts")
      .insert({
        user_id: user.id,
        exam_type: EXAM_TYPE,
        module_type: MODULE_TYPE,
        question_source: QUESTION_SOURCE,
        question_id: String(question.id),
        started_at: startedAtIso,
        submitted_at: nowIso,
        duration_seconds: durationSeconds,
        user_answer: userAnswer,
        correct_answer: question.transcript_text ?? null,
        is_correct: null,
        accuracy: null,
        score: null,
        status: "submitted",
        ai_feedback: {
          mode: "unscored",
          note: "SST 暂未自动评分，仅保存提交记录。",
        },
      })
      .select("id")
      .single();

    if (attemptError || !attempt) {
      console.error("student_attempts insert error:", attemptError);
      return NextResponse.json(
        { ok: false, message: "保存练习记录失败" },
        { status: 500 }
      );
    }

    const { data: existingStat, error: existingStatError } = await supabase
      .from("student_question_stats")
      .select("*")
      .eq("user_id", user.id)
      .eq("question_source", QUESTION_SOURCE)
      .eq("question_id", String(question.id))
      .maybeSingle();

    if (existingStatError) {
      console.error("student_question_stats select error:", existingStatError);
      return NextResponse.json(
        { ok: false, message: "读取题目统计失败" },
        { status: 500 }
      );
    }

    if (!existingStat) {
      const { error: insertStatError } = await supabase
        .from("student_question_stats")
        .insert({
          user_id: user.id,
          exam_type: EXAM_TYPE,
          module_type: MODULE_TYPE,
          question_source: QUESTION_SOURCE,
          question_id: String(question.id),
          attempt_count: 1,
          completed_count: 1,
          correct_count: 0,
          wrong_count: 0,
          total_duration_seconds: durationSeconds,
          last_attempt_at: nowIso,
          last_correct_at: null,
          last_wrong_at: null,
          is_practiced: true,
          is_in_wrong_book: false,
          best_score: null,
          latest_score: null,
        });

      if (insertStatError) {
        console.error("student_question_stats insert error:", insertStatError);
        return NextResponse.json(
          { ok: false, message: "写入题目统计失败" },
          { status: 500 }
        );
      }
    } else {
      const { error: updateStatError } = await supabase
        .from("student_question_stats")
        .update({
          attempt_count: (existingStat.attempt_count ?? 0) + 1,
          completed_count: (existingStat.completed_count ?? 0) + 1,
          total_duration_seconds:
            (existingStat.total_duration_seconds ?? 0) + durationSeconds,
          last_attempt_at: nowIso,
          is_practiced: true,
        })
        .eq("id", existingStat.id);

      if (updateStatError) {
        console.error("student_question_stats update error:", updateStatError);
        return NextResponse.json(
          { ok: false, message: "更新题目统计失败" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      ok: true,
      attemptId: attempt.id,
      submittedAt: nowIso,
      savedAnswer: userAnswer,
      message: "已提交，当前版本暂不自动评分。",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, message: "服务器错误" },
      { status: 500 }
    );
  }
}