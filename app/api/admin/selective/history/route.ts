import { NextResponse } from "next/server";

import { apiForbidden, apiUnauthorized, getApiStaff } from "@/lib/auth/api-auth";
import { getSelectiveHistoryRows } from "@/lib/selective/history";

export async function GET() {
  const context = await getApiStaff(["admin", "teacher", "editor"]);

  if (!context) {
    return apiUnauthorized();
  }

  if (!["admin", "teacher", "editor"].includes(context.profile.role)) {
    return apiForbidden();
  }

  try {
    const history = await getSelectiveHistoryRows(context.supabase);
    return NextResponse.json({ ok: true, ...history });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "历史记录加载失败。" }, { status: 400 });
  }
}
