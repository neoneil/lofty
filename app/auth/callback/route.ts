
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  console.log("=== AUTH CALLBACK DEBUG START ===");
  console.log("request.url =", request.url);
  console.log("origin =", origin);
  console.log("code exists =", !!code);
  console.log("next =", next);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    console.log("exchangeCodeForSession error =", error);
  }

  console.log("redirecting to =", `${origin}${next}`);
  console.log("=== AUTH CALLBACK DEBUG END ===");

  return NextResponse.redirect(`${origin}${next}`);
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