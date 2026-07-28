import { NextRequest, NextResponse } from "next/server";

import { deleteStudentAndRelatedData, STUDY_PLAN_SELECT, type StudyPlanRecord } from "@/lib/admin/student-plan-management";
import { requireApiAdmin } from "@/lib/auth/require-api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

type StudyPlanPayload = {
  id?: string | null;
  exam_type?: string;
  overall_target?: string | number | null;
  overall_current?: string | number | null;
  listening_target?: string | number | null;
  listening_current?: string | number | null;
  reading_target?: string | number | null;
  reading_current?: string | number | null;
  writing_target?: string | number | null;
  writing_current?: string | number | null;
  speaking_target?: string | number | null;
  speaking_current?: string | number | null;
  exam_deadline?: string | null;
  study_goal?: string | null;
  daily_study_hours?: string | null;
  additional_notes?: string | null;
};

function parseScore(value: unknown, label: string, required = false) {
  if (value === null || value === undefined || value === "") {
    if (required) throw new Error(`${label}不能为空。`);
    return null;
  }

  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    throw new Error(`${label}必须是数字。`);
  }

  if (numberValue < 0 || numberValue > 100) {
    throw new Error(`${label}需要在 0-100 之间。`);
  }

  return numberValue;
}

function normalizePayload(userId: string, body: StudyPlanPayload) {
  const examType = body.exam_type === "IELTS" ? "IELTS" : "PTE";
  const examDeadline = String(body.exam_deadline ?? "").trim();

  if (!examDeadline) {
    throw new Error("考试日期不能为空。");
  }

  return {
    user_id: userId,
    exam_type: examType,
    overall_target: parseScore(body.overall_target, "总分目标", true),
    overall_current: parseScore(body.overall_current, "当前总分"),
    listening_target: parseScore(body.listening_target, "听力目标", true),
    listening_current: parseScore(body.listening_current, "当前听力"),
    reading_target: parseScore(body.reading_target, "阅读目标", true),
    reading_current: parseScore(body.reading_current, "当前阅读"),
    writing_target: parseScore(body.writing_target, "写作目标", true),
    writing_current: parseScore(body.writing_current, "当前写作"),
    speaking_target: parseScore(body.speaking_target, "口语目标", true),
    speaking_current: parseScore(body.speaking_current, "当前口语"),
    exam_deadline: examDeadline,
    study_goal: String(body.study_goal ?? "485 Work Visa").trim() || "485 Work Visa",
    daily_study_hours: String(body.daily_study_hours ?? "1-2 Hours").trim() || "1-2 Hours",
    additional_notes: String(body.additional_notes ?? "").trim(),
  };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const auth = await requireApiAdmin();
  if (!auth.ok) return auth.response;

  const { userId } = await params;
  const supabase = createAdminClient();

  try {
    const body = (await req.json()) as StudyPlanPayload;
    const payload = normalizePayload(userId, body);
    const existingPlanId = String(body.id ?? "").trim();

    const result = existingPlanId
      ? await supabase.from("study_plans").update(payload).eq("id", existingPlanId).eq("user_id", userId).select(STUDY_PLAN_SELECT).single()
      : await supabase.from("study_plans").insert(payload).select(STUDY_PLAN_SELECT).single();

    if (result.error) {
      return NextResponse.json({ ok: false, message: result.error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      plan: result.data as StudyPlanRecord,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "保存学习计划失败。",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const auth = await requireApiAdmin();
  if (!auth.ok) return auth.response;

  const { userId } = await params;

  if (userId === auth.user.id) {
    return NextResponse.json({ ok: false, message: "不能在这里删除当前登录的管理员账号。" }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    const body = (await req.json().catch(() => ({}))) as { confirmation?: string };
    const confirmation = String(body.confirmation ?? "").trim();

    const { data: profile, error: profileError } = await supabase.from("profiles").select("id, email, full_name").eq("id", userId).maybeSingle();
    if (profileError) throw profileError;

    const { data: authUserData } = await supabase.auth.admin.getUserById(userId);
    const email = profile?.email ?? authUserData.user?.email ?? "";

    if (confirmation !== userId && confirmation !== email) {
      return NextResponse.json({ ok: false, message: "确认文本不匹配。请输入学生邮箱或用户 ID。" }, { status: 400 });
    }

    const result = await deleteStudentAndRelatedData(supabase, userId);

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "删除学生失败。",
      },
      { status: 500 },
    );
  }
}
