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
      .limit(20);

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

    return Response.json({
      ok: true,
      notifications: data ?? [],
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