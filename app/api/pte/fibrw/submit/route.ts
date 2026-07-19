import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { STUDENT_QUESTION_STAT_SELECT, STUDENT_WRONG_QUESTION_SELECT } from "@/lib/pte/select-fields";

const EXAM_TYPE = "PTE";

const MODULE_TYPE = "FIBRW";

const QUESTION_SOURCE = "fibrw";

const QUESTION_TABLE = "fibrw";

type BlankItem = {
  blankId: string;
  answer: string;
};

function normalizeText(
  text: string,
) {

  return text
    .trim()
    .replace(
      /[.,/#!$%^&*;:{}=\-_`~()?"']/g,
      "",
    )
    .toLowerCase();

}

export async function POST(
  req: Request,
) {

  try {

    const supabase =
      await createClient();

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) {

      return NextResponse.json(
        {
          ok: false,
          message: "未登录",
        },
        {
          status: 401,
        },
      );

    }

    const body =
      await req.json();

    const questionId = String(
      body.questionId ?? "",
    );

    const startedAt = Number(
      body.startedAt ??
        Date.now(),
    );

    const answers: BlankItem[] =
      Array.isArray(
        body.answers,
      )
        ? body.answers
        : [];

    if (
      !questionId ||
      answers.length === 0
    ) {

      return NextResponse.json(
        {
          ok: false,
          message: "答案不能为空",
        },
        {
          status: 400,
        },
      );

    }

    const {
      data: question,
      error: questionError,
    } = await supabase
      .schema("pte")
      .from(
        QUESTION_TABLE,
      )
      .select(`
        id,
        question_body_text,
        blanks_json
      `)
      .eq(
        "id",
        questionId,
      )
      .single();

    if (
      questionError ||
      !question
    ) {

      return NextResponse.json(
        {
          ok: false,
          message: "题目不存在",
        },
        {
          status: 404,
        },
      );

    }

    const correctBlanks =
      Array.isArray(
        question.blanks_json,
      )
        ? question.blanks_json
        : [];

    const resultTokens =
      [];

    let correctCount = 0;

    for (const blank of correctBlanks) {

      const blankId =
        `blank-${blank.blank_index}`;

      const userItem =
        answers.find(
          (item) =>
            item.blankId ===
            blankId,
        );

      const userAnswer =
        normalizeText(
          userItem?.answer ??
            "",
        );

      const correctAnswer =
        normalizeText(
          blank.answer ??
            "",
        );

      const isCorrect =
        userAnswer ===
        correctAnswer;

      if (isCorrect) {

        correctCount++;

      }

      resultTokens.push({
        blankId,
        userAnswer,
        correctAnswer,
        isCorrect,
      });

    }

    const totalBlanks =
      correctBlanks.length;

    const accuracy =
      totalBlanks === 0
        ? 0
        : Math.round(
            (correctCount /
              totalBlanks) *
              100,
          );

    const isCorrect =
      correctCount ===
      totalBlanks;

    const nowIso =
      new Date().toISOString();

    const startedAtIso =
      new Date(
        startedAt,
      ).toISOString();

    const durationSeconds =
      Math.max(
        1,
        Math.floor(
          (Date.now() -
            startedAt) /
            1000,
        ),
      );

    const {
      data: attempt,
      error: attemptError,
    } = await supabase
      .from(
        "student_attempts",
      )
      .insert({
        user_id: user.id,

        exam_type:
          EXAM_TYPE,

        module_type:
          MODULE_TYPE,

        question_source:
          QUESTION_SOURCE,

        question_id:
          questionId,

        started_at:
          startedAtIso,

        submitted_at:
          nowIso,

        duration_seconds:
          durationSeconds,

        user_answer:
          JSON.stringify(
            answers,
          ),

        correct_answer:
          JSON.stringify(
            correctBlanks,
          ),

        is_correct:
          isCorrect,

        accuracy,

        score:
          correctCount,

        status:
          "completed",

        ai_feedback: {
          tokens:
            resultTokens,
        },
      })
      .select("id")
      .single();

    if (
      attemptError ||
      !attempt
    ) {

      return NextResponse.json(
        {
          ok: false,
          message:
            "保存练习记录失败",
        },
        {
          status: 500,
        },
      );

    }

    const {
      data: existingStat,
    } = await supabase
      .from(
        "student_question_stats",
      )
      .select(STUDENT_QUESTION_STAT_SELECT)
      .eq(
        "user_id",
        user.id,
      )
      .eq(
        "question_source",
        QUESTION_SOURCE,
      )
      .eq(
        "question_id",
        questionId,
      )
      .maybeSingle();

    if (!existingStat) {

      await supabase
        .from(
          "student_question_stats",
        )
        .insert({
          user_id:
            user.id,

          exam_type:
            EXAM_TYPE,

          module_type:
            MODULE_TYPE,

          question_source:
            QUESTION_SOURCE,

          question_id:
            questionId,

          attempt_count: 1,

          completed_count: 1,

          correct_count:
            isCorrect
              ? 1
              : 0,

          wrong_count:
            isCorrect
              ? 0
              : 1,

          total_duration_seconds:
            durationSeconds,

          last_attempt_at:
            nowIso,

          last_correct_at:
            isCorrect
              ? nowIso
              : null,

          last_wrong_at:
            !isCorrect
              ? nowIso
              : null,

          is_practiced:
            true,

          is_in_wrong_book:
            !isCorrect,

          best_score:
            correctCount,

          latest_score:
            correctCount,
        });

    } else {

      await supabase
        .from(
          "student_question_stats",
        )
        .update({
          attempt_count:
            (existingStat.attempt_count ??
              0) + 1,

          completed_count:
            (existingStat.completed_count ??
              0) + 1,

          correct_count:
            (existingStat.correct_count ??
              0) +
            (isCorrect
              ? 1
              : 0),

          wrong_count:
            (existingStat.wrong_count ??
              0) +
            (isCorrect
              ? 0
              : 1),

          total_duration_seconds:
            (existingStat.total_duration_seconds ??
              0) +
            durationSeconds,

          last_attempt_at:
            nowIso,

          last_correct_at:
            isCorrect
              ? nowIso
              : existingStat.last_correct_at,

          last_wrong_at:
            !isCorrect
              ? nowIso
              : existingStat.last_wrong_at,

          is_practiced:
            true,

          best_score:
            existingStat.best_score ==
            null
              ? correctCount
              : Math.max(
                  existingStat.best_score,
                  correctCount,
                ),

          latest_score:
            correctCount,
        })
        .eq(
          "id",
          existingStat.id,
        );

    }

    if (!isCorrect) {

      const {
        data: existingWrong,
      } = await supabase
        .from(
          "student_wrong_questions",
        )
        .select(STUDENT_WRONG_QUESTION_SELECT)
        .eq(
          "user_id",
          user.id,
        )
        .eq(
          "question_source",
          QUESTION_SOURCE,
        )
        .eq(
          "question_id",
          questionId,
        )
        .maybeSingle();

      if (!existingWrong) {

        await supabase
          .from(
            "student_wrong_questions",
          )
          .insert({
            user_id:
              user.id,

            exam_type:
              EXAM_TYPE,

            module_type:
              MODULE_TYPE,

            question_source:
              QUESTION_SOURCE,

            question_id:
              questionId,

            first_wrong_at:
              nowIso,

            last_wrong_at:
              nowIso,

            wrong_count: 1,

            is_resolved:
              false,
          });

      } else {

        await supabase
          .from(
            "student_wrong_questions",
          )
          .update({
            last_wrong_at:
              nowIso,

            wrong_count:
              (existingWrong.wrong_count ??
                0) + 1,

            is_resolved:
              false,

            resolved_at:
              null,
          })
          .eq(
            "id",
            existingWrong.id,
          );

      }

    } else {

      await supabase
        .from(
          "student_wrong_questions",
        )
        .update({
          is_resolved:
            true,

          resolved_at:
            nowIso,
        })
        .eq(
          "user_id",
          user.id,
        )
        .eq(
          "question_source",
          QUESTION_SOURCE,
        )
        .eq(
          "question_id",
          questionId,
        );

    }

    return NextResponse.json({
      ok: true,

      attemptId:
        attempt.id,

      isCorrect,

      score:
        correctCount,

      totalBlanks,

      accuracy,

      resultTokens,
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      {
        ok: false,
        message:
          "服务器错误",
      },
      {
        status: 500,
      },
    );

  }

}
