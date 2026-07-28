import { NextRequest } from "next/server";

import { requireApiRole } from "@/lib/auth/require-api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ classroomId: string }> },
) {
  try {
    const auth = await requireApiRole(["admin", "teacher", "editor"]);
    if (!auth.ok) return auth.response;

    const { classroomId } = await params;

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
    const { data: classroom, error: classroomError } = await adminSupabase
      .schema("zoom")
      .from("classrooms")
      .select("id, teacher_id")
      .eq("id", classroomId)
      .eq("teacher_id", auth.user.id)
      .maybeSingle();

    if (classroomError) {
      return Response.json(
        {
          ok: false,
          message: classroomError.message,
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

    const { error: notificationError } = await adminSupabase
      .schema("zoom")
      .from("notifications")
      .delete()
      .eq("classroom_id", classroomId);

    if (notificationError) {
      return Response.json(
        {
          ok: false,
          message: notificationError.message,
        },
        {
          status: 500,
        },
      );
    }

    const { error: deleteError } = await adminSupabase
      .schema("zoom")
      .from("classrooms")
      .delete()
      .eq("id", classroomId)
      .eq("teacher_id", auth.user.id);

    if (deleteError) {
      return Response.json(
        {
          ok: false,
          message: deleteError.message,
        },
        {
          status: 500,
        },
      );
    }

    return Response.json({
      ok: true,
      classroomId,
    });
  } catch (error) {
    console.error("DELETE CLASSROOM ERROR", error);

    return Response.json(
      {
        ok: false,
        message: "Delete classroom failed",
      },
      {
        status: 500,
      },
    );
  }
}
