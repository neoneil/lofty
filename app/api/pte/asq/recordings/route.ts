import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { getStudentRecordingPlaybackUrl } from "@/lib/storage/student-recordings";

export async function GET(req: NextRequest) {
  const { supabase, user } = await requireUser("/pte/speaking/asq");

  const { searchParams } = new URL(req.url);
  const questionId = searchParams.get("questionId");

  if (!questionId) {
    return NextResponse.json(
      { ok: false, message: "Missing questionId" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("student_recordings")
    .select("id, question_source, question_id, audio_url, duration_seconds, created_at")
    .eq("user_id", user.id)
    .eq("question_source", "asq")
    .eq("question_id", questionId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { ok: false, message: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    recordings:
      data?.map((recording) => ({
        ...recording,
        audio_url: getStudentRecordingPlaybackUrl(recording.audio_url),
      })) ?? [],
  });
}
