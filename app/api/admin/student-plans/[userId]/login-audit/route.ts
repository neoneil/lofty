import { NextResponse } from "next/server";

import { getStudentLoginAuditDetail } from "@/lib/admin/student-plan-management";
import { requireApiAdmin } from "@/lib/auth/require-api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_: Request, { params }: { params: Promise<{ userId: string }> }) {
  const auth = await requireApiAdmin();
  if (!auth.ok) return auth.response;

  const { userId } = await params;

  try {
    const audit = await getStudentLoginAuditDetail(createAdminClient(), userId);

    return NextResponse.json({
      ok: true,
      audit,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "读取登录设备详情失败。",
      },
      { status: 500 },
    );
  }
}
