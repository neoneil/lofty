import { NextRequest } from "next/server";

import { requireApiRole } from "@/lib/auth/require-api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const auth = await requireApiRole(["admin", "teacher", "editor"]);
    if (!auth.ok) return auth.response;
    const { user } = auth;
    const adminSupabase = createAdminClient();

    const [
      { data: teacherRoom, error: teacherRoomError },
      { data: students, error: studentsError },
      { data: classrooms, error: classroomsError },
    ] = await Promise.all([
      adminSupabase
        .schema("zoom")
        .from("teacher_rooms")
        .select("id, zoom_meeting_id, zoom_password")
        .eq("teacher_id", user.id)
        .eq("is_active", true)
        .maybeSingle(),
      adminSupabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, is_my_student")
        .eq("role", "user")
        .order("created_at", { ascending: false })
        .limit(200),
      adminSupabase
        .schema("zoom")
        .from("classrooms")
        .select("id, student_id, zoom_meeting_id, zoom_password, status, created_at, started_at, ended_at, title")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    if (teacherRoomError) {
      return Response.json(
        {
          ok: false,
          message: teacherRoomError.message,
        },
        {
          status: 500,
        },
      );
    }

    if (studentsError) {
      return Response.json(
        {
          ok: false,
          message: studentsError.message,
        },
        {
          status: 500,
        },
      );
    }

    if (classroomsError) {
      return Response.json(
        {
          ok: false,
          message: classroomsError.message,
        },
        {
          status: 500,
        },
      );
    }

    return Response.json({
      ok: true,
      teacherRoom,
      students: students ?? [],
      classrooms: classrooms ?? [],
    });
  } catch (error) {
    console.error("GET CLASSROOM ADMIN CONTEXT ERROR", error);

    return Response.json(
      {
        ok: false,
        message: "Failed to load classroom admin context",
      },
      {
        status: 500,
      },
    );
  }
}

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

    const now = new Date().toISOString();

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
        status: "started",
        started_at: now,
        ended_at: null,
      })
      .select("id, student_id, zoom_meeting_id, zoom_password, status, created_at, started_at, ended_at, title")
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

    const { count: classNumber, error: classCountError } = await adminSupabase
      .schema("zoom")
      .from("classrooms")
      .select("id", { count: "exact", head: true })
      .eq("teacher_id", user.id)
      .eq("student_id", studentProfile.id);

    if (classCountError) {
      console.error("COUNT CLASSROOM ERROR", classCountError);
    }

    return Response.json({
      ok: true,
      classroomId: classroom.id,
      meetingId: classroom.zoom_meeting_id,
      password: classroom.zoom_password || "",
      classroom,
      classNumber,
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
