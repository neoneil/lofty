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

function getPrivateLearningAudioKey(value: string) {
  const trimmed = value.trim().replace(/^\/+/, "");
  if (trimmed.includes("..")) return null;
  if (!trimmed.startsWith("ielts/listening-vocabulary/audio/")) return null;
  if (!/\.(mp3|m4a|wav|aac|ogg)$/i.test(trimmed)) return null;
  return trimmed;
}

export async function GET(req: Request) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const rawKey = searchParams.get("key") ?? "";
  const studentAudioKey = getStudentAudioPrivateKey(rawKey);
  const learningAudioKey = getPrivateLearningAudioKey(rawKey);
  const key = studentAudioKey ?? learningAudioKey;

  if (!key) {
    return NextResponse.json({ ok: false, message: "Invalid private storage key" }, { status: 400 });
  }

  if (studentAudioKey) {
    const ownerId = getOwnerIdFromStudentAudioKey(studentAudioKey);

    if (!ownerId) {
      return NextResponse.json({ ok: false, message: "Invalid student recording key" }, { status: 400 });
    }

    const isAdmin = await getAdminAccess({ supabase: auth.supabase, user: auth.user });

    if (!isAdmin && ownerId !== auth.user.id) {
      return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.json({
    ok: true,
    url: createPrivateR2PlaybackUrl(key),
    expiresInSeconds: 900,
  });
}
