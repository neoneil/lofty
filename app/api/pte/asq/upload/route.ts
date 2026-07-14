import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { updateSpeakingRecordingStats } from "@/lib/pte/update-speaking-recording-stats";
import { getStudentRecordingPlaybackUrl, uploadStudentRecordingToPrivateR2 } from "@/lib/storage/student-recordings";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const questionId = formData.get("questionId") as string;
    const rawDurationSeconds = Number(formData.get("durationSeconds"));
    const durationSeconds = Number.isFinite(rawDurationSeconds)
      ? Math.max(1, Math.floor(rawDurationSeconds))
      : 1;

    if (!file) {
      return NextResponse.json({ error: "no file" }, { status: 400 });
    }

    const audioStorageKey = await uploadStudentRecordingToPrivateR2({ file, questionSource: "asq", userId: user.id });
    const audioUrl = getStudentRecordingPlaybackUrl(audioStorageKey);

    const { error: insertError } = await supabase
      .from("student_recordings")
      .insert({
        user_id: user.id,
        question_source: "asq",
        question_id: questionId,
        audio_url: audioStorageKey,
        duration_seconds: durationSeconds,
      });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    try {
      await updateSpeakingRecordingStats({
        supabase,
        userId: user.id,
        moduleType: "ASQ",
        questionSource: "asq",
        questionId,
        durationSeconds,
      });
    } catch (statsError) {
      console.error("ASQ stats update error:", statsError);
      return NextResponse.json({ error: "stats update failed" }, { status: 500 });
    }

    return NextResponse.json({ audioUrl, audioStorageKey });
  } catch (error) {
    console.error("ASQ upload API crash:", error);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
