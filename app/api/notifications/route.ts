import { NextRequest, NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/require-api-auth";
import { listStudentNotifications } from "@/lib/homework/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;

    const notifications = await listStudentNotifications(createAdminClient(), auth.user.id);
    const unreadCount = notifications.filter((notification) => !notification.isRead).length;

    return NextResponse.json({ ok: true, notifications, unreadCount });
  } catch (error) {
    console.error("GET NOTIFICATIONS ERROR", error);
    return NextResponse.json({ ok: true, notifications: [], unreadCount: 0, tableReady: false });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;

    const body = (await request.json().catch(() => ({}))) as { ids?: string[]; all?: boolean };
    const admin = createAdminClient();
    const now = new Date().toISOString();

    let query = admin
      .from("student_notifications")
      .update({ is_read: true, read_at: now })
      .eq("user_id", auth.user.id);

    if (!body.all) {
      const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : [];
      if (ids.length === 0) return NextResponse.json({ ok: true });
      query = query.in("id", ids);
    }

    const { error } = await query;
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PATCH NOTIFICATIONS ERROR", error);
    return NextResponse.json({ ok: false, message: "通知状态更新失败。" }, { status: 500 });
  }
}
