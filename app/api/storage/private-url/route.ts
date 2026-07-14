import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/require-api-auth";
import { getAdminAccess } from "@/lib/auth/admin-access";
import { createPrivateR2PlaybackUrl } from "@/lib/storage/r2-private";
import { getStudentAudioPrivateKey } from "@/lib/storage/public-url";

function getOwnerIdFromStudentAudioKey(key: string) {
  const parts = key.split("/");
  if (parts.length < 5) return null;
  if (parts[0] !== "pte-audio" || parts[1] !== "students-audio") return null;
  return parts[3] || null;
}

export async function GET(req: Request) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const rawKey = searchParams.get("key") ?? "";
  const key = getStudentAudioPrivateKey(rawKey);

  if (!key) {
    return NextResponse.json({ ok: false, message: "Invalid private storage key" }, { status: 400 });
  }

  const ownerId = getOwnerIdFromStudentAudioKey(key);

  if (!ownerId) {
    return NextResponse.json({ ok: false, message: "Invalid student recording key" }, { status: 400 });
  }

  const isAdmin = await getAdminAccess({ supabase: auth.supabase, user: auth.user });

  if (!isAdmin && ownerId !== auth.user.id) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    url: createPrivateR2PlaybackUrl(key),
    expiresInSeconds: 900,
  });
}
