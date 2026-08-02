import { NextRequest, NextResponse } from "next/server";

import { checkRateLimit, getClientIp } from "@/lib/api/rate-limit";
import { apiRateLimited } from "@/lib/api/responses";
import { applyLoginAuditCookie, recordFailedLogin, recordSuccessfulLogin } from "@/lib/auth/login-audit";
import { getSafeNextPath } from "@/lib/auth/safe-next-path";
import { createClient } from "@/lib/supabase/server";

type LoginPayload = {
  email?: string;
  password?: string;
  next?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as LoginPayload;
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const next = getSafeNextPath(body.next);
    const limited = checkRateLimit({ key: `auth-login:${getClientIp(request)}:${email || "unknown"}`, limit: 10, windowMs: 60_000 });
    if (!limited.ok) return apiRateLimited("登录尝试过于频繁，请稍后再试。");

    if (!email) {
      return NextResponse.json({ ok: false, message: "请输入邮箱。" }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ ok: false, message: "请输入密码。" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      await recordFailedLogin(request, email, "email", error.message);
      return NextResponse.json({ ok: false, message: "邮箱或密码不正确。" }, { status: 401 });
    }

    const audit = data.user ? await recordSuccessfulLogin(request, data.user, "email") : null;
    const response = NextResponse.json({
      ok: true,
      next,
    });
    applyLoginAuditCookie(response, audit);

    return response;
  } catch (error) {
    console.error("login route error", error);
    return NextResponse.json(
      {
        ok: false,
        message: "登录失败，请稍后再试。",
      },
      { status: 500 },
    );
  }
}
