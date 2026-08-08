import { NextRequest, NextResponse } from "next/server";

import { getServerUser } from "@/lib/auth/server-auth";
import { submitPteMockAttempt } from "@/lib/mock-test/pte";

export async function POST(request: NextRequest) {
  const context = await getServerUser();
  if (!context) return NextResponse.json({ ok: false, message: "请先登录。" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { attemptId?: string };
  const attemptId = body.attemptId?.trim() ?? "";
  if (!attemptId) {
    return NextResponse.json({ ok: false, message: "Missing attemptId." }, { status: 400 });
  }

  try {
    await submitPteMockAttempt(context.supabase, context.user.id, attemptId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("SUBMIT PTE MOCK ERROR", error);
    return NextResponse.json({ ok: false, message: "PTE 模考提交失败。" }, { status: 500 });
  }
}
