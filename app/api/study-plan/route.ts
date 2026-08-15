import { NextRequest, NextResponse } from "next/server";

import { apiServerError } from "@/lib/api/responses";
import { apiUnauthorized, getApiUser } from "@/lib/auth/api-auth";
import { displayExamTypeToProfile, profileExamTypeToDisplay } from "@/lib/profile/exam-type";

const STUDY_PLAN_COLUMNS = "id, user_id, exam_type, overall_target, overall_current, listening_target, listening_current, reading_target, reading_current, writing_target, writing_current, speaking_target, speaking_current, exam_deadline, study_goal, daily_study_hours, additional_notes, created_at, updated_at";

function nullableNumber(value: unknown) {
  if (value === "" || value === null || value === undefined) return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function requiredNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

export async function GET() {
  const context = await getApiUser();
  if (!context) return apiUnauthorized();

  const [planResult, profileResult] = await Promise.all([
    context.supabase
      .from("study_plans")
      .select(STUDY_PLAN_COLUMNS)
      .eq("user_id", context.user.id)
      .maybeSingle(),
    context.supabase
      .from("profiles")
      .select("exam_type")
      .eq("id", context.user.id)
      .maybeSingle(),
  ]);

  if (planResult.error) {
    console.error("study plan load error", planResult.error);
    return apiServerError("学习计划加载失败，请稍后再试。");
  }

  if (profileResult.error) {
    console.error("study plan profile load error", profileResult.error);
  }

  const profileExamType = profileExamTypeToDisplay(profileResult.data?.exam_type);
  const plan = planResult.data ? { ...planResult.data, exam_type: profileExamType ?? planResult.data.exam_type ?? "PTE" } : null;

  return NextResponse.json({ ok: true, plan, examType: profileExamType });
}

export async function PUT(request: NextRequest) {
  const context = await getApiUser();
  if (!context) return apiUnauthorized();

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const profileExamType = displayExamTypeToProfile(body.exam_type);

  if (!profileExamType) {
    return NextResponse.json({ ok: false, message: "请选择有效的考试类型。" }, { status: 400 });
  }

  const displayExamType = profileExamTypeToDisplay(profileExamType) ?? "PTE";

  const payload = {
    user_id: context.user.id,
    exam_type: displayExamType,
    overall_target: requiredNumber(body.overall_target),
    overall_current: nullableNumber(body.overall_current),
    listening_target: requiredNumber(body.listening_target),
    listening_current: nullableNumber(body.listening_current),
    reading_target: requiredNumber(body.reading_target),
    reading_current: nullableNumber(body.reading_current),
    writing_target: requiredNumber(body.writing_target),
    writing_current: nullableNumber(body.writing_current),
    speaking_target: requiredNumber(body.speaking_target),
    speaking_current: nullableNumber(body.speaking_current),
    exam_deadline: body.exam_deadline,
    study_goal: body.study_goal,
    daily_study_hours: body.daily_study_hours,
    additional_notes: typeof body.additional_notes === "string" ? body.additional_notes : "",
  };

  if (!payload.overall_target || !payload.listening_target || !payload.reading_target || !payload.writing_target || !payload.speaking_target || !payload.exam_deadline) {
    return NextResponse.json({ ok: false, message: "请完整填写学习计划必填项。" }, { status: 400 });
  }

  const { data: existing, error: existingError } = await context.supabase
    .from("study_plans")
    .select("id")
    .eq("user_id", context.user.id)
    .maybeSingle();

  if (existingError) {
    console.error("study plan existing lookup error", existingError);
    return apiServerError("学习计划保存失败，请稍后再试。");
  }

  const { error: profileUpdateError } = await context.supabase
    .from("profiles")
    .update({ exam_type: profileExamType })
    .eq("id", context.user.id);

  if (profileUpdateError) {
    console.error("study plan profile exam type update error", profileUpdateError);
    return apiServerError("考试类型保存失败，请稍后再试。");
  }

  const query = existing?.id
    ? context.supabase.from("study_plans").update(payload).eq("id", existing.id).select(STUDY_PLAN_COLUMNS).single()
    : context.supabase.from("study_plans").insert(payload).select(STUDY_PLAN_COLUMNS).single();

  const { data, error } = await query;

  if (error) {
    console.error("study plan save error", error);
    return apiServerError("学习计划保存失败，请稍后再试。");
  }

  return NextResponse.json({ ok: true, plan: data ? { ...data, exam_type: displayExamType } : data, examType: displayExamType, created: !existing?.id });
}
