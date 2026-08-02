import { NextResponse } from "next/server";

import { apiUnauthorized, getApiUser } from "@/lib/auth/api-auth";

export async function GET() {
  const context = await getApiUser();
  if (!context) return apiUnauthorized();

  const { data: profile, error } = await context.supabase
    .from("profiles")
    .select("full_name, selective_access")
    .eq("id", context.user.id)
    .single();

  if (error) {
    console.error("selective profile load error", error);
    return NextResponse.json({ ok: false, message: "用户信息加载失败。" }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: context.user.id,
      email: context.user.email,
      fullName: profile?.full_name || "Student",
      selectiveAccess: profile?.selective_access ?? false,
    },
  });
}
