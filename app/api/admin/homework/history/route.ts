import { NextRequest, NextResponse } from "next/server";

import { requireApiAdminOrEditor } from "@/lib/auth/require-api-auth";
import { listAdminStudentHomeworkHistory } from "@/lib/homework/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAdminOrEditor();
    if (!auth.ok) return auth.response;

    const studentId = request.nextUrl.searchParams.get("student_id")?.trim() ?? "";
    if (!studentId) {
      return NextResponse.json({ ok: false, message: "Missing student_id." }, { status: 400 });
    }

    const history = await listAdminStudentHomeworkHistory(createAdminClient(), studentId);
    return NextResponse.json({ ok: true, history });
  } catch (error) {
    console.error("ADMIN HOMEWORK HISTORY ERROR", error);
    return NextResponse.json({ ok: false, message: "作业历史加载失败。" }, { status: 500 });
  }
}
