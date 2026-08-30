import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { recordQuestionOutcome } from "@/lib/pte/record-question-outcome";

import { reserveAiUsage, getAiLimitResponse, recordAiUsage } from "@/lib/ai/usage-limit";
import { isTextTooLong } from "@/lib/api/request-limits";

import { scoreSWT } from "./scoring/score-swt";

const EXAM_TYPE = "PTE";
const MODULE_TYPE = "SWT";
const QUESTION_SOURCE = "swt";
const QUESTION_TABLE = "swt";
const QUESTION_SCHEMA = "pte";
const AI_FEATURE = "pte_swt";
const AI_MODEL = "gpt-4o-mini";
const MAX_USER_ANSWER_LENGTH = 2500;

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

    const rawQuestionId =
      String(body.questionId ?? "").trim();

    const userAnswer =
      String(body.userAnswer ?? "").trim();

    const startedAt =
      Number(body.startedAt ?? Date.now());

    if (!rawQuestionId || !userAnswer) {

      return NextResponse.json(
        { ok: false, message: "参数不完整" },
        { status: 400 }
      );
    }

    if (isTextTooLong(userAnswer, MAX_USER_ANSWER_LENGTH)) {
      return NextResponse.json(
        { ok: false, message: "答案过长，请缩短后再提交。" },
        { status: 400 }
      );
    }


    const {
      data: question,
      error: questionError,
    } = await supabase
      .schema(QUESTION_SCHEMA)
      .from(QUESTION_TABLE)
      .select(
        "id, question_text, answer"
      )
      .eq("id", rawQuestionId)
      .single();

    if (questionError || !question) {

      return NextResponse.json(
        { ok: false, message: "题目不存在" },
        { status: 404 }
      );
    }

    const nowIso =
      new Date().toISOString();

    const startedAtIso =
      new Date(startedAt).toISOString();

    const durationSeconds = Math.max(
      1,
      Math.floor(
        (Date.now() - startedAt) / 1000
      )
    );

    /*
    ======================================
    AI SCORING
    ======================================
    */

    const usageLimit = await reserveAiUsage(user.id, AI_FEATURE);

    if (!usageLimit.allowed) {
      return NextResponse.json(getAiLimitResponse(usageLimit), { status: 403 });
    }

    let aiResult;

    try {
      aiResult = await scoreSWT({

      question_text:
        question.question_text ?? "",

      userAnswer,
      });
    } catch (error) {
      await recordAiUsage({
        userId: user.id,
        feature: AI_FEATURE,
        model: AI_MODEL,
        status: "error",
        errorMessage: error instanceof Error ? error.message : "OpenAI request failed",
      });

      throw error;
    }

    await recordAiUsage({ userId: user.id, feature: AI_FEATURE, model: AI_MODEL, status: "success" });

    /*
    ======================================
    SAVE ATTEMPT
    ======================================
    */

    const {
      data: attempt,
      error: attemptError,
    } = await supabase
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

        correct_answer:
          question.answer ?? null,

        is_correct:
          aiResult.overallScore >= 65,

        accuracy:
          aiResult.overallScore,

        score:
          aiResult.overallScore,

        status: "completed",

        ai_feedback: aiResult,

      })
      .select("id")
      .single();

    if (attemptError || !attempt) {

      console.error(
        "student_attempts insert error:",
        attemptError
      );

      return NextResponse.json(
        {
          ok: false,
          message: "保存练习记录失败",
        },
        { status: 500 }
      );
    }

    await recordQuestionOutcome({ supabase, userId: user.id, examType: EXAM_TYPE, moduleType: MODULE_TYPE, questionSource: QUESTION_SOURCE, questionId: String(question.id), durationSeconds, isCorrect: aiResult.overallScore >= 65, score: aiResult.overallScore });

    /*
    ======================================
    RESPONSE
    ======================================
    */

    return NextResponse.json({

      ok: true,

      attemptId: attempt.id,

      submittedAt: nowIso,

      savedAnswer: userAnswer,

      score:
        aiResult.overallScore,

      aiFeedback:
        aiResult,

      message: "评分完成",
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      {
        ok: false,
        message: "服务器错误",
      },
      { status: 500 }
    );
  }
}
