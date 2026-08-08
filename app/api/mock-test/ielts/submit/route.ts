import { NextRequest, NextResponse } from "next/server";

import { getServerUser } from "@/lib/auth/server-auth";
import { submitIeltsMockAttempt } from "@/lib/mock-test/server";

export async function POST(request: NextRequest) {
  const context = await getServerUser();
  if (!context) return NextResponse.json({ ok: false, message: "请先登录。" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { attemptId?: string };
  const attemptId = body.attemptId?.trim() ?? "";
  if (!attemptId) {
    return NextResponse.json({ ok: false, message: "Missing attemptId." }, { status: 400 });
  }

  try {
    const result = await submitIeltsMockAttempt(context.supabase, context.user.id, attemptId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("SUBMIT IELTS MOCK ERROR", error);
    return NextResponse.json({ ok: false, message: "IELTS 模考提交失败。" }, { status: 500 });
  }
}
