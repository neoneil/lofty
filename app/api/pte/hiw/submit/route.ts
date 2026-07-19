import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { STUDENT_QUESTION_STAT_SELECT } from "@/lib/pte/select-fields";

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

    const { data: existingStat, error: existingStatError } = await supabase
      .from("student_question_stats")
      .select(STUDENT_QUESTION_STAT_SELECT)
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
          correct_count: isCorrect ? 1 : 0,
          wrong_count: isCorrect ? 0 : 1,

          total_duration_seconds: durationSeconds,
          last_attempt_at: nowIso,
          last_correct_at: isCorrect ? nowIso : null,
          last_wrong_at: isCorrect ? null : nowIso,

          is_practiced: true,
          is_in_wrong_book: !isCorrect,

          best_score: score,
          latest_score: score,
        });

      if (insertStatError) {
        console.error("student_question_stats insert error:", insertStatError);
        return NextResponse.json(
          { ok: false, message: "写入题目统计失败" },
          { status: 500 }
        );
      }
    } else {
      const oldBestScore =
        typeof existingStat.best_score === "number"
          ? existingStat.best_score
          : null;

      const nextBestScore =
        oldBestScore === null ? score : Math.max(oldBestScore, score);

      const { error: updateStatError } = await supabase
        .from("student_question_stats")
        .update({
          attempt_count: (existingStat.attempt_count ?? 0) + 1,
          completed_count: (existingStat.completed_count ?? 0) + 1,

          correct_count: (existingStat.correct_count ?? 0) + (isCorrect ? 1 : 0),
          wrong_count: (existingStat.wrong_count ?? 0) + (isCorrect ? 0 : 1),

          total_duration_seconds:
            (existingStat.total_duration_seconds ?? 0) + durationSeconds,

          last_attempt_at: nowIso,
          last_correct_at: isCorrect
            ? nowIso
            : existingStat.last_correct_at ?? null,
          last_wrong_at: isCorrect
            ? existingStat.last_wrong_at ?? null
            : nowIso,

          is_practiced: true,
          is_in_wrong_book: !isCorrect,

          best_score: nextBestScore,
          latest_score: score,
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
