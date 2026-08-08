import { notFound } from "next/navigation";

import { MockTestReportPage } from "@/components/mock-test/mock-test-report-page";
import { requireUser } from "@/lib/auth/require-user";
import { getPublishedMockAttemptReport } from "@/lib/mock-test/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ attemptId: string }>;
};

export default async function StudentMockTestReportPage({ params }: Props) {
  const { attemptId } = await params;
  const { user } = await requireUser(`/mock-test/report/${attemptId}`);
  const detail = await getPublishedMockAttemptReport(createAdminClient(), user.id, attemptId);
  if (!detail) notFound();

  return (
    <main className="mx-auto w-full max-w-7xl p-4 text-[var(--text)] sm:p-5 lg:p-6">
      <MockTestReportPage detail={detail} />
    </main>
  );
}
