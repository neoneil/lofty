import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { ensurePteQuestionExists } from "@/lib/pte/ensure-question-exists";
import { updateSpeakingRecordingStats } from "@/lib/pte/update-speaking-recording-stats";
import { getStudentRecordingPlaybackUrl, isStudentRecordingUploadError, uploadStudentRecordingToPrivateR2 } from "@/lib/storage/student-recordings";

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

    if (!questionId) {
      return NextResponse.json({ error: "missing questionId" }, { status: 400 });
    }

    const questionExists = await ensurePteQuestionExists(supabase, "rts", questionId);
    if (!questionExists) {
      return NextResponse.json({ error: "question not found" }, { status: 404 });
    }

    const audioStorageKey = await uploadStudentRecordingToPrivateR2({ file, questionSource: "rts", userId: user.id });
    const audioUrl = getStudentRecordingPlaybackUrl(audioStorageKey);

    const { error: insertError } = await supabase
      .from("student_recordings")
      .insert({
        user_id: user.id,
        question_source: "rts",
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
        moduleType: "RTS",
        questionSource: "rts",
        questionId,
      });
    } catch (statsError) {
      console.error("RTS stats update error:", statsError);
      return NextResponse.json({ error: "stats update failed" }, { status: 500 });
    }

    return NextResponse.json({ audioUrl, audioStorageKey });
  } catch (error) {
    if (isStudentRecordingUploadError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("RTS upload API crash:", error);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
