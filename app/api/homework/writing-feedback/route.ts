import { NextRequest, NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/require-api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const attemptId = request.nextUrl.searchParams.get("attempt_id")?.trim() ?? "";
  if (!attemptId) {
    return NextResponse.json(
      { ok: false, error: "Missing attempt_id." },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const { data: publication, error: publicationError } = await supabase
    .from("student_homework_assignments")
    .select("id, created_at")
    .eq("student_id", auth.user.id)
    .contains("metadata", {
      source: "admin_analyze_answer",
      writing_attempt_id: attemptId,
    })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (publicationError) {
    console.error("Student writing feedback publication check error:", publicationError);
    return NextResponse.json(
      { ok: false, error: "作文反馈权限检查失败。" },
      { status: 500 },
    );
  }

  if (!publication) {
    return NextResponse.json(
      { ok: false, error: "这份作文反馈尚未由老师发送。" },
      { status: 403 },
    );
  }

  const { data, error } = await supabase
    .schema("ielts")
    .from("writing_attempts")
    .select(
      "id, prompt_question, essay_text, overall_band, word_count, feedback_json, created_at",
    )
    .eq("id", attemptId)
    .eq("user_id", auth.user.id)
    .eq("task_type", "task2")
    .maybeSingle();

  if (error) {
    console.error("Student writing feedback detail load error:", error);
    return NextResponse.json(
      { ok: false, error: "作文反馈加载失败。" },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json(
      { ok: false, error: "作文反馈不存在。" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    item: {
      id: data.id,
      promptQuestion: data.prompt_question,
      essayText: data.essay_text,
      overallBand: data.overall_band,
      wordCount: data.word_count,
      feedback: data.feedback_json,
      createdAt: data.created_at,
      publishedAt: publication.created_at,
    },
  });
}
