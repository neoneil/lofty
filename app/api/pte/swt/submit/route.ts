import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { STUDENT_QUESTION_STAT_SELECT } from "@/lib/pte/select-fields";

import { checkAiUsageLimit, getAiLimitResponse, recordAiUsage } from "@/lib/ai/usage-limit";

import { scoreSWT } from "./scoring/score-swt";

const EXAM_TYPE = "PTE";
const MODULE_TYPE = "SWT";
const QUESTION_SOURCE = "swt";
const QUESTION_TABLE = "swt";
const QUESTION_SCHEMA = "pte";
const AI_FEATURE = "pte_swt";
const AI_MODEL = "gpt-4o-mini";

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

    const usageLimit = await checkAiUsageLimit(user.id, AI_FEATURE);

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

    /*
    ======================================
    QUESTION STATS
    ======================================
    */

    const {
      data: existingStat,
      error: existingStatError,
    } = await supabase
      .from("student_question_stats")
      .select(STUDENT_QUESTION_STAT_SELECT)
      .eq("user_id", user.id)
      .eq(
        "question_source",
        QUESTION_SOURCE
      )
      .eq(
        "question_id",
        String(question.id)
      )
      .maybeSingle();

    if (existingStatError) {

      console.error(
        "student_question_stats select error:",
        existingStatError
      );

      return NextResponse.json(
        {
          ok: false,
          message: "读取题目统计失败",
        },
        { status: 500 }
      );
    }

    /*
    ======================================
    INSERT NEW STATS
    ======================================
    */

    if (!existingStat) {

      const {
        error: insertStatError,
      } = await supabase
        .from("student_question_stats")
        .insert({

          user_id: user.id,

          exam_type: EXAM_TYPE,

          module_type: MODULE_TYPE,

          question_source: QUESTION_SOURCE,

          question_id:
            String(question.id),

          attempt_count: 1,

          completed_count: 1,

          correct_count:
            aiResult.overallScore >= 65
              ? 1
              : 0,

          wrong_count:
            aiResult.overallScore < 65
              ? 1
              : 0,

          total_duration_seconds:
            durationSeconds,

          last_attempt_at: nowIso,

          last_correct_at:
            aiResult.overallScore >= 65
              ? nowIso
              : null,

          last_wrong_at:
            aiResult.overallScore < 65
              ? nowIso
              : null,

          is_practiced: true,

          is_in_wrong_book: false,

          best_score:
            aiResult.overallScore,

          latest_score:
            aiResult.overallScore,
        });

      if (insertStatError) {

        console.error(
          "student_question_stats insert error:",
          insertStatError
        );

        return NextResponse.json(
          {
            ok: false,
            message: "写入题目统计失败",
          },
          { status: 500 }
        );
      }

    } else {

      /*
      ======================================
      UPDATE EXISTING STATS
      ======================================
      */

      const {
        error: updateStatError,
      } = await supabase
        .from("student_question_stats")
        .update({

          attempt_count:
            (existingStat.attempt_count ?? 0) + 1,

          completed_count:
            (existingStat.completed_count ?? 0) + 1,

          correct_count:
            (existingStat.correct_count ?? 0)
            +
            (
              aiResult.overallScore >= 65
                ? 1
                : 0
            ),

          wrong_count:
            (existingStat.wrong_count ?? 0)
            +
            (
              aiResult.overallScore < 65
                ? 1
                : 0
            ),

          total_duration_seconds:
            (
              existingStat.total_duration_seconds ?? 0
            )
            +
            durationSeconds,

          last_attempt_at:
            nowIso,

          last_correct_at:
            aiResult.overallScore >= 65
              ? nowIso
              : existingStat.last_correct_at,

          last_wrong_at:
            aiResult.overallScore < 65
              ? nowIso
              : existingStat.last_wrong_at,

          is_practiced: true,

          latest_score:
            aiResult.overallScore,

          best_score: Math.max(
            existingStat.best_score ?? 0,
            aiResult.overallScore
          ),
        })
        .eq("id", existingStat.id);

      if (updateStatError) {

        console.error(
          "student_question_stats update error:",
          updateStatError
        );

        return NextResponse.json(
          {
            ok: false,
            message: "更新题目统计失败",
          },
          { status: 500 }
        );
      }
    }

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
