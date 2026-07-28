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

    const notificationList = data ?? [];
    const classroomIds = notificationList
      .map((notification) => notification.classroom_id)
      .filter((classroomId): classroomId is string => Boolean(classroomId));

    const { data: classrooms, error: classroomsError } = classroomIds.length > 0
      ? await adminSupabase
        .schema("zoom")
        .from("classrooms")
        .select("id, status, ended_at")
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

    const activeClassroomIds = new Set(
      (classrooms ?? [])
        .filter((classroom) => classroom.status !== "ended" && !classroom.ended_at)
        .map((classroom) => classroom.id),
    );
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
