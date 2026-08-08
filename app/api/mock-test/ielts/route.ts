import { NextRequest, NextResponse } from "next/server";

import { getServerUser } from "@/lib/auth/server-auth";
import { isMockTestQuotaError } from "@/lib/mock-test/access";
import { isAllowedIeltsMockTest } from "@/lib/mock-test/ielts";
import { loadIeltsMockAttemptPayload } from "@/lib/mock-test/server";

export async function GET(request: NextRequest) {
  const context = await getServerUser();
  if (!context) return NextResponse.json({ ok: false, message: "请先登录。" }, { status: 401 });

  const testNumber = Number(request.nextUrl.searchParams.get("test") ?? "1");
  if (!isAllowedIeltsMockTest(testNumber)) {
    return NextResponse.json({ ok: false, message: "这套 IELTS 模考暂未开放。" }, { status: 404 });
  }

  try {
    const exam = await loadIeltsMockAttemptPayload(context.supabase, context.user.id, testNumber);
    return NextResponse.json({ ok: true, exam });
  } catch (error) {
    if (isMockTestQuotaError(error)) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 403 });
    }
    console.error("LOAD IELTS MOCK ERROR", error);
    return NextResponse.json({ ok: false, message: "IELTS 模考加载失败。" }, { status: 500 });
  }
}
