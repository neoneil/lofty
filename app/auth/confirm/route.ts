import { type EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { applyLoginAuditCookie, recordSuccessfulLogin } from "@/lib/auth/login-audit";
import { getSafeNextPath } from "@/lib/auth/safe-next-path";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = getSafeNextPath(searchParams.get("next"));

  if (token_hash && type) {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      const audit = data.user ? await recordSuccessfulLogin(request, data.user, "magic_link") : null;
      const response = NextResponse.redirect(`${origin}${next}`);
      applyLoginAuditCookie(response, audit);
      return response;
    }

    console.error("verifyOtp error:", error);
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
