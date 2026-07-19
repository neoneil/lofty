import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { STUDENT_QUESTION_STAT_SELECT } from "@/lib/pte/select-fields";

const EXAM_TYPE = "PTE";
const MODULE_TYPE = "RO";
const QUESTION_SOURCE = "ro";

type UserAnswer = {
  sentenceId: string;
  text: string;
  order: number;
};

function toSafeStartedAt(value: unknown) {
  const startedAt = Number(value ?? Date.now());
  return Number.isFinite(startedAt) ? startedAt : Date.now();
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

    const body = await req.json();
    const questionId = String(body.questionId ?? "").trim();
    const startedAt = toSafeStartedAt(body.startedAt);
    const userAnswer: UserAnswer[] = Array.isArray(body.userAnswer) ? body.userAnswer : [];

    if (!questionId || userAnswer.length === 0) return NextResponse.json({ ok: false, message: "答案不能为空" }, { status: 400 });

    const { data: question, error: questionError } = await supabase
      .schema("pte")
      .from("ro")
      .select("id, question_body_text")
      .eq("id", questionId)
      .single();

    if (questionError || !question) return NextResponse.json({ ok: false, message: "题目不存在" }, { status: 404 });

    const correctSentences = Array.isArray(question.question_body_text) ? question.question_body_text : [];
    const totalSentences = correctSentences.length;
    let correctCount = 0;

    userAnswer.forEach((item, index) => {
      if (item.sentenceId === `${index}`) correctCount += 1;
    });

    const isCorrect = totalSentences > 0 && correctCount === totalSentences;
    const accuracy = totalSentences > 0 ? Math.round((correctCount / totalSentences) * 100) : 0;
    const nowIso = new Date().toISOString();
    const startedAtIso = new Date(startedAt).toISOString();
    const durationSeconds = Math.max(1, Math.floor((Date.now() - startedAt) / 1000));

    const { data: attempt, error: attemptError } = await supabase
      .from("student_attempts")
      .insert({
        user_id: user.id,
        exam_type: EXAM_TYPE,
        module_type: MODULE_TYPE,
        question_source: QUESTION_SOURCE,
        question_id: questionId,
        started_at: startedAtIso,
        submitted_at: nowIso,
        duration_seconds: durationSeconds,
        user_answer: JSON.stringify(userAnswer),
        correct_answer: JSON.stringify(correctSentences),
        is_correct: isCorrect,
        accuracy,
        score: correctCount,
        status: "completed",
        ai_feedback: {
          mode: "auto_scored",
          correctCount,
          totalSentences,
          accuracy,
        },
      })
      .select("id")
      .single();

    if (attemptError || !attempt) {
      console.error("RO student_attempts insert error:", attemptError);
      return NextResponse.json({ ok: false, message: "保存练习记录失败" }, { status: 500 });
    }

    const { data: existingStat, error: existingStatError } = await supabase
      .from("student_question_stats")
      .select(STUDENT_QUESTION_STAT_SELECT)
      .eq("user_id", user.id)
      .eq("question_source", QUESTION_SOURCE)
      .eq("question_id", questionId)
      .maybeSingle();

    if (existingStatError) {
      console.error("RO student_question_stats select error:", existingStatError);
      return NextResponse.json({ ok: false, message: "读取题目统计失败" }, { status: 500 });
    }

    if (!existingStat) {
      const { error: insertStatError } = await supabase.from("student_question_stats").insert({
        user_id: user.id,
        exam_type: EXAM_TYPE,
        module_type: MODULE_TYPE,
        question_source: QUESTION_SOURCE,
        question_id: questionId,
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
        best_score: correctCount,
        latest_score: correctCount,
      });

      if (insertStatError) {
        console.error("RO student_question_stats insert error:", insertStatError);
        return NextResponse.json({ ok: false, message: "写入题目统计失败" }, { status: 500 });
      }
    } else {
      const { error: updateStatError } = await supabase
        .from("student_question_stats")
        .update({
          attempt_count: (existingStat.attempt_count ?? 0) + 1,
          completed_count: (existingStat.completed_count ?? 0) + 1,
          correct_count: (existingStat.correct_count ?? 0) + (isCorrect ? 1 : 0),
          wrong_count: (existingStat.wrong_count ?? 0) + (isCorrect ? 0 : 1),
          total_duration_seconds: (existingStat.total_duration_seconds ?? 0) + durationSeconds,
          last_attempt_at: nowIso,
          last_correct_at: isCorrect ? nowIso : existingStat.last_correct_at ?? null,
          last_wrong_at: isCorrect ? existingStat.last_wrong_at ?? null : nowIso,
          is_practiced: true,
          is_in_wrong_book: !isCorrect,
          best_score: Math.max(existingStat.best_score ?? 0, correctCount),
          latest_score: correctCount,
        })
        .eq("id", existingStat.id);

      if (updateStatError) {
        console.error("RO student_question_stats update error:", updateStatError);
        return NextResponse.json({ ok: false, message: "更新题目统计失败" }, { status: 500 });
      }
    }

    if (!isCorrect) {
      const { data: existingWrong } = await supabase
        .from("student_wrong_questions")
        .select("id, wrong_count")
        .eq("user_id", user.id)
        .eq("question_source", QUESTION_SOURCE)
        .eq("question_id", questionId)
        .maybeSingle();

      if (existingWrong) {
        await supabase.from("student_wrong_questions").update({ last_wrong_at: nowIso, wrong_count: (existingWrong.wrong_count ?? 0) + 1, is_resolved: false, resolved_at: null }).eq("id", existingWrong.id);
      } else {
        await supabase.from("student_wrong_questions").insert({ user_id: user.id, exam_type: EXAM_TYPE, module_type: MODULE_TYPE, question_source: QUESTION_SOURCE, question_id: questionId, first_wrong_at: nowIso, last_wrong_at: nowIso, wrong_count: 1, is_resolved: false });
      }
    } else {
      await supabase.from("student_wrong_questions").update({ is_resolved: true, resolved_at: nowIso }).eq("user_id", user.id).eq("question_source", QUESTION_SOURCE).eq("question_id", questionId);
    }

    return NextResponse.json({ ok: true, attemptId: attempt.id, isCorrect, score: correctCount, totalSentences, accuracy, durationSeconds });
  } catch (error) {
    console.error("RO submit API crash:", error);
    return NextResponse.json({ ok: false, message: "服务器错误" }, { status: 500 });
  }
}
