import { NextRequest, NextResponse } from "next/server";

import { requireApiAdminOrEditor } from "@/lib/auth/require-api-auth";
import { getAdminStudentHomeworkDetail, listAdminStudentHomeworkHistory } from "@/lib/homework/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAdminOrEditor();
    if (!auth.ok) return auth.response;

    const studentId = request.nextUrl.searchParams.get("student_id")?.trim() ?? "";
    const homeworkId = request.nextUrl.searchParams.get("homework_id")?.trim() ?? "";
    if (!studentId) {
      return NextResponse.json({ ok: false, message: "Missing student_id." }, { status: 400 });
    }

    const supabase = createAdminClient();
    if (homeworkId) {
      const item = await getAdminStudentHomeworkDetail(supabase, studentId, homeworkId);
      if (!item) {
        return NextResponse.json({ ok: false, message: "作业记录不存在。" }, { status: 404 });
      }
      return NextResponse.json({ ok: true, item });
    }

    const history = await listAdminStudentHomeworkHistory(supabase, studentId);
    return NextResponse.json({ ok: true, history });
  } catch (error) {
    console.error("ADMIN HOMEWORK HISTORY ERROR", error);
    return NextResponse.json({ ok: false, message: "作业历史加载失败。" }, { status: 500 });
  }
}
