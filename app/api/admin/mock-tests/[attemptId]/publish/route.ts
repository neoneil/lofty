import { NextRequest, NextResponse } from "next/server";

import { requireApiAdminOrEditor } from "@/lib/auth/require-api-auth";
import { getAdminMockAttemptDetail, publishAdminMockAttemptReport } from "@/lib/mock-test/admin";
import { createAdminClient } from "@/lib/supabase/admin";

type Props = {
  params: Promise<{ attemptId: string }>;
};

export async function POST(request: NextRequest, { params }: Props) {
  const auth = await requireApiAdminOrEditor();
  if (!auth.ok) return auth.response;

  const { attemptId } = await params;
  const body = (await request.json().catch(() => ({}))) as { note?: string };
  if (!attemptId) return NextResponse.json({ ok: false, message: "Missing attempt id." }, { status: 400 });

  try {
    const adminClient = createAdminClient();
    const result = await publishAdminMockAttemptReport({
      client: adminClient,
      request,
      attemptId,
      adminUserId: auth.user.id,
      note: body.note ?? "",
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, message: result.error }, { status: 400 });
    }

    const detail = await getAdminMockAttemptDetail(adminClient, attemptId);
    return NextResponse.json({ ok: true, detail });
  } catch (error) {
    console.error("ADMIN MOCK TEST PUBLISH ERROR", error);
    return NextResponse.json({ ok: false, message: "成绩邮件发送或报告发布失败。" }, { status: 500 });
  }
}
