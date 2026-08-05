import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/require-api-auth";
import { getAchievementConfig, normalizeAchievementExamType } from "@/lib/achievements/configs";
import { collectUnlockedAchievements, createAchievementEngineContext, getHighestUnlockedCategoryLevel } from "@/lib/achievements/engine";
import { getAchievementStatsForUser } from "@/lib/achievements/stats";
import { createAdminClient } from "@/lib/supabase/admin";

type StudyPlan = {
  exam_type: string | null;
};

const EMPTY_OVERVIEW = {
  total_completed: 0,
  total_correct: 0,
  total_wrong: 0,
  overall_accuracy: 0,
  total_study_minutes: 0,
  highest_score: 0,
  highest_ai_score: 0,
  average_score: 0,
  practiced_question_count: 0,
  longest_study_streak_days: 0,
  max_correct_streak: 0,
  midnight_practice_count: 0,
};

export async function GET() {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;

    const supabase = createAdminClient();
    const { data: studyPlan } = await supabase.from("study_plans").select("exam_type").eq("user_id", auth.user.id).maybeSingle<StudyPlan>();
    const examType = normalizeAchievementExamType(studyPlan?.exam_type);
    const config = getAchievementConfig(examType);

    try {
      const { overview, questionTypeStats } = await getAchievementStatsForUser(supabase, auth.user.id, { examType });
      const context = createAchievementEngineContext(config, overview, questionTypeStats);
      const overallLevel = getHighestUnlockedCategoryLevel(config, "overall", context);
      const unlockedAchievements = collectUnlockedAchievements(config, context);

      return NextResponse.json({ ...overview, exam_type: examType, overall_achievement_title: overallLevel?.title ?? null, unlocked_achievements: unlockedAchievements });
    } catch (statsError) {
      console.error("GET ACHIEVEMENT STATS ERROR", statsError);
      return NextResponse.json({ ...EMPTY_OVERVIEW, exam_type: examType, overall_achievement_title: null, unlocked_achievements: [] });
    }
  } catch (error) {
    console.error("GET ACHIEVEMENT OVERVIEW ERROR", error);
    return NextResponse.json({ ok: false, message: "读取成就统计失败" }, { status: 500 });
  }
}
