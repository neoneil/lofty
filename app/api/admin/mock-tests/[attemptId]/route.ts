import { NextRequest, NextResponse } from "next/server";

import { requireApiAdminOrEditor } from "@/lib/auth/require-api-auth";
import { getAdminMockAttemptDetail } from "@/lib/mock-test/admin";
import { createAdminClient } from "@/lib/supabase/admin";

type Props = {
  params: Promise<{ attemptId: string }>;
};

export async function GET(_request: NextRequest, { params }: Props) {
  const auth = await requireApiAdminOrEditor();
  if (!auth.ok) return auth.response;

  const { attemptId } = await params;
  if (!attemptId) {
    return NextResponse.json({ ok: false, message: "Missing attempt id." }, { status: 400 });
  }

  try {
    const detail = await getAdminMockAttemptDetail(createAdminClient(), attemptId);
    return NextResponse.json({ ok: true, detail });
  } catch (error) {
    console.error("ADMIN MOCK TEST DETAIL ERROR", error);
    return NextResponse.json({ ok: false, message: "模考详情加载失败。" }, { status: 500 });
  }
}
