
import { NextRequest, NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { applyLoginAuditCookie, recordFailedLogin, recordSuccessfulLogin, type LoginAuditResult } from "@/lib/auth/login-audit";
import { getSafeNextPath } from "@/lib/auth/safe-next-path";
import { createAdminClient } from "@/lib/supabase/admin";
const AUTH_NEXT_COOKIE = "auth_next";
const AUTH_MODE_COOKIE = "auth_mode";

function getUserFullName(user: User) {
  const metadata = user.user_metadata ?? {};
  const fullName = metadata.full_name ?? metadata.name ?? metadata.display_name;
  return typeof fullName === "string" && fullName.trim() ? fullName.trim() : user.email?.split("@")[0] ?? null;
}

function getUserAvatarUrl(user: User) {
  const metadata = user.user_metadata ?? {};
  const avatarUrl = metadata.avatar_url ?? metadata.picture;
  return typeof avatarUrl === "string" && avatarUrl.trim() ? avatarUrl.trim() : null;
}

function getCookieValue(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = cookieHeader.split(";").map((item) => item.trim());
  const match = cookies.find((item) => item.startsWith(`${name}=`));

  if (!match) return null;

  return decodeURIComponent(match.slice(name.length + 1));
}

function redirectAndClearAuthNext(url: string) {
  const response = NextResponse.redirect(url);

  response.cookies.set(AUTH_NEXT_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(AUTH_MODE_COOKIE, "", { path: "/", maxAge: 0 });

  return response;
}

async function ensureProfileForAuthUser(user: User) {
  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) throw profileError;
  if (profile) return profile;

  const { data: insertedProfile, error: insertError } = await admin
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email ?? null,
      full_name: getUserFullName(user),
      avatar_url: getUserAvatarUrl(user),
    })
    .select("id")
    .single();

  if (insertError?.code === "23505") {
    const { data: existingProfile, error: existingError } = await admin
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existingProfile) return existingProfile;
  }

  if (insertError) throw insertError;
  return insertedProfile;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const mode = getCookieValue(request, AUTH_MODE_COOKIE) === "signup" ? "signup" : "login";
  const next = getSafeNextPath(
    searchParams.get("next") ?? getCookieValue(request, AUTH_NEXT_COOKIE)
  );
  let audit: LoginAuditResult | null = null;

  if (oauthError) {
    await recordFailedLogin(request, null, "google", oauthError);
    return redirectAndClearAuthNext(
      `${origin}/${mode === "signup" ? "sign-up" : "login"}?error=${encodeURIComponent("google_login_failed")}&next=${encodeURIComponent(next)}`
    );
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      await recordFailedLogin(request, null, "google", error.message);
      return redirectAndClearAuthNext(
        `${origin}/login?error=${encodeURIComponent("google_login_failed")}&next=${encodeURIComponent(next)}`
      );
    }

    const user = data.user ?? data.session?.user;

    if (!user) {
      await supabase.auth.signOut();
      await recordFailedLogin(request, null, "google", "missing_user");
      return redirectAndClearAuthNext(
        `${origin}/${mode === "signup" ? "sign-up" : "login"}?error=${encodeURIComponent("google_profile_failed")}&next=${encodeURIComponent(next)}`
      );
    }

    try {
      await ensureProfileForAuthUser(user);
    } catch (profileError) {
      console.error("google profile ensure failed", profileError);
      await supabase.auth.signOut();
      await recordFailedLogin(request, user.email ?? null, "google", "profile_ensure_failed");
      return redirectAndClearAuthNext(
        `${origin}/${mode === "signup" ? "sign-up" : "login"}?error=${encodeURIComponent("google_profile_failed")}&next=${encodeURIComponent(next)}`
      );
    }

    audit = await recordSuccessfulLogin(request, user, "google");
  }

  const response = redirectAndClearAuthNext(`${origin}${next}`);
  applyLoginAuditCookie(response, audit);
  return response;
}

// import { NextResponse } from "next/server";
// import { createClient } from "@/lib/supabase/server";

// export async function GET(request: Request) {
//   const { searchParams, origin } = new URL(request.url);
//   const code = searchParams.get("code");
//   const next = searchParams.get("next") ?? "/";

//   if (code) {
//     const supabase = await createClient();
//     await supabase.auth.exchangeCodeForSession(code);
//   }

//   return NextResponse.redirect(`${origin}${next}`);
// }
