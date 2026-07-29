import { NextRequest, NextResponse } from "next/server";

import { getAppOrigin } from "@/lib/auth/app-origin";
import { getSafeNextPath } from "@/lib/auth/safe-next-path";
import { createClient } from "@/lib/supabase/server";

const AUTH_NEXT_COOKIE = "auth_next";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const next = getSafeNextPath(searchParams.get("next"));
  const mode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const appOrigin = getAppOrigin(request);
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${appOrigin}/auth/callback`,
      skipBrowserRedirect: true,
      queryParams: mode === "signup" ? { prompt: "select_account" } : undefined,
    },
  });

  if (error || !data.url) {
    const target = mode === "signup" ? "/sign-up-v2" : "/login-v2";
    return NextResponse.redirect(`${origin}${target}?error=${encodeURIComponent(error?.message ?? "google_login_failed")}&next=${encodeURIComponent(next)}`);
  }

  const response = NextResponse.redirect(data.url);
  response.cookies.set(AUTH_NEXT_COOKIE, encodeURIComponent(next), {
    path: "/",
    maxAge: 600,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
