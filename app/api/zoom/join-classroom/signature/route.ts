import { NextRequest } from "next/server";

import { createHmac } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireApiUser } from "@/lib/auth/require-api-auth";

export const runtime = "nodejs";

const STAFF_ROLES = new Set(["admin", "teacher", "editor"]);

function base64UrlEncode(value: string) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function getServerEnvValue(...names: string[]) {
  for (const name of names) {
    const processValue = process.env[name]?.trim();

    if (processValue) {
      return processValue;
    }
  }

  return "";
}

function createZoomSignature({
  meetingNumber,
  role,
  sdkKey,
  sdkSecret,
}: {
  meetingNumber: string;
  role: 0 | 1;
  sdkKey: string;
  sdkSecret: string;
}) {
  const iat = Math.floor(Date.now() / 1000) - 30;
  const exp = iat + 60 * 60 * 2;
  const header = {
    alg: "HS256",
    typ: "JWT",
  };
  const payload = {
    sdkKey,
    mn: meetingNumber,
    role,
    iat,
    exp,
    appKey: sdkKey,
    tokenExp: exp,
  };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac("sha256", sdkSecret)
    .update(data)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${data}.${signature}`;
}

async function getUserRole(userId: string) {
  const adminSupabase = createAdminClient();
  const { data, error } = await adminSupabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data?.role ?? null;
}

async function getAuthorizedZoomRole({ userId, requestedRole, meetingNumber }: { userId: string; requestedRole: 0 | 1; meetingNumber: string }) {
  const adminSupabase = createAdminClient();

  if (requestedRole === 1) {
    const role = await getUserRole(userId);

    if (!role || !STAFF_ROLES.has(role)) {
      return null;
    }

    const { data, error } = await adminSupabase
      .schema("zoom")
      .from("teacher_rooms")
      .select("id")
      .eq("teacher_id", userId)
      .eq("zoom_meeting_id", meetingNumber)
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw error;
    return data ? 1 : null;
  }

  const { data: classroom, error: classroomError } = await adminSupabase
    .schema("zoom")
    .from("classrooms")
    .select("id")
    .eq("student_id", userId)
    .eq("zoom_meeting_id", meetingNumber)
    .neq("status", "ended")
    .is("ended_at", null)
    .limit(1)
    .maybeSingle();

  if (classroomError) throw classroomError;
  if (classroom) return 0;

  const { data: teacherRoom, error: teacherRoomError } = await adminSupabase
    .schema("zoom")
    .from("teacher_rooms")
    .select("id")
    .eq("zoom_meeting_id", meetingNumber)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (teacherRoomError) throw teacherRoomError;
  return teacherRoom ? 0 : null;
}

export async function POST(
  request: NextRequest,
) {

  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;

    const {
      meetingNumber,
      role,
    } =
      await request.json();

    const cleanMeetingNumber = String(meetingNumber ?? "").replace(/\s/g, "");
    const requestedZoomRole = role === 1 ? 1 : 0;
    const sdkKey = getServerEnvValue("ZOOM_CLIENT_ID", "NEXT_PUBLIC_ZOOM_CLIENT_ID");
    const sdkSecret = getServerEnvValue("ZOOM_CLIENT_SECRET");

    if (!cleanMeetingNumber) {
      return Response.json(
        {
          ok: false,
          message: "Missing meeting number",
        },
        {
          status: 400,
        },
      );
    }

    if (!sdkKey || !sdkSecret) {
      return Response.json(
        {
          ok: false,
          message: "Zoom SDK credentials are missing",
        },
        {
          status: 500,
        },
      );
    }

    const zoomRole = await getAuthorizedZoomRole({
      userId: auth.user.id,
      requestedRole: requestedZoomRole,
      meetingNumber: cleanMeetingNumber,
    });

    if (zoomRole === null) {
      return Response.json(
        {
          ok: false,
          message: "Forbidden",
        },
        {
          status: 403,
        },
      );
    }

    const signature = createZoomSignature({
      meetingNumber: cleanMeetingNumber,
      role: zoomRole,
      sdkKey,
      sdkSecret,
    });

    return Response.json({
      ok: true,
      signature,
    });

  } catch (error) {

    console.error(
      "SIGNATURE ERROR",
      error,
    );

    return Response.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Failed to create Zoom signature",
      },
      {
        status: 500,
      },
    );

  }

}
