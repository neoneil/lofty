import achievementConfig from "@/constants/achievements/lofty-achievements-wuxia.json";
import { AchievementGallery } from "@/components/achievements/achievement-gallery";
import { requireUser } from "@/lib/auth/require-user";
import { getAchievementStatsForUser } from "@/lib/achievements/stats";
import type { AchievementConfig } from "@/lib/achievements/types";

export default async function AchievementsPage() {
  const { supabase, user } = await requireUser("/achievements");
  const { overview, questionTypeStats } = await getAchievementStatsForUser(supabase, user.id);

  return <AchievementGallery config={achievementConfig as AchievementConfig} overview={overview} questionTypeStats={questionTypeStats} />;
}
