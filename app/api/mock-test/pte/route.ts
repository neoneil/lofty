import { NextResponse } from "next/server";

import { getServerUser } from "@/lib/auth/server-auth";
import { loadPteMockExam } from "@/lib/mock-assessment/load-pte-mock-exam";
import type { PteMockExamData } from "@/lib/mock-assessment/pte-mock-types";
import { isMockTestQuotaError } from "@/lib/mock-test/access";
import { getOrCreatePteMockAttempt } from "@/lib/mock-test/pte";

function isPteMockExamData(value: unknown): value is PteMockExamData {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return Array.isArray(row.speaking) && Array.isArray(row.writing) && Array.isArray(row.reading) && Array.isArray(row.listening) && Array.isArray(row.warnings);
}

export async function GET() {
  const context = await getServerUser();
  if (!context) return NextResponse.json({ ok: false, message: "请先登录" }, { status: 401 });

  try {
    const exam = await loadPteMockExam(context.supabase);
    const attempt = await getOrCreatePteMockAttempt(context.supabase, context.user.id, exam);
    return NextResponse.json({ ok: true, exam: isPteMockExamData(attempt.metadata.paper) ? attempt.metadata.paper : exam, attempt });
  } catch (error) {
    if (isMockTestQuotaError(error)) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 403 });
    }
    console.error("LOAD PTE MOCK EXAM ERROR", error);
    return NextResponse.json({ ok: false, message: "PTE 模考组卷失败" }, { status: 500 });
  }
}
