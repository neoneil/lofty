import { NextResponse } from "next/server";

import { apiUnauthorized, getApiUser } from "@/lib/auth/api-auth";
import { getSelectiveHistoryRows } from "@/lib/selective/history";

export async function GET() {
  const context = await getApiUser();
  if (!context) return apiUnauthorized();

  const { data: profile, error: profileError } = await context.supabase
    .from("profiles")
    .select("full_name")
    .eq("id", context.user.id)
    .single();

  if (profileError) {
    console.error("Selective history profile query failed:", profileError);
  }

  try {
    const history = await getSelectiveHistoryRows(context.supabase, context.user.id);

    return NextResponse.json({
      ok: true,
      user: {
        id: context.user.id,
        email: context.user.email,
        fullName: profile?.full_name || "Student",
      },
      ...history,
    });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "历史记录加载失败。" }, { status: 400 });
  }
}
