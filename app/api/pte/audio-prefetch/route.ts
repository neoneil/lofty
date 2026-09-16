import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/require-user";
import { normalizePublicStorageUrl } from "@/lib/storage/public-url";

const AUDIO_TABLES = {
  asq: { table: "asq", select: "audio_url" },
  rts: { table: "rts", select: "audio_url" },
  sgd: { table: "sgd", select: "audio_url, storage_path, source_audio_url" },
  hiw: { table: "hiw", select: "audio_url" },
} as const;

type AudioType = keyof typeof AUDIO_TABLES;

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") as AudioType | null;
  const id = request.nextUrl.searchParams.get("id");

  if (!type || !(type in AUDIO_TABLES) || !id) {
    return NextResponse.json({ ok: false, message: "Invalid audio prefetch request." }, { status: 400 });
  }

  const { supabase } = await requireUser("/pte");
  const config = AUDIO_TABLES[type];
  const { data, error } = await supabase.schema("pte").from(config.table).select(config.select).eq("id", id).maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  const row = data as unknown as { audio_url?: string | null; storage_path?: string | null; source_audio_url?: string | null } | null;
  const path = row?.audio_url || row?.storage_path || row?.source_audio_url || null;

  return NextResponse.json({ ok: true, url: path ? normalizePublicStorageUrl(path, "pte-audio") : null });
}
