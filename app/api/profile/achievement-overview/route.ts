import { NextResponse } from "next/server";

import achievementConfig from "@/constants/achievements/lofty-achievements-wuxia.json";
import { collectUnlockedAchievements, createAchievementEngineContext, getHighestUnlockedCategoryLevel } from "@/lib/achievements/engine";
import { getAchievementStatsForUser } from "@/lib/achievements/stats";
import type { AchievementConfig } from "@/lib/achievements/types";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

    const { overview, questionTypeStats } = await getAchievementStatsForUser(supabase, user.id);
    const config = achievementConfig as AchievementConfig;
    const context = createAchievementEngineContext(config, overview, questionTypeStats);
    const overallLevel = getHighestUnlockedCategoryLevel(config, "overall", context);
    const unlockedAchievements = collectUnlockedAchievements(config, context);

    return NextResponse.json({ ...overview, overall_achievement_title: overallLevel?.title ?? null, unlocked_achievements: unlockedAchievements });
  } catch (error) {
    console.error("GET ACHIEVEMENT OVERVIEW ERROR", error);
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "读取成就统计失败" }, { status: 500 });
  }
}
