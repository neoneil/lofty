import AbilityAssessment from "@/components/mock-assessment/ability-assessment";
import { loadAbilityAssessment } from "@/lib/mock-assessment/load-assessment";

export const dynamic = "force-dynamic";

export default async function MockTestPage() {
  const assessment = await loadAbilityAssessment();
  return <main className="mx-auto w-full max-w-7xl pb-12 pt-4 sm:pb-16 sm:pt-6"><AbilityAssessment key={assessment.assessmentId} data={assessment} /></main>;
}
