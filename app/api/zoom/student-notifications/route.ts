import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const authSupabase = await createClient();
    const adminSupabase = createAdminClient();

    const {
      data: { user },
      error: userError,
    } = await authSupabase.auth.getUser();

    if (userError || !user) {
      return Response.json(
        {
          ok: false,
          message: "Not logged in",
        },
        {
          status: 401,
        },
      );
    }

    const { data, error } = await adminSupabase
      .schema("zoom")
      .from("notifications")
      .select("id, title, message, classroom_id, meeting_id, meeting_password, is_read, created_at")
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      })
      .limit(50);

    if (error) {
      console.error("zoom student notifications error:", error);
      return Response.json(
        {
          ok: false,
          message: "课堂通知加载失败。",
        },
        {
          status: 500,
        },
      );
    }

    const notificationList = data ?? [];
    const classroomIds = notificationList
      .map((notification) => notification.classroom_id)
      .filter((classroomId): classroomId is string => Boolean(classroomId));

    const { data: classrooms, error: classroomsError } = classroomIds.length > 0
      ? await adminSupabase
        .schema("zoom")
        .from("classrooms")
        .select("id, student_id, teacher_id, zoom_meeting_id, zoom_password, zoom_join_url, status, created_at, started_at, ended_at")
        .in("id", classroomIds)
      : { data: [], error: null };

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

    const classroomList = classrooms ?? [];
    const activeClassrooms = classroomList.filter((classroom) => classroom.status !== "ended" && !classroom.ended_at);
    const activeClassroomIds = new Set(activeClassrooms.map((classroom) => classroom.id));
    const activeClassroomById = new Map(activeClassrooms.map((classroom) => [classroom.id, classroom]));
    const activeTeacherIds = [...new Set(activeClassrooms.map((classroom) => classroom.teacher_id).filter(Boolean))];
    const activeMeetingIds = [...new Set(activeClassrooms.map((classroom) => classroom.zoom_meeting_id).filter(Boolean))];
    const { data: teacherRooms, error: teacherRoomsError } = activeTeacherIds.length > 0 && activeMeetingIds.length > 0
      ? await adminSupabase
        .schema("zoom")
        .from("teacher_rooms")
        .select("teacher_id, zoom_meeting_id, zoom_password, zoom_join_url")
        .in("teacher_id", activeTeacherIds)
        .in("zoom_meeting_id", activeMeetingIds)
        .eq("is_active", true)
      : { data: [], error: null };

    if (teacherRoomsError) {
      return Response.json(
        {
          ok: false,
          message: teacherRoomsError.message,
        },
        {
          status: 500,
        },
      );
    }

    const teacherRoomPasswordByKey = new Map(
      (teacherRooms ?? []).map((teacherRoom) => [`${teacherRoom.teacher_id}:${teacherRoom.zoom_meeting_id}`, teacherRoom.zoom_password ?? ""]),
    );
    const teacherRoomJoinUrlByKey = new Map(
      (teacherRooms ?? []).map((teacherRoom) => [`${teacherRoom.teacher_id}:${teacherRoom.zoom_meeting_id}`, teacherRoom.zoom_join_url ?? ""]),
    );
    const studentClassroomsByTeacher = new Map<string, typeof classroomList>();

    for (const classroom of classroomList) {
      if (!classroom.teacher_id) continue;

      const teacherClassrooms = studentClassroomsByTeacher.get(classroom.teacher_id) ?? [];
      teacherClassrooms.push(classroom);
      studentClassroomsByTeacher.set(classroom.teacher_id, teacherClassrooms);
    }

    for (const teacherClassrooms of studentClassroomsByTeacher.values()) {
      teacherClassrooms.sort((a, b) => new Date(a.started_at ?? a.created_at).getTime() - new Date(b.started_at ?? b.created_at).getTime());
    }

    const seenMeetingKeys = new Set<string>();
    const activeNotifications = notificationList.filter((notification) => {
      if (notification.classroom_id && !activeClassroomIds.has(notification.classroom_id)) {
        return false;
      }

      const meetingKey = notification.meeting_id || notification.classroom_id || notification.id;

      if (seenMeetingKeys.has(meetingKey)) {
        return false;
      }

      seenMeetingKeys.add(meetingKey);

      return true;
    }).map((notification) => {
      const classroom = notification.classroom_id ? activeClassroomById.get(notification.classroom_id) : null;
      const meetingId = notification.meeting_id || classroom?.zoom_meeting_id || "";
      const teacherRoomKey = classroom ? `${classroom.teacher_id}:${classroom.zoom_meeting_id}` : "";
      const teacherRoomPassword = teacherRoomKey ? teacherRoomPasswordByKey.get(teacherRoomKey) : "";
      const teacherRoomJoinUrl = teacherRoomKey ? teacherRoomJoinUrlByKey.get(teacherRoomKey) : "";
      const meetingPassword = teacherRoomPassword || classroom?.zoom_password || notification.meeting_password || "";
      const teacherClassrooms = classroom?.teacher_id ? studentClassroomsByTeacher.get(classroom.teacher_id) ?? [] : [];
      const classNumber = classroom ? teacherClassrooms.findIndex((item) => item.id === classroom.id) + 1 : null;
      const completedClassCount = teacherClassrooms.filter((item) => item.status === "ended" || item.ended_at).length;
      const params = new URLSearchParams();

      if (meetingPassword.trim()) {
        params.set("pwd", meetingPassword.trim());
      }

      const fallbackJoinUrl = meetingId ? `https://zoom.us/j/${meetingId.replace(/\s/g, "")}${params.toString() ? `?${params.toString()}` : ""}` : "";
      const joinUrl = classroom?.zoom_join_url?.trim() || teacherRoomJoinUrl?.trim() || fallbackJoinUrl;

      return {
        ...notification,
        meeting_id: meetingId || notification.meeting_id,
        meeting_password: meetingPassword,
        join_url: joinUrl,
        class_number: classNumber && classNumber > 0 ? classNumber : null,
        completed_class_count: completedClassCount,
        total_class_count: teacherClassrooms.length,
      };
    });

    return Response.json({
      ok: true,
      notifications: activeNotifications,
    });
  } catch (error) {
    console.error("GET STUDENT ZOOM NOTIFICATIONS ERROR", error);

    return Response.json(
      {
        ok: false,
        message: "Failed to get notifications",
      },
      {
        status: 500,
      },
    );
  }
}
