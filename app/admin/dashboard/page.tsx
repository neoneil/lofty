import Container from "@/components/site/container";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminDashboardClient from "./admin-dashboard-client";

type OverviewStats = {
  total_attempts: number;
  today_attempts: number;
  last_7_days_attempts: number;
  total_students: number;
};

type ActiveStudent = {
  user_id: string;
  display_name: string;
  email: string | null;
  avatar_url: string | null;
  latest_question_source: string | null;
  attempts: number;
  last_submitted_at: string;
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdmin("/admin");
  const supabase = createAdminClient();

  const [
    { data: overviewData, error: overviewError },
    { data: activeStudentsData, error: activeStudentsError },
  ] = await Promise.all([
    supabase.rpc("admin_dashboard_overview"),
    supabase.rpc("admin_dashboard_active_students"),
  ]);

  if (overviewError || activeStudentsError) {
    return (
      <Container className="py-10">
        <div className="rounded-[var(--radius-md)] border border-[var(--danger)]/25 bg-[var(--danger-soft)] p-4 text-sm font-medium text-[var(--danger)]">
          Failed to load dashboard data.
        </div>
      </Container>
    );
  }

  const overview: OverviewStats =
    overviewData?.[0] ?? {
      total_attempts: 0,
      today_attempts: 0,
      last_7_days_attempts: 0,
      total_students: 0,
    };

  const students = (activeStudentsData ?? []) as ActiveStudent[];

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Container className="py-8">
        <AdminDashboardClient overview={overview} students={students} />
      </Container>
    </main>
  );
}
