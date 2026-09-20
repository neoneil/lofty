import { NextRequest, NextResponse } from "next/server";

import { getLearningAnalyticsForUser } from "@/lib/analytics/pte-analytics";
import { requireApiUser } from "@/lib/auth/require-api-auth";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const examType = request.nextUrl.searchParams.get("examType")?.toUpperCase();
  if (examType !== "PTE" && examType !== "IELTS") {
    return NextResponse.json({ ok: false, message: "Unknown exam type." }, { status: 400 });
  }

  try {
    const analytics = await getLearningAnalyticsForUser(auth.supabase, auth.user.id, examType);
    return NextResponse.json({ ok: true, analytics });
  } catch (error) {
    console.error("LEARNING ANALYTICS LOAD ERROR", error);
    return NextResponse.json({ ok: false, message: "学习数据加载失败。" }, { status: 500 });
  }
}
