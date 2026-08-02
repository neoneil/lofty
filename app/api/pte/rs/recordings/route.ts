import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";

export async function GET(req: NextRequest) {
  const { supabase, user } = await requireUser("/pte/speaking/rs");

  const { searchParams } = new URL(req.url);
  const questionId = searchParams.get("questionId");

  if (!questionId) {
    return NextResponse.json(
      { ok: false, message: "Missing questionId" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("student_recordings")
    .select("id, question_source, question_id, audio_url, duration_seconds, created_at")
    .eq("user_id", user.id)
    .eq("question_source", "rs")
    .eq("question_id", questionId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("RS recordings load error:", error);
    return NextResponse.json(
      { ok: false, message: "录音记录加载失败。" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    recordings: data ?? [],
  });
}
