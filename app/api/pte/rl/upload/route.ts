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

    if (!file) {
      return NextResponse.json({ error: "no file" }, { status: 400 });
    }

    const audioStorageKey = await uploadStudentRecordingToPrivateR2({ file, questionSource: "rl", userId: user.id });
    const audioUrl = getStudentRecordingPlaybackUrl(audioStorageKey);

    const { error: insertError } = await supabase
      .from("student_recordings")
      .insert({
        user_id: user.id,
        question_source: "rl",
        question_id: questionId,
        audio_url: audioStorageKey,
      });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    try {
      await updateSpeakingRecordingStats({
        supabase,
        userId: user.id,
        moduleType: "RL",
        questionSource: "rl",
        questionId,
      });
    } catch (statsError) {
      console.error("RL stats update error:", statsError);
      return NextResponse.json({ error: "stats update failed" }, { status: 500 });
    }

    return NextResponse.json({ audioUrl, audioStorageKey });
  } catch (error) {
    console.error("RL upload API crash:", error);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
