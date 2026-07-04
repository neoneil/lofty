import { NextResponse } from "next/server";

import { getServerUser } from "@/lib/auth/server-auth";
import { loadPteMockExam } from "@/lib/mock-assessment/load-pte-mock-exam";

export async function GET() {
  const context = await getServerUser();
  if (!context) return NextResponse.json({ ok: false, message: "请先登录" }, { status: 401 });

  try {
    const exam = await loadPteMockExam(context.supabase);
    return NextResponse.json({ ok: true, exam });
  } catch (error) {
    console.error("LOAD PTE MOCK EXAM ERROR", error);
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "PTE 模考组卷失败" }, { status: 500 });
  }
}
