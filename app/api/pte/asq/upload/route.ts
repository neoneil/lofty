import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

    const filePath = `students-audio/asq/${user.id}/${Date.now()}.webm`;

    const { error: uploadError } = await supabase.storage
      .from("pte-audio")
      .upload(filePath, file);

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from("pte-audio")
      .getPublicUrl(filePath);

    const audioUrl = publicUrlData.publicUrl;

    const { error: insertError } = await supabase
      .from("student_recordings")
      .insert({
        user_id: user.id,
        question_source: "asq",
        question_id: questionId,
        audio_url: audioUrl,
      });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ audioUrl });
  } catch (error) {
    console.error("ASQ upload API crash:", error);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
