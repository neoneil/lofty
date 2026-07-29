import { NextRequest, NextResponse } from "next/server";

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

    if (!email) {
      return NextResponse.json({ ok: false, message: "请输入邮箱。" }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ ok: false, message: "请输入密码。" }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 401 });
    }

    return NextResponse.json({
      ok: true,
      next,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "登录失败，请稍后再试。",
      },
      { status: 500 },
    );
  }
}
