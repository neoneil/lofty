import { NextRequest, NextResponse } from "next/server";

import { getAchievementStatsForUser } from "@/lib/achievements/stats";
import { requireApiUser } from "@/lib/auth/require-api-auth";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const examType = request.nextUrl.searchParams.get("examType")?.toUpperCase();
  if (examType !== "PTE" && examType !== "IELTS") {
    return NextResponse.json({ ok: false, message: "Unknown exam type." }, { status: 400 });
  }

  try {
    const stats = await getAchievementStatsForUser(auth.supabase, auth.user.id, { examType });
    return NextResponse.json({ ok: true, stats });
  } catch (error) {
    console.error("ACHIEVEMENT STATS LOAD ERROR", error);
    return NextResponse.json({ ok: false, message: "成就统计加载失败。" }, { status: 500 });
  }
}
