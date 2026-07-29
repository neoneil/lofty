import { NextResponse } from "next/server";

import { getApiUser } from "@/lib/auth/api-auth";

export async function POST() {
  const context = await getApiUser();

  if (context) {
    await context.supabase.auth.signOut();
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("auth_next", "", { path: "/", maxAge: 0, sameSite: "lax" });
  return response;
}
