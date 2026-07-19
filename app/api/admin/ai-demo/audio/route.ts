import { NextResponse } from "next/server";

import { getAiDemoVoice } from "@/lib/ai-demo/voices";
import { requireApiAdminOrEditor } from "@/lib/auth/require-api-auth";
import { createPrivateR2PlaybackUrl } from "@/lib/storage/r2-private";

export async function GET(req: Request) {
  const auth = await requireApiAdminOrEditor();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const voice = getAiDemoVoice(searchParams.get("voice"));

  if (!voice) {
    return NextResponse.json({ ok: false, message: "Unknown AI demo voice." }, { status: 404 });
  }

  return NextResponse.redirect(createPrivateR2PlaybackUrl(voice.r2Key));
}
