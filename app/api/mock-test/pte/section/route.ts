import { NextRequest, NextResponse } from "next/server";

import { getServerUser } from "@/lib/auth/server-auth";
import { savePteMockSection, type PteSectionResponsePayload } from "@/lib/mock-test/pte";
import { uploadPrivateR2Object } from "@/lib/storage/r2-private";
import { validateStudentRecordingFile } from "@/lib/storage/student-recordings";

type JsonPayload = {
  attemptId?: string;
  sectionKey?: string;
  nextSectionKey?: string | null;
  responses?: PteSectionResponsePayload[];
};

function getAudioExtension(file: File) {
  if (file.type.includes("wav")) return "wav";
  if (file.type.includes("ogg")) return "ogg";
  if (file.type.includes("mpeg") || file.type.includes("mp3")) return "mp3";
  if (file.type.includes("mp4") || file.type.includes("m4a")) return "m4a";
  return "webm";
}

export async function POST(request: NextRequest) {
  const context = await getServerUser();
  if (!context) return NextResponse.json({ ok: false, message: "请先登录。" }, { status: 401 });

  try {
    const form = await request.formData();
    const payload = JSON.parse(String(form.get("payload") ?? "{}")) as JsonPayload;
    const attemptId = payload.attemptId?.trim() ?? "";
    const sectionKey = payload.sectionKey?.trim() ?? "";
    if (!attemptId || !sectionKey) {
      return NextResponse.json({ ok: false, message: "Missing attemptId or sectionKey." }, { status: 400 });
    }

    const responses = payload.responses ?? [];
    for (const response of responses) {
      const file = form.get(`recording:${response.questionKey}`);
      if (!(file instanceof File) || file.size <= 0) continue;
      validateStudentRecordingFile(file);
      const extension = getAudioExtension(file);
      const key = `mock-tests/${context.user.id}/${attemptId}/${response.question.type}-${response.questionKey}-${Date.now()}.${extension}`.replace(/[^a-zA-Z0-9/_.,:-]/g, "-");
      await uploadPrivateR2Object({ key, file, contentType: file.type || "audio/webm" });
      response.responseFiles = [
        ...(response.responseFiles ?? []),
        {
          storage: "r2",
          key,
          mimeType: file.type || "audio/webm",
          size: file.size,
          questionType: response.question.type,
        },
      ];
    }

    await savePteMockSection({
      client: context.supabase,
      userId: context.user.id,
      attemptId,
      sectionKey,
      responses,
      nextSectionKey: payload.nextSectionKey ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("SAVE PTE MOCK SECTION ERROR", error);
    return NextResponse.json({ ok: false, message: "PTE section 保存失败。" }, { status: 500 });
  }
}
