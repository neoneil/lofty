import Link from "next/link";
import Container from "@/components/site/container";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

type StudentProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
};

type TypeSummary = {
  question_source: string;
  attempts: number;
  correct_count: number;
  incorrect_count: number;
};

type DailyDetail = {
  day: string;
  question_source: string;
  attempts: number;
  correct_count: number;
  incorrect_count: number;
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

export const dynamic = "force-dynamic";

export default async function AdminStudentDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  await requireAdmin("/admin");

  const { userId } = await params;
  const supabase = createAdminClient();

  const [
    profileRes,
    overallRes,
    dailyRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .eq("id", userId)
      .maybeSingle(),

    supabase.rpc("admin_student_type_summary_last_7_days", {
      p_user_id: userId,
    }),

    supabase.rpc("admin_student_daily_detail_last_7_days", {
      p_user_id: userId,
    }),
  ]);

  const profile = profileRes.data as StudentProfile | null;
  const overall = (overallRes.data ?? []) as TypeSummary[];
  const daily = (dailyRes.data ?? []) as DailyDetail[];

  const displayName = profile?.full_name?.trim() || profile?.email || userId;
  const subtitle = profile?.email || userId;
  const avatarLetter = displayName.slice(0, 1).toUpperCase();

  const groupedByDay = daily.reduce<Record<string, DailyDetail[]>>((acc, item) => {
    if (!acc[item.day]) acc[item.day] = [];
    acc[item.day].push(item);
    return acc;
  }, {});

  const orderedDays = Object.keys(groupedByDay).sort((a, b) =>
    a < b ? 1 : -1
  );

  return (
    <Container className="py-8">
      <div className="mb-6">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={displayName}
              referrerPolicy="no-referrer"
              className="h-16 w-16 rounded-full border object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full border bg-gray-100 text-lg font-semibold text-gray-600">
              {avatarLetter}
            </div>
          )}

          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            <p className="mt-2 text-sm text-gray-600">
              Detailed activity in the last 7 days
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Practice by Question Type
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Attempts, correct count, and incorrect count in the last 7 days
          </p>
        </div>

        {overall.length === 0 ? (
          <div className="rounded-xl bg-gray-50 px-4 py-6 text-sm text-gray-500">
            No data in the last 7 days.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {overall.map((item) => (
              <div
                key={item.question_source}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
              >
                <div className="text-sm font-semibold uppercase text-gray-900">
                  {TYPE_LABEL_MAP[item.question_source] ?? item.question_source}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-white px-3 py-3">
                    <div className="text-xs text-gray-500">Attempts</div>
                    <div className="mt-1 text-lg font-bold text-gray-900">
                      {item.attempts}
                    </div>
                  </div>

                  <div className="rounded-xl bg-white px-3 py-3">
                    <div className="text-xs text-gray-500">Correct</div>
                    <div className="mt-1 text-lg font-bold text-green-700">
                      {item.correct_count}
                    </div>
                  </div>

                  <div className="rounded-xl bg-white px-3 py-3">
                    <div className="text-xs text-gray-500">Wrong</div>
                    <div className="mt-1 text-lg font-bold text-red-700">
                      {item.incorrect_count}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8 rounded-2xl border bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Daily Detail (Last 7 Days)
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            What the student practiced each day
          </p>
        </div>

        {orderedDays.length === 0 ? (
          <div className="rounded-xl bg-gray-50 px-4 py-6 text-sm text-gray-500">
            No data in the last 7 days.
          </div>
        ) : (
          <div className="space-y-6">
            {orderedDays.map((day) => (
              <div key={day} className="rounded-2xl border border-gray-200">
                <div className="border-b bg-gray-50 px-4 py-3">
                  <h3 className="text-sm font-semibold text-gray-900">{day}</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b bg-white text-gray-500">
                      <tr>
                        <th className="px-4 py-3 font-medium">Type</th>
                        <th className="px-4 py-3 font-medium">Attempts</th>
                        <th className="px-4 py-3 font-medium">Correct</th>
                        <th className="px-4 py-3 font-medium">Wrong</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedByDay[day].map((item, index) => (
                        <tr key={`${day}-${item.question_source}-${index}`} className="border-b last:border-0">
                          <td className="px-4 py-3 font-medium uppercase text-gray-900">
                            {TYPE_LABEL_MAP[item.question_source] ?? item.question_source}
                          </td>
                          <td className="px-4 py-3 text-gray-700">{item.attempts}</td>
                          <td className="px-4 py-3 text-green-700">{item.correct_count}</td>
                          <td className="px-4 py-3 text-red-700">{item.incorrect_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </Container>
  );
}