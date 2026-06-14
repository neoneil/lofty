
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const NEW_OAUTH_USER_BLOCK_WINDOW_MS = 10 * 60 * 1000;
const AUTH_NEXT_COOKIE = "auth_next";

function getCookieValue(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = cookieHeader.split(";").map((item) => item.trim());
  const match = cookies.find((item) => item.startsWith(`${name}=`));

  if (!match) return null;

  return decodeURIComponent(match.slice(name.length + 1));
}

function getSafeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

function redirectAndClearAuthNext(url: string) {
  const response = NextResponse.redirect(url);

  response.cookies.set(AUTH_NEXT_COOKIE, "", {
    path: "/",
    maxAge: 0,
  });

  return response;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = getSafeNext(
    searchParams.get("next") ?? getCookieValue(request, AUTH_NEXT_COOKIE)
  );

  console.log("=== AUTH CALLBACK DEBUG START ===");
  console.log("request.url =", request.url);
  console.log("origin =", origin);
  console.log("code exists =", !!code);
  console.log("next =", next);

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    console.log("exchangeCodeForSession error =", error);

    if (error) {
      return redirectAndClearAuthNext(
        `${origin}/login?error=${encodeURIComponent("google_login_failed")}`
      );
    }

    const user = data.user ?? data.session?.user;

    if (!user) {
      await supabase.auth.signOut();
      return redirectAndClearAuthNext(
        `${origin}/sign-up?error=${encodeURIComponent("profile_required")}`
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, created_at")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      console.log("profile check failed =", profileError);
      await supabase.auth.signOut();
      return redirectAndClearAuthNext(
        `${origin}/sign-up?error=${encodeURIComponent("profile_required")}`
      );
    }

    const profileCreatedAt =
      typeof profile.created_at === "string"
        ? new Date(profile.created_at)
        : null;

    const userCreatedAt =
      typeof user.created_at === "string" ? new Date(user.created_at) : null;

    const now = Date.now();

    const profileWasJustCreated =
      profileCreatedAt !== null &&
      now - profileCreatedAt.getTime() >= 0 &&
      now - profileCreatedAt.getTime() <= NEW_OAUTH_USER_BLOCK_WINDOW_MS;

    const authUserWasJustCreated =
      userCreatedAt !== null &&
      now - userCreatedAt.getTime() >= 0 &&
      now - userCreatedAt.getTime() <= NEW_OAUTH_USER_BLOCK_WINDOW_MS;

    if (profileWasJustCreated || authUserWasJustCreated) {
      console.log("new OAuth profile blocked =", user.id);

      await supabase.auth.signOut();

      const adminSupabase = createAdminClient();

      const { error: deleteProfileError } = await adminSupabase
        .from("profiles")
        .delete()
        .eq("id", user.id);

      if (deleteProfileError) {
        console.error("delete new OAuth profile failed:", deleteProfileError);
      }

      const { error: deleteUserError } =
        await adminSupabase.auth.admin.deleteUser(user.id);

      if (deleteUserError) {
        console.error("delete new OAuth auth user failed:", deleteUserError);
      }

      return redirectAndClearAuthNext(
        `${origin}/sign-up?error=${encodeURIComponent("registration_closed")}`
      );
    }
  }

  console.log("redirecting to =", `${origin}${next}`);
  console.log("=== AUTH CALLBACK DEBUG END ===");

  return redirectAndClearAuthNext(`${origin}${next}`);
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
