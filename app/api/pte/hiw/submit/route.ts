import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recordQuestionOutcome } from "@/lib/pte/record-question-outcome";

const EXAM_TYPE = "PTE";
const MODULE_TYPE = "HIW";
const QUESTION_SOURCE = "hiw";
const QUESTION_TABLE = "hiw";
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
    const selectedIndexes = Array.isArray(body.selectedIndexes)
      ? body.selectedIndexes
      : [];
    const selectedWords = Array.isArray(body.selectedWords)
      ? body.selectedWords
      : [];
    const correctIndexes = Array.isArray(body.correctIndexes)
      ? body.correctIndexes
      : [];
    const correctWords = Array.isArray(body.correctWords)
      ? body.correctWords
      : [];

    const score = Number(body.score ?? 0);
    const total = Number(body.total ?? 0);
    const isCorrect = Boolean(body.isCorrect);
    const startedAt = Number(body.startedAt ?? Date.now());

    if (!rawQuestionId) {
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
      .select(
        "id, question_text, question_body_text, incorrect_words_json, audio_url"
      )
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

    const accuracy = total > 0 ? Math.round((score / total) * 100) : null;

    const userAnswer = JSON.stringify({
      selectedIndexes,
      selectedWords,
    });

    const correctAnswer = JSON.stringify({
      correctIndexes,
      correctWords,
      incorrectWords: question.incorrect_words_json ?? [],
    });

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
        correct_answer: correctAnswer,

        is_correct: isCorrect,
        accuracy,
        score,
        status: "submitted",

        ai_feedback: {
          mode: "auto_scored",
          score,
          total,
          accuracy,
          selectedIndexes,
          selectedWords,
          correctIndexes,
          correctWords,
          isCorrect,
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

    await recordQuestionOutcome({ supabase, userId: user.id, examType: EXAM_TYPE, moduleType: MODULE_TYPE, questionSource: QUESTION_SOURCE, questionId: String(question.id), durationSeconds, isCorrect, score });

    return NextResponse.json({
      ok: true,
      attemptId: attempt.id,
      submittedAt: nowIso,
      savedAnswer: userAnswer,
      score,
      total,
      accuracy,
      isCorrect,
      message: isCorrect ? "全部选对" : "已提交，请查看错选和漏选。",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, message: "服务器错误" },
      { status: 500 }
    );
  }
}
