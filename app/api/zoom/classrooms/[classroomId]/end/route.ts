import { NextRequest } from "next/server";

import { requireApiRole } from "@/lib/auth/require-api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ classroomId: string }> },
) {
  try {
    const auth = await requireApiRole(["admin", "teacher", "editor"]);
    if (!auth.ok) return auth.response;

    const { classroomId } = await context.params;

    if (!classroomId) {
      return Response.json(
        {
          ok: false,
          message: "Missing classroomId",
        },
        {
          status: 400,
        },
      );
    }

    const adminSupabase = createAdminClient();
    const now = new Date().toISOString();

    const { data: classroom, error } = await adminSupabase
      .schema("zoom")
      .from("classrooms")
      .update({
        status: "ended",
        ended_at: now,
      })
      .eq("id", classroomId)
      .eq("teacher_id", auth.user.id)
      .select("id, student_id, zoom_meeting_id, zoom_password, status, created_at, started_at, ended_at, title")
      .maybeSingle();

    if (error) {
      return Response.json(
        {
          ok: false,
          message: error.message,
        },
        {
          status: 500,
        },
      );
    }

    if (!classroom) {
      return Response.json(
        {
          ok: false,
          message: "Classroom not found",
        },
        {
          status: 404,
        },
      );
    }

    return Response.json({
      ok: true,
      classroom,
    });
  } catch (error) {
    console.error("END CLASSROOM ERROR", error);

    return Response.json(
      {
        ok: false,
        message: "End classroom failed",
      },
      {
        status: 500,
      },
    );
  }
}
