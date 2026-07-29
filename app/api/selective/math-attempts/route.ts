import { NextRequest, NextResponse } from "next/server";

import { apiUnauthorized, getApiUser } from "@/lib/auth/api-auth";

export async function POST(request: NextRequest) {
  const context = await getApiUser();
  if (!context) return apiUnauthorized();

  const body = (await request.json().catch(() => ({}))) as {
    studentName?: string;
    questionId?: string;
    questionType?: string;
    answer?: string;
    topicCategory?: string;
    subtopic?: string;
    finalAnswer?: string;
    score?: number;
    maxScore?: number;
    isCorrect?: boolean;
  };

  if (!body.questionId || typeof body.answer !== "string") {
    return NextResponse.json({ ok: false, message: "缺少提交内容。" }, { status: 400 });
  }

  const { error } = await context.supabase
    .schema("selective")
    .from("student_attempts")
    .insert({
      user_id: context.user.id,
      student_name: body.studentName || "Student",
      question_table: "math_questions",
      question_id: body.questionId,
      question_type: body.questionType ?? null,
      submitted_answer_text: body.answer,
      submitted_answer_json: {
        topicCategory: body.topicCategory,
        subtopic: body.subtopic,
        finalAnswer: body.finalAnswer,
      },
      score: body.score ?? 0,
      max_score: body.maxScore ?? 1,
      is_correct: body.isCorrect ?? false,
    });

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
