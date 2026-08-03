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

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  created_at: string | null;
};

type StudentAttemptRow = {
  user_id: string;
  question_source: string | null;
  submitted_at: string | null;
};

type IeltsSpeakingAttemptRow = {
  user_id: string;
  created_at: string | null;
};

type IeltsWritingAttemptRow = {
  user_id: string;
  created_at: string | null;
};

function isStudentProfile(profile: ProfileRow) {
  return profile.role !== "admin" && profile.role !== "editor";
}

function isMissingTableError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && ["42P01", "PGRST205"].includes(String((error as { code?: unknown }).code));
}

function buildDashboardData(profiles: ProfileRow[], attempts: StudentAttemptRow[]) {
  const studentProfiles = profiles.filter(isStudentProfile);
  const attemptMap = new Map<
    string,
    {
      attempts: number;
      latestQuestionSource: string | null;
      lastSubmittedAt: string | null;
    }
  >();

  let totalAttempts = 0;
  let todayAttempts = 0;
  let last7DaysAttempts = 0;
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  for (const attempt of attempts) {
    totalAttempts += 1;

    const submittedAt = attempt.submitted_at ? new Date(attempt.submitted_at) : null;
    if (submittedAt && submittedAt >= startOfToday) todayAttempts += 1;
    if (submittedAt && submittedAt >= sevenDaysAgo) last7DaysAttempts += 1;

    const current = attemptMap.get(attempt.user_id) ?? {
      attempts: 0,
      latestQuestionSource: null,
      lastSubmittedAt: null,
    };

    current.attempts += 1;

    if (
      attempt.submitted_at &&
      (!current.lastSubmittedAt || attempt.submitted_at > current.lastSubmittedAt)
    ) {
      current.lastSubmittedAt = attempt.submitted_at;
      current.latestQuestionSource = attempt.question_source;
    }

    attemptMap.set(attempt.user_id, current);
  }

  const students = studentProfiles
    .map((profile) => {
      const stat = attemptMap.get(profile.id);

      return {
        user_id: profile.id,
        display_name: profile.full_name?.trim() || profile.email || "Unnamed student",
        email: profile.email,
        avatar_url: profile.avatar_url,
        latest_question_source: stat?.latestQuestionSource ?? null,
        attempts: stat?.attempts ?? 0,
        last_submitted_at: stat?.lastSubmittedAt ?? null,
      } satisfies ActiveStudent;
    })
    .sort((a, b) => {
      if (b.attempts !== a.attempts) return b.attempts - a.attempts;
      if (a.last_submitted_at && b.last_submitted_at) return b.last_submitted_at.localeCompare(a.last_submitted_at);
      if (a.last_submitted_at) return -1;
      if (b.last_submitted_at) return 1;
      return a.display_name.localeCompare(b.display_name);
    });

  return {
    overview: {
      total_attempts: totalAttempts,
      today_attempts: todayAttempts,
      last_7_days_attempts: last7DaysAttempts,
      total_students: studentProfiles.length,
    } satisfies OverviewStats,
    students,
  };
}

export default async function AdminDashboardPage() {
  await requireAdmin("/admin");
  const supabase = createAdminClient();

  const [
    { data: profilesData, error: profilesError },
    { data: attemptsData, error: attemptsError },
    { data: ieltsSpeakingData, error: ieltsSpeakingError },
    ieltsWritingResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, avatar_url, role, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("student_attempts")
      .select("user_id, question_source, submitted_at")
      .order("submitted_at", { ascending: false }),
    supabase
      .schema("ielts")
      .from("speaking_attempts")
      .select("user_id, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .schema("ielts")
      .from("writing_attempts")
      .select("user_id, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const ieltsWritingError = ieltsWritingResult.error;

  if (
    profilesError ||
    attemptsError ||
    ieltsSpeakingError ||
    (ieltsWritingError && !isMissingTableError(ieltsWritingError))
  ) {
    return (
      <Container className="py-10">
        <div className="rounded-[var(--radius-md)] border border-[var(--danger)]/25 bg-[var(--danger-soft)] p-4 text-sm font-medium text-[var(--danger)]">
          Failed to load dashboard data.
        </div>
      </Container>
    );
  }

  const dashboardAttempts: StudentAttemptRow[] = [
    ...((attemptsData ?? []) as StudentAttemptRow[]),
    ...((ieltsSpeakingData ?? []) as IeltsSpeakingAttemptRow[]).map((attempt) => ({
      user_id: attempt.user_id,
      question_source: "ielts_speaking_ai",
      submitted_at: attempt.created_at,
    })),
    ...((ieltsWritingResult.data ?? []) as IeltsWritingAttemptRow[]).map((attempt) => ({
      user_id: attempt.user_id,
      question_source: "ielts_writing_ai",
      submitted_at: attempt.created_at,
    })),
  ];

  const { overview, students } = buildDashboardData(
    (profilesData ?? []) as ProfileRow[],
    dashboardAttempts,
  );

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Container className="py-8">
        <AdminDashboardClient overview={overview} students={students} />
      </Container>
    </main>
  );
}
