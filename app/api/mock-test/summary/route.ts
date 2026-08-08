import { NextResponse } from "next/server";

import { getServerUser } from "@/lib/auth/server-auth";
import { getMockTestDashboard } from "@/lib/mock-test/server";

export async function GET() {
  const context = await getServerUser();
  if (!context) return NextResponse.json({ ok: false, message: "请先登录。" }, { status: 401 });

  try {
    const dashboard = await getMockTestDashboard(context.supabase, context.user.id);
    return NextResponse.json({ ok: true, dashboard });
  } catch (error) {
    console.error("MOCK TEST SUMMARY ERROR", error);
    return NextResponse.json({ ok: false, message: "模考数据加载失败。" }, { status: 500 });
  }
}
