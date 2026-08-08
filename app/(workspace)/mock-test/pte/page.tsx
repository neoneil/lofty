import { PteMockTestPageClient } from "@/components/mock-test/pte-mock-test-page-client";
import { requireUser } from "@/lib/auth/require-user";

export const dynamic = "force-dynamic";

export default async function PteMockTestPage() {
  await requireUser("/mock-test/pte");
  return (
    <main className="mx-auto w-full max-w-7xl p-4 text-[var(--text)] sm:p-5 lg:p-6">
      <PteMockTestPageClient />
    </main>
  );
}
