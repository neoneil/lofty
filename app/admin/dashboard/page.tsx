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
  last_submitted_at: string | null;
};

export const dynamic = "force-dynamic";

type AdminDashboardRpcPayload = {
  overview?: Partial<OverviewStats> | null;
  students?: Partial<ActiveStudent>[] | null;
};

function normalizeOverview(value: Partial<OverviewStats> | null | undefined): OverviewStats {
  return {
    total_attempts: Number(value?.total_attempts ?? 0),
    today_attempts: Number(value?.today_attempts ?? 0),
    last_7_days_attempts: Number(value?.last_7_days_attempts ?? 0),
    total_students: Number(value?.total_students ?? 0),
  };
}

function normalizeStudent(value: Partial<ActiveStudent>): ActiveStudent | null {
  if (!value.user_id) return null;
  return {
    user_id: value.user_id,
    display_name: value.display_name?.trim() || value.email || value.user_id,
    email: value.email ?? null,
    avatar_url: value.avatar_url ?? null,
    latest_question_source: value.latest_question_source ?? null,
    attempts: Number(value.attempts ?? 0),
    last_submitted_at: value.last_submitted_at ?? null,
  };
}

export default async function AdminDashboardPage() {
  await requireAdmin("/admin");
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("lofty_get_admin_dashboard_v1");

  if (error) {
    console.error("ADMIN DASHBOARD RPC LOAD ERROR", error);
    return (
      <Container className="py-10">
        <div className="rounded-[var(--radius-md)] border border-[var(--danger)]/25 bg-[var(--danger-soft)] p-4 text-sm font-medium text-[var(--danger)]">
          Failed to load dashboard data.
        </div>
      </Container>
    );
  }

  const payload = (data ?? {}) as AdminDashboardRpcPayload;
  const overview = normalizeOverview(payload.overview);
  const students = (payload.students ?? []).map(normalizeStudent).filter((student): student is ActiveStudent => Boolean(student));

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Container className="py-8">
        <AdminDashboardClient overview={overview} students={students} />
      </Container>
    </main>
  );
}
