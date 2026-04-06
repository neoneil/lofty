import Container from "@/components/site/container";
import { requireUser } from "@/lib/auth/require-user";
import { notFound } from "next/navigation";
import { pteQuestionTypes } from "@/lib/pte/pte-question-config";
import { createAdminClient } from "@/lib/supabase/admin";
type PageProps = {
    params: Promise<{
        type: string;
    }>;
};

type TypeOverview = {
    total_attempts: number;
    total_students: number;
    last_7_days_attempts: number;
};

type DailyTrend = {
    day: string;
    attempts: number;
};

type ActiveStudent = {
    user_id: string;
    display_name: string;
    email: string | null;
    avatar_url: string | null;
    attempts: number;
    last_submitted_at: string;
};

type TopQuestion = {
    question_id: string;
    attempts: number;
};

const ALL_PTE_TYPES = Object.values(pteQuestionTypes).flat() as string[];

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

export default async function AdminPteTypePage({ params }: PageProps) {
    const { type } = await params;
    const normalizedType = type.toLowerCase();

    if (!ALL_PTE_TYPES.includes(normalizedType)) {
        notFound();
    }

    await requireUser(`/admin/pte/${normalizedType}`);
    const supabase = createAdminClient();

    const [
        { data: overviewData, error: overviewError },
        { data: trendData, error: trendError },
        { data: activeStudentsData, error: activeStudentsError },
        { data: topQuestionsData, error: topQuestionsError },
    ] = await Promise.all([
        supabase.rpc("admin_pte_type_overview", { p_type: normalizedType }),
        supabase.rpc("admin_pte_type_daily_trend", { p_type: normalizedType }),
        supabase.rpc("admin_pte_type_active_students", { p_type: normalizedType }),
        supabase.rpc("admin_pte_type_top_questions", { p_type: normalizedType }),
    ]);

    if (
        overviewError ||
        trendError ||
        activeStudentsError ||
        topQuestionsError
    ) {
        return (
            <Container className="py-10">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    Failed to load {normalizedType.toUpperCase()} analytics.
                </div>
            </Container>
        );
    }

    const overview: TypeOverview = overviewData?.[0] ?? {
        total_attempts: 0,
        total_students: 0,
        last_7_days_attempts: 0,
    };

    const trend: DailyTrend[] = trendData ?? [];
    const activeStudents: ActiveStudent[] = activeStudentsData ?? [];
    const topQuestions: TopQuestion[] = topQuestionsData ?? [];

    const typeLabel = TYPE_LABEL_MAP[normalizedType] ?? normalizedType.toUpperCase();

    return (
        <Container className="py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">
                    {typeLabel} Analytics Dashboard
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                    Practice insights for {typeLabel}
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl border bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Total Attempts</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                        {overview.total_attempts}
                    </p>
                </div>

                <div className="rounded-2xl border bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Students</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                        {overview.total_students}
                    </p>
                </div>

                <div className="rounded-2xl border bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Last 7 Days</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                        {overview.last_7_days_attempts}
                    </p>
                </div>
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-2">
                <section className="rounded-2xl border bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900">Daily Trend</h2>

                    <div className="mt-4 space-y-3">
                        {trend.length === 0 ? (
                            <p className="text-sm text-gray-500">No data yet.</p>
                        ) : (
                            trend.map((item) => (
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
                    <h2 className="text-lg font-semibold text-gray-900">Top Questions</h2>

                    <div className="mt-4 space-y-3">
                        {topQuestions.length === 0 ? (
                            <p className="text-sm text-gray-500">No data yet.</p>
                        ) : (
                            topQuestions.map((item) => (
                                <div
                                    key={item.question_id}
                                    className="rounded-xl bg-gray-50 px-4 py-3"
                                >
                                    <div className="break-all text-sm text-gray-800">
                                        Question ID: {item.question_id}
                                    </div>
                                    <div className="mt-2 text-xs text-gray-500">
                                        Attempts: {item.attempts}
                                    </div>
                                </div>
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
                                <th className="px-4 py-3 font-medium">Attempts</th>
                                <th className="px-4 py-3 font-medium">Last Submitted</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
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