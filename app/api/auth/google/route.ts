import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import { getAppOrigin } from "@/lib/auth/app-origin";
import { getSafeNextPath } from "@/lib/auth/safe-next-path";

const AUTH_NEXT_COOKIE = "auth_next";
const AUTH_MODE_COOKIE = "auth_mode";

type SupabaseCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

function createOAuthStartClient(request: NextRequest, supabaseCookies: SupabaseCookie[]) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll().map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setAll(cookiesToSet) {
          supabaseCookies.push(...cookiesToSet);
        },
      },
    }
  );
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const next = getSafeNextPath(searchParams.get("next"));
  const mode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const appOrigin = getAppOrigin(request);
  const supabaseCookies: SupabaseCookie[] = [];
  const supabase = createOAuthStartClient(request, supabaseCookies);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${appOrigin}/auth/callback`,
      skipBrowserRedirect: true,
      queryParams: { prompt: "select_account" },
    },
  });

  if (error || !data.url) {
    console.error("google oauth start error", error);
    const target = mode === "signup" ? "/sign-up-v2" : "/login-v2";
    return NextResponse.redirect(`${origin}${target}?error=google_login_failed&next=${encodeURIComponent(next)}`);
  }

  const response = NextResponse.redirect(data.url);
  supabaseCookies.forEach((cookie) => {
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  });
  response.cookies.set(AUTH_NEXT_COOKIE, next, {
    path: "/",
    maxAge: 600,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
  response.cookies.set(AUTH_MODE_COOKIE, mode, {
    path: "/",
    maxAge: 600,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
