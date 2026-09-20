import { AchievementsPageClient } from "@/components/achievements/achievements-page-client";
import { getAchievementStatsForUser } from "@/lib/achievements/stats";
import { normalizeAchievementExamType } from "@/lib/achievements/configs";
import { requireUser } from "@/lib/auth/require-user";

type Profile = {
  exam_type: string | null;
};

export default async function AchievementsPage() {
  const { supabase, user } = await requireUser("/achievements");
  const { data: profile } = await supabase.from("profiles").select("exam_type").eq("id", user.id).maybeSingle<Profile>();
  const preferredExamType = normalizeAchievementExamType(profile?.exam_type);
  const initialStats = await getAchievementStatsForUser(supabase, user.id, { examType: preferredExamType });

  return <AchievementsPageClient preferredExamType={preferredExamType} initialStats={initialStats} />;
}
