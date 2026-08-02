import { NextRequest, NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/require-api-auth";
import { getLoginDeviceId } from "@/lib/auth/login-audit";
import { createAdminClient } from "@/lib/supabase/admin";

type HeartbeatPayload = {
  path?: string;
  title?: string;
  activeSeconds?: number;
};

function sanitizePath(value: unknown) {
  const path = String(value ?? "").trim();
  if (!path.startsWith("/") || path.startsWith("//")) return "/";
  return path.slice(0, 500);
}

function sanitizeTitle(value: unknown) {
  return String(value ?? "").trim().slice(0, 180);
}

function sanitizeActiveSeconds(value: unknown) {
  const seconds = Math.floor(Number(value ?? 0));
  if (!Number.isFinite(seconds)) return 0;
  return Math.max(0, Math.min(seconds, 120));
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;

    const deviceId = getLoginDeviceId(request);
    if (!deviceId) {
      return NextResponse.json({ ok: true, tracked: false, reason: "missing_device_cookie" });
    }

    const body = (await request.json().catch(() => ({}))) as HeartbeatPayload;
    const admin = createAdminClient();
    const { error } = await admin.rpc("record_user_activity_heartbeat", {
      p_user_id: auth.user.id,
      p_device_id: deviceId,
      p_current_path: sanitizePath(body.path),
      p_current_title: sanitizeTitle(body.title),
      p_active_seconds: sanitizeActiveSeconds(body.activeSeconds),
      p_seen_at: new Date().toISOString(),
    });

    if (error) throw error;

    return NextResponse.json({ ok: true, tracked: true });
  } catch (error) {
    console.error("ACTIVITY HEARTBEAT ERROR", error);
    return NextResponse.json({ ok: true, tracked: false });
  }
}
