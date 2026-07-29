import { NextRequest, NextResponse } from "next/server";

import { getAppOrigin } from "@/lib/auth/app-origin";
import { getSafeNextPath } from "@/lib/auth/safe-next-path";
import { createClient } from "@/lib/supabase/server";

type SignupPayload = {
  email?: string;
  password?: string;
  fullName?: string;
  next?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as SignupPayload;
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const fullName = String(body.fullName ?? "").trim();
    const next = getSafeNextPath(body.next);
    const origin = getAppOrigin(request);

    if (!email) {
      return NextResponse.json({ ok: false, message: "请输入邮箱。" }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ ok: false, message: "请输入密码。" }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      message: "注册成功，请检查邮箱并完成验证。",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "注册失败，请稍后再试。",
      },
      { status: 500 },
    );
  }
}
