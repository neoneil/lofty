import { NextRequest, NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth/require-api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

type IeltsWritingHistoryRow = {
  id: string;
  prompt_question: string;
  essay_text: string;
  overall_band: number | null;
  word_count: number | null;
  feedback_json: unknown;
  created_at: string | null;
};

export async function GET(req: NextRequest) {
  const auth = await requireApiAdmin();
  if (!auth.ok) return auth.response;

  const studentUserId = req.nextUrl.searchParams.get("student_user_id")?.trim() ?? "";

  if (!studentUserId) {
    return NextResponse.json(
      { ok: false, error: "Missing student_user_id." },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .schema("ielts")
    .from("writing_attempts")
    .select("id, prompt_question, essay_text, overall_band, word_count, feedback_json, created_at")
    .eq("user_id", studentUserId)
    .eq("task_type", "task2")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Admin analyze answer history load error:", error);
    return NextResponse.json(
      { ok: false, error: "历史记录加载失败。" },
      { status: 500 },
    );
  }

  const history = ((data ?? []) as IeltsWritingHistoryRow[]).map((item) => ({
    id: item.id,
    prompt_question: item.prompt_question,
    essay_text: item.essay_text,
    overall_band: item.overall_band,
    word_count: item.word_count,
    feedback_json: item.feedback_json,
    created_at: item.created_at,
  }));

  return NextResponse.json({ ok: true, history });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireApiAdmin();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => ({})) as {
    student_user_id?: string;
    attempt_id?: string;
  };
  const studentUserId = body.student_user_id?.trim() ?? "";
  const attemptId = body.attempt_id?.trim() ?? "";

  if (!studentUserId || !attemptId) {
    return NextResponse.json(
      { ok: false, error: "Missing student_user_id or attempt_id." },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .schema("ielts")
    .from("writing_attempts")
    .delete()
    .eq("id", attemptId)
    .eq("user_id", studentUserId)
    .eq("task_type", "task2");

  if (error) {
    console.error("Admin analyze answer history delete error:", error);
    return NextResponse.json(
      { ok: false, error: "历史记录删除失败。" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
