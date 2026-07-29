import { NextRequest, NextResponse } from "next/server";

import { apiUnauthorized, getApiUser } from "@/lib/auth/api-auth";

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

  const { data, error } = await context.supabase
    .from("study_plans")
    .select("*")
    .eq("user_id", context.user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, plan: data ?? null });
}

export async function PUT(request: NextRequest) {
  const context = await getApiUser();
  if (!context) return apiUnauthorized();

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const payload = {
    user_id: context.user.id,
    exam_type: body.exam_type,
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
    return NextResponse.json({ ok: false, message: existingError.message }, { status: 400 });
  }

  const query = existing?.id
    ? context.supabase.from("study_plans").update(payload).eq("id", existing.id).select("*").single()
    : context.supabase.from("study_plans").insert(payload).select("*").single();

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, plan: data, created: !existing?.id });
}
