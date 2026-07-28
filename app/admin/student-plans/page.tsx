import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { StudentPlanManagementClient } from "@/components/admin/student-plan-management-client";
import { getStudentPlanManagementRows } from "@/lib/admin/student-plan-management";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePublicStorageUrl } from "@/lib/storage/public-url";

export const dynamic = "force-dynamic";

export default async function AdminStudentPlansPage() {
  await requireAdmin("/admin/student-plans");

  const rows = await getStudentPlanManagementRows(createAdminClient());
  const normalizedRows = rows.map((row) => ({
    ...row,
    avatarUrl: normalizePublicStorageUrl(row.avatarUrl, "avatars") || null,
  }));

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link href="/admin" className="mb-5 inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-semibold text-[var(--text-soft)] transition hover:border-[var(--primary)]/40 hover:bg-[var(--bg-soft)] hover:text-[var(--text)]">
          <ArrowLeft size={16} />
          返回后台
        </Link>
        <StudentPlanManagementClient initialRows={normalizedRows} />
      </div>
    </main>
  );
}
