import Link from "next/link";
import Container from "@/components/site/container";
import { requireUser } from "@/lib/auth/require-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { pteQuestionTypes } from "@/lib/pte/pte-question-config";

type OverviewStats = {
  total_attempts: number;
  today_attempts: number;
  last_7_days_attempts: number;
  total_students: number;
};

type DailyTrend = {
  day: string;
  attempts: number;
};

type SourceStat = {
  question_source: string;
  attempts: number;
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

const TYPE_LABEL_MAP: Record<string, string> = {
  ra: "RA",
  rs: "RS",
  di: "DI",
  rl: "RL",
  asq: "ASQ",
  rts: "RTS",
  sgd: "SGD",
  swt: "SWT",
  essay: "Essay",
  rfib: "RFIB",
  rwfib: "RWFIB",
  rmcsa: "RMCSA",
  rmcma: "RMCMA",
  ro: "RO",
  sst: "SST",
  mcsa: "MCSA",
  mcma: "MCMA",
  fib_l: "FIB-L",
  smw: "SMW",
  hiw: "HIW",
  hcs: "HCS",
  wfd: "WFD",
};

const TYPE_GROUPS = [
  {
    key: "speaking",
    label: "Speaking",
    types: pteQuestionTypes.speaking,
  },
  {
    key: "writing",
    label: "Writing",
    types: pteQuestionTypes.writing,
  },
  {
    key: "reading",
    label: "Reading",
    types: pteQuestionTypes.reading,
  },
  {
    key: "listening",
    label: "Listening",
    types: pteQuestionTypes.listening,
  },
] as const;

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireUser("/admin");
  const supabase = createAdminClient();

  const { data: overviewData, error: overviewError } = await supabase.rpc(
    "admin_dashboard_overview"
  );

  const { data: dailyTrendData, error: dailyTrendError } = await supabase.rpc(
    "admin_dashboard_daily_trend"
  );

  const { data: sourceStatsData, error: sourceStatsError } = await supabase.rpc(
    "admin_dashboard_source_stats"
  );

  const { data: activeStudentsData, error: activeStudentsError } =
    await supabase.rpc("admin_dashboard_active_students");

  if (
    overviewError ||
    dailyTrendError ||
    sourceStatsError ||
    activeStudentsError
  ) {
    return (
      <Container className="py-10">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
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

  const dailyTrend: DailyTrend[] = dailyTrendData ?? [];
  const sourceStats: SourceStat[] = sourceStatsData ?? [];
  const activeStudents: ActiveStudent[] = activeStudentsData ?? [];

  return (
    <Container className="py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Practice Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Overall practice activity across all PTE question types
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Attempts</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {overview.total_attempts}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Today</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {overview.today_attempts}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Last 7 Days</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {overview.last_7_days_attempts}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Students</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {overview.total_students}
          </p>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Question Type Quick Access
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Jump directly to each PTE question type dashboard
          </p>
        </div>

        <div className="space-y-5">
          {TYPE_GROUPS.map((group) => (
            <div key={group.key}>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                {group.label}
              </h3>

              <div className="flex flex-wrap gap-3">
                {group.types.map((type) => (
                  <Link
                    key={type}
                    href={`/admin/pte/${type}`}
                    className="rounded-full border bg-gray-50 px-4 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-900 hover:text-white"
                  >
                    {TYPE_LABEL_MAP[type] ?? type.toUpperCase()}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Attempts in Last 7 Days
          </h2>

          <div className="mt-4 space-y-3">
            {dailyTrend.length === 0 ? (
              <p className="text-sm text-gray-500">No data yet.</p>
            ) : (
              dailyTrend.map((item) => (
                <div
                  key={item.day}
                  className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3"
                >
                  <span className="text-sm text-gray-700">{item.day}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {item.attempts}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Attempts by Question Type
          </h2>

          <div className="mt-4 space-y-3">
            {sourceStats.length === 0 ? (
              <p className="text-sm text-gray-500">No data yet.</p>
            ) : (
              sourceStats.map((item) => (
                <Link
                  key={item.question_source}
                  href={`/admin/pte/${item.question_source}`}
                  className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 transition hover:bg-gray-100"
                >
                  <span className="text-sm uppercase text-gray-700">
                    {TYPE_LABEL_MAP[item.question_source] ??
                      item.question_source}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {item.attempts}
                  </span>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="mt-8 rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Top Active Students
        </h2>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Recent Type</th>
                <th className="px-4 py-3 font-medium">Attempts</th>
                <th className="px-4 py-3 font-medium">Last Submitted</th>
              </tr>
            </thead>
            <tbody>
              {activeStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                    No data yet.
                  </td>
                </tr>
              ) : (
                activeStudents.map((student) => {
                  const displayName =
                    student.display_name?.trim() || student.user_id;
                  const subtitle = student.email?.trim() || student.user_id;
                  const avatarLetter = displayName.slice(0, 1).toUpperCase();

                  return (
                    <tr key={student.user_id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {student.avatar_url ? (
                            <img
                              src={student.avatar_url}
                              alt={displayName}
                              referrerPolicy="no-referrer"
                              className="h-10 w-10 min-h-10 min-w-10 rounded-full border object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-gray-100 text-sm font-semibold text-gray-600">
                              {avatarLetter}
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="truncate font-medium text-gray-900">
                              {displayName}
                            </div>
                            <div className="truncate text-xs text-gray-500">
                              {subtitle}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-gray-700">
                        {student.latest_question_source ? (
                          <Link
                            href={`/admin/pte/${student.latest_question_source}`}
                            className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium uppercase text-gray-700 transition hover:bg-gray-200"
                          >
                            {TYPE_LABEL_MAP[student.latest_question_source] ??
                              student.latest_question_source}
                          </Link>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3 font-medium text-gray-900">
                        {student.attempts}
                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        {new Date(student.last_submitted_at).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </Container>
  );
}