import { NextResponse } from "next/server";

import { getAchievementStatsForUser } from "@/lib/achievements/stats";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

    const { questionTypeStats } = await getAchievementStatsForUser(supabase, user.id);
    return NextResponse.json(questionTypeStats);
  } catch (error) {
    console.error("GET QUESTION TYPE STATS ERROR", error);
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "读取题型统计失败" }, { status: 500 });
  }
}
