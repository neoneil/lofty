import { NextRequest, NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/require-api-auth";

function isMissingTableError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "42P01";
}

export async function GET(req: NextRequest) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const questionId = req.nextUrl.searchParams.get("questionId");
  const part = req.nextUrl.searchParams.get("part");

  if (!questionId) {
    return NextResponse.json({ ok: false, message: "Missing questionId" }, { status: 400 });
  }

  let query = auth.supabase
    .schema("ielts")
    .from("speaking_attempts")
    .select("id, question_id, part, question_context, audio_url, transcript, overall_band, fluency_score, lexical_score, grammar_score, pronunciation_score, duration_seconds, azure_result_json, feedback_json, created_at")
    .eq("user_id", auth.user.id)
    .eq("question_id", questionId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (part === "part1" || part === "part2" || part === "part3") {
    query = query.eq("part", part);
  }

  const { data, error } = await query;

  if (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json({ ok: true, recordings: [], migrationRequired: true });
    }

    console.error("IELTS speaking recordings load error:", error);
    return NextResponse.json({ ok: false, message: "历史录音加载失败。" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, recordings: data ?? [] });
}
