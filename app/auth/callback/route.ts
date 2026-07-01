
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSafeNextPath } from "@/lib/auth/safe-next-path";
const AUTH_NEXT_COOKIE = "auth_next";

function getCookieValue(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = cookieHeader.split(";").map((item) => item.trim());
  const match = cookies.find((item) => item.startsWith(`${name}=`));

  if (!match) return null;

  return decodeURIComponent(match.slice(name.length + 1));
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
  const next = getSafeNextPath(
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
        `${origin}/login?error=${encodeURIComponent("google_login_failed")}&next=${encodeURIComponent(next)}`
      );
    }

    const user = data.user ?? data.session?.user;

    if (!user) {
      await supabase.auth.signOut();
      return redirectAndClearAuthNext(
        `${origin}/sign-up?error=${encodeURIComponent("profile_required")}&next=${encodeURIComponent(next)}`
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
        `${origin}/sign-up?error=${encodeURIComponent("profile_required")}&next=${encodeURIComponent(next)}`
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
