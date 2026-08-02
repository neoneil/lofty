import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";

export async function GET(req: NextRequest) {
  const { supabase, user } = await requireUser("/pte/speaking/ra");

  const { searchParams } = new URL(req.url);
  const questionId = searchParams.get("questionId");

  if (!questionId) {
    return NextResponse.json(
      { ok: false, message: "Missing questionId" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .schema("pte")
    .from("speaking_attempts")
    .select("id, question_type, question_id, audio_url, transcript, overall_score, content_score, fluency_score, pronunciation_score, accuracy_score, completeness_score, feedback_json, azure_result_json, created_at")
    .eq("user_id", user.id)
    .eq("question_type", "RA")
    .eq("question_id", questionId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("RA recordings load error:", error);
    return NextResponse.json(
      { ok: false, message: "录音记录加载失败。" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    practices: data ?? [],
    recordings: data ?? [],
  });
}
