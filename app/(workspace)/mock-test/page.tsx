import { MockTestCenter } from "@/components/mock-test/mock-test-center";
import { requireUser } from "@/lib/auth/require-user";
import { loadAbilityAssessment } from "@/lib/mock-assessment/load-assessment";
import { getMockTestDashboard } from "@/lib/mock-test/server";
import { normalizeProfileExamType } from "@/lib/profile/exam-type";

export const dynamic = "force-dynamic";

export default async function MockTestPage() {
  const [{ supabase, user }, assessment] = await Promise.all([
    requireUser("/mock-test"),
    loadAbilityAssessment(),
  ]);
  const [dashboard, profileResult] = await Promise.all([
    getMockTestDashboard(supabase, user.id),
    supabase.from("profiles").select("exam_type").eq("id", user.id).maybeSingle(),
  ]);
  const examType = normalizeProfileExamType(profileResult.data?.exam_type);

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 p-4 text-[var(--text)] sm:p-5 lg:p-6">
      <MockTestCenter key={assessment.assessmentId} dashboard={dashboard} assessment={assessment} examType={examType} />
    </main>
  );
}
