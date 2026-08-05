import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/require-api-auth";
import { getAchievementConfig, normalizeAchievementExamType } from "@/lib/achievements/configs";
import { collectUnlockedAchievements, createAchievementEngineContext, getHighestUnlockedCategoryLevel } from "@/lib/achievements/engine";
import { getAchievementStatsForUser } from "@/lib/achievements/stats";
import { createAdminClient } from "@/lib/supabase/admin";

type StudyPlan = {
  exam_type: string | null;
};

export async function GET() {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;

    const supabase = createAdminClient();
    const { data: studyPlan } = await supabase.from("study_plans").select("exam_type").eq("user_id", auth.user.id).maybeSingle<StudyPlan>();
    const examType = normalizeAchievementExamType(studyPlan?.exam_type);
    const { overview, questionTypeStats } = await getAchievementStatsForUser(supabase, auth.user.id, { examType });
    const config = getAchievementConfig(examType);
    const context = createAchievementEngineContext(config, overview, questionTypeStats);
    const overallLevel = getHighestUnlockedCategoryLevel(config, "overall", context);
    const unlockedAchievements = collectUnlockedAchievements(config, context);

    return NextResponse.json({ ...overview, exam_type: examType, overall_achievement_title: overallLevel?.title ?? null, unlocked_achievements: unlockedAchievements });
  } catch (error) {
    console.error("GET ACHIEVEMENT OVERVIEW ERROR", error);
    return NextResponse.json({ ok: false, message: "读取成就统计失败" }, { status: 500 });
  }
}
