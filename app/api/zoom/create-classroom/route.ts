import { NextRequest } from "next/server";

import { requireApiRole } from "@/lib/auth/require-api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const { studentId } = await request.json();

    if (!studentId) {
      return Response.json(
        {
          ok: false,
          message: "Missing studentId",
        },
        {
          status: 400,
        },
      );
    }

    const auth = await requireApiRole(["admin", "teacher", "editor"]);
    if (!auth.ok) return auth.response;
    const { user } = auth;
    const adminSupabase = createAdminClient();

    const { data: teacherProfile, error: teacherError } = await adminSupabase
      .from("profiles")
      .select("id, full_name")
      .eq("id", user.id)
      .maybeSingle();

    if (teacherError || !teacherProfile) {
      console.error("TEACHER PROFILE NOT FOUND", {
        teacherId: user.id,
        teacherError,
      });

      return Response.json(
        {
          ok: false,
          message: "Teacher profile not found",
        },
        {
          status: 403,
        },
      );
    }

    const { data: studentProfile, error: studentError } = await adminSupabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", studentId)
      .maybeSingle();

    if (studentError || !studentProfile) {
      console.error("STUDENT NOT FOUND", {
        studentId,
        studentError,
      });

      return Response.json(
        {
          ok: false,
          message: "Student not found",
          studentId,
          error: studentError?.message,
        },
        {
          status: 404,
        },
      );
    }

    const { data: teacherRoom, error: teacherRoomError } = await adminSupabase
      .schema("zoom")
      .from("teacher_rooms")
      .select("id, zoom_meeting_id, zoom_password")
      .eq("teacher_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (teacherRoomError || !teacherRoom) {
      console.error("TEACHER ROOM NOT FOUND", {
        teacherId: user.id,
        teacherRoomError,
      });

      return Response.json(
        {
          ok: false,
          message: "Teacher Zoom room not found",
          teacherId: user.id,
        },
        {
          status: 404,
        },
      );
    }

    const { data: classroom, error: classroomError } = await adminSupabase
      .schema("zoom")
      .from("classrooms")
      .insert({
        teacher_id: user.id,
        student_id: studentProfile.id,
        title: `${teacherProfile.full_name || "Teacher"} / ${studentProfile.full_name || studentProfile.email || "Student"} Classroom`,
        zoom_meeting_id: teacherRoom.zoom_meeting_id,
        zoom_password: teacherRoom.zoom_password,
        zoom_join_url: null,
        zoom_start_url: null,
        status: "created",
      })
      .select("id, zoom_meeting_id, zoom_password")
      .single();

    if (classroomError || !classroom) {
      console.error("INSERT CLASSROOM ERROR", classroomError);

      return Response.json(
        {
          ok: false,
          message: "Failed to create classroom",
          error: classroomError?.message,
        },
        {
          status: 500,
        },
      );
    }

    const { error: notificationError } = await adminSupabase
      .schema("zoom")
      .from("notifications")
      .insert({
        user_id: studentProfile.id,
        classroom_id: classroom.id,
        title: "New Zoom Classroom",
        message: `Your teacher has created an online meeting portal. Meeting ID: ${classroom.zoom_meeting_id}`,
        meeting_id: classroom.zoom_meeting_id,
        meeting_password: classroom.zoom_password,
        is_read: false,
      });

    if (notificationError) {
      console.error("INSERT NOTIFICATION ERROR", notificationError);
    }

    return Response.json({
      ok: true,
      classroomId: classroom.id,
      meetingId: classroom.zoom_meeting_id,
      password: classroom.zoom_password || "",
    });
  } catch (error) {
    console.error("CREATE CLASSROOM ERROR", error);

    return Response.json(
      {
        ok: false,
        message: "Create classroom failed",
      },
      {
        status: 500,
      },
    );
  }
}
