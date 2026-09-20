import { LearningAnalyticsClient } from "@/components/analytics/learning-analytics-client";
import { getLearningAnalyticsForUser } from "@/lib/analytics/pte-analytics";
import { requireUser } from "@/lib/auth/require-user";

type ExamType = "PTE" | "IELTS";

type ProfileRow = {
  exam_type: string | null;
};

function normalizePreferredExamType(value: string | null | undefined): ExamType {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized.includes("ielts") || normalized.includes("雅思") ? "IELTS" : "PTE";
}

export default async function AnalyticsPage() {
  const { supabase, user } = await requireUser("/analytics");
  const { data: profile } = await supabase.from("profiles").select("exam_type").eq("id", user.id).maybeSingle<ProfileRow>();
  const preferredExamType = normalizePreferredExamType(profile?.exam_type);
  const initialAnalytics = await getLearningAnalyticsForUser(supabase, user.id, preferredExamType);

  return <LearningAnalyticsClient preferredExamType={preferredExamType} initialAnalytics={initialAnalytics} />;
}
