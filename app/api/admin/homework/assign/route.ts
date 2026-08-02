import { NextRequest, NextResponse } from "next/server";

import { requireApiAdminOrEditor } from "@/lib/auth/require-api-auth";
import { assignHomeworkToStudents, normalizeHomeworkExamType } from "@/lib/homework/server";
import { createAdminClient } from "@/lib/supabase/admin";

type AssignHomeworkPayload = {
  studentIds?: string[];
  examType?: string;
  content?: string;
};

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiAdminOrEditor();
    if (!auth.ok) return auth.response;

    const body = (await request.json().catch(() => ({}))) as AssignHomeworkPayload;
    const studentIds = Array.isArray(body.studentIds) ? body.studentIds : [];
    const content = String(body.content ?? "").trim();
    const examType = normalizeHomeworkExamType(body.examType);

    if (studentIds.length === 0) {
      return NextResponse.json({ ok: false, message: "请选择至少一名学生。" }, { status: 400 });
    }

    if (!content) {
      return NextResponse.json({ ok: false, message: "请输入作业内容。" }, { status: 400 });
    }

    const result = await assignHomeworkToStudents({
      supabase: createAdminClient(),
      request,
      teacherId: auth.user.id,
      teacherEmail: auth.user.email ?? null,
      studentIds,
      examType,
      content,
    });

    return NextResponse.json({
      ok: true,
      assignedCount: result.assignments.length,
      emailSentCount: result.emailResults.filter((item) => item.ok).length,
      emailFailedCount: result.emailResults.filter((item) => !item.ok).length,
      emailResults: result.emailResults,
    });
  } catch (error) {
    console.error("ASSIGN HOMEWORK ERROR", error);
    return NextResponse.json({ ok: false, message: "作业发送失败，请确认数据库表已创建后重试。" }, { status: 500 });
  }
}
