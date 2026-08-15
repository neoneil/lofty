import { NextRequest, NextResponse } from "next/server";

import { checkRateLimit, getClientIp } from "@/lib/api/rate-limit";
import { apiRateLimited } from "@/lib/api/responses";
import { getAppOrigin } from "@/lib/auth/app-origin";
import { getSafeNextPath } from "@/lib/auth/safe-next-path";
import { normalizeProfileExamType } from "@/lib/profile/exam-type";
import { createClient } from "@/lib/supabase/server";

type SignupPayload = {
  email?: string;
  password?: string;
  fullName?: string;
  examType?: string;
  exam_type?: string;
  next?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as SignupPayload;
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const fullName = String(body.fullName ?? "").trim();
    const examType = normalizeProfileExamType(body.examType ?? body.exam_type);
    const next = getSafeNextPath(body.next);
    const origin = getAppOrigin(request);
    const limited = checkRateLimit({ key: `auth-signup:${getClientIp(request)}:${email || "unknown"}`, limit: 5, windowMs: 60_000 });
    if (!limited.ok) return apiRateLimited("注册尝试过于频繁，请稍后再试。");

    if (!email) {
      return NextResponse.json({ ok: false, message: "请输入邮箱。" }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ ok: false, message: "请输入密码。" }, { status: 400 });
    }

    if (!examType) {
      return NextResponse.json({ ok: false, message: "请选择你的考试类型：IELTS 或 PTE。" }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          exam_type: examType,
        },
        emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      console.error("signup error", error);
      return NextResponse.json({ ok: false, message: "注册失败，请检查邮箱和密码后重试。" }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      message: "注册成功，请检查邮箱并完成验证。",
    });
  } catch (error) {
    console.error("signup route error", error);
    return NextResponse.json(
      {
        ok: false,
        message: "注册失败，请稍后再试。",
      },
      { status: 500 },
    );
  }
}
