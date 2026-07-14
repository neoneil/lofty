"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { CalendarDays, ChevronDown, ChevronUp, Clock3, GraduationCap, Target } from "lucide-react";
import AudioPlayer from "@/components/site/AudioPlayer";
import { AnalyticsChart } from "@/components/dashboard-v2/analytics-chart";
import { normalizePublicStorageUrl } from "@/lib/storage/public-url";

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

type TypeSummary = {
  questionSource: string;
  attempts: number;
  correctCount: number;
  wrongCount: number;
  latestSubmittedAt: string | null;
};

type Practice = {
  id: string;
  sourceKind: string;
  questionSource: string;
  questionId: string;
  submittedAt: string | null;
  audioUrl?: string | null;
  score?: number | null;
  contentScore?: number | null;
  fluencyScore?: number | null;
  pronunciationScore?: number | null;
  accuracyScore?: number | null;
  completenessScore?: number | null;
  accuracy?: number | null;
  isCorrect?: boolean | null;
  transcript?: string | null;
  userAnswer?: string | null;
  correctAnswer?: string | null;
  feedback?: string;
  suggestions?: string[];
};

type StudyPlanSummary = {
  exam_type: string | null;
  overall_target: string | number | null;
  overall_current: string | number | null;
  listening_target: string | number | null;
  listening_current: string | number | null;
  reading_target: string | number | null;
  reading_current: string | number | null;
  writing_target: string | number | null;
  writing_current: string | number | null;
  speaking_target: string | number | null;
  speaking_current: string | number | null;
  exam_deadline: string | null;
  study_goal: string | null;
  daily_study_hours: string | null;
  additional_notes: string | null;
} | null;

type AnalyticsData = {
  overview: {
    overall_accuracy: number;
    total_correct: number;
    total_completed: number;
    practiced_question_count: number;
    longest_study_streak_days: number;
    highest_ai_score: number;
    average_score: number;
    total_study_minutes: number;
    max_correct_streak: number;
  };
  moduleData: Array<{ module: string; completed: number; accuracy: number; studyMinutes: number }>;
  questionTypeCompletionData: Array<{ type: string; completed: number; total: number; completion: number }>;
  recentStudyTimeData: Array<{ day: string; minutes: number }>;
  questionAccuracyData: Array<{ type: string; accuracy: number; completed: number }>;
  weakestQuestionType: { question_type: string; label: string; accuracy: number } | null;
  hasQuestionCompletionData: boolean;
  hasRecentStudyTime: boolean;
  hasStudyTime: boolean;
} | null;

type Props = {
  overview: OverviewStats;
  students: ActiveStudent[];
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
  fibrw: "FIBRW",
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

function formatDateTime(value: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getStudentName(student: ActiveStudent) {
  return student.display_name?.trim() || student.email || student.user_id;
}

function getTypeLabel(type: string) {
  return TYPE_LABEL_MAP[type] ?? type.toUpperCase();
}

function stringifyAnswer(value: string | null | undefined) {
  if (!value) return "";

  try {
    const parsed = JSON.parse(value);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return value;
  }
}

function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function ChartEmptyState({ message }: { message: string }) {
  return <div className="flex h-full min-h-[240px] items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--bg-soft)] px-6 text-center text-sm text-[var(--text-faint)]">{message}</div>;
}

function getDaysRemaining(value: string | null | undefined) {
  if (!value) return null;
  const deadline = new Date(value).getTime();
  if (!Number.isFinite(deadline)) return null;
  return Math.ceil((deadline - Date.now()) / 86_400_000);
}

function StudyPlanMetric({ label, value, icon: Icon }: { label: string; value: string | number | null | undefined; icon: typeof Target }) {
  return <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-faint)]"><Icon size={14} className="text-[var(--primary)]" />{label}</div><div className="mt-2 truncate text-lg font-black text-[var(--text)]">{value || "—"}</div></div>;
}

function ScorePair({ label, target, current }: { label: string; target: string | number | null | undefined; current: string | number | null | undefined }) {
  return <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-3"><div className="text-xs font-semibold text-[var(--text-faint)]">{label}</div><div className="mt-2 grid grid-cols-2 gap-2 text-sm"><div><span className="block text-[10px] uppercase tracking-wide text-[var(--text-faint)]">Target</span><span className="font-bold text-[var(--primary)]">{target || "—"}</span></div><div><span className="block text-[10px] uppercase tracking-wide text-[var(--text-faint)]">Current</span><span className="font-bold text-[var(--text)]">{current || "—"}</span></div></div></div>;
}

function AdminStudyPlanPanel({ studyPlan }: { studyPlan: StudyPlanSummary }) {
  const daysRemaining = getDaysRemaining(studyPlan?.exam_deadline);

  if (!studyPlan) {
    return <div className="mt-5 rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] bg-[var(--bg-soft)] p-5 text-sm text-[var(--text-soft)]">这个学生还没有创建学习计划。</div>;
  }

  return (
    <div className="mt-5 space-y-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 sm:p-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StudyPlanMetric label="考试类型" value={studyPlan.exam_type} icon={GraduationCap} />
        <StudyPlanMetric label="总分目标" value={studyPlan.overall_target} icon={Target} />
        <StudyPlanMetric label="考试日期" value={formatDate(studyPlan.exam_deadline)} icon={CalendarDays} />
        <StudyPlanMetric label="剩余天数" value={daysRemaining === null ? "—" : `${daysRemaining} 天`} icon={Clock3} />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ScorePair label="Listening" target={studyPlan.listening_target} current={studyPlan.listening_current} />
        <ScorePair label="Reading" target={studyPlan.reading_target} current={studyPlan.reading_current} />
        <ScorePair label="Writing" target={studyPlan.writing_target} current={studyPlan.writing_current} />
        <ScorePair label="Speaking" target={studyPlan.speaking_target} current={studyPlan.speaking_current} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-4"><div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-faint)]">学习目标</div><div className="mt-2 text-sm font-bold text-[var(--text)]">{studyPlan.study_goal || "—"}</div></div>
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-4"><div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-faint)]">每日学习时间</div><div className="mt-2 text-sm font-bold text-[var(--text)]">{studyPlan.daily_study_hours || "—"}</div></div>
      </div>

      {studyPlan.additional_notes ? <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-4"><div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-faint)]">补充说明</div><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[var(--text-soft)]">{studyPlan.additional_notes}</p></div> : null}
    </div>
  );
}

function AdminStudentAnalytics({ analytics, loading }: { analytics: AnalyticsData; loading: boolean }) {
  if (loading && !analytics) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 text-sm text-[var(--text-soft)] shadow-[var(--shadow-sm)]">
        Loading analytics...
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 text-sm text-[var(--text-soft)] shadow-[var(--shadow-sm)]">
        No analytics data.
      </div>
    );
  }

  const { overview, moduleData, questionTypeCompletionData, recentStudyTimeData, questionAccuracyData, weakestQuestionType, hasQuestionCompletionData, hasRecentStudyTime, hasStudyTime } = analytics;

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
      <div className="border-b border-[var(--border)] px-5 py-4">
        <h3 className="text-lg font-bold text-[var(--text)]">Learning Analytics</h3>
        <p className="mt-1 text-sm text-[var(--text-soft)]">Same data model as the student analytics page.</p>
      </div>

      <div className="space-y-5 p-5">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4"><div className="text-xs font-semibold text-[var(--text-soft)]">综合正确率</div><div className="mt-2 text-2xl font-black text-[var(--primary)]">{round(overview.overall_accuracy)}%</div><div className="mt-1 text-xs text-[var(--text-faint)]">{overview.total_correct} correct</div></div>
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4"><div className="text-xs font-semibold text-[var(--text-soft)]">累计完成</div><div className="mt-2 text-2xl font-black text-[var(--primary)]">{overview.total_completed}</div><div className="mt-1 text-xs text-[var(--text-faint)]">{overview.practiced_question_count} practiced</div></div>
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4"><div className="text-xs font-semibold text-[var(--text-soft)]">最长连续学习</div><div className="mt-2 text-2xl font-black text-[var(--primary)]">{overview.longest_study_streak_days}</div><div className="mt-1 text-xs text-[var(--text-faint)]">days</div></div>
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4"><div className="text-xs font-semibold text-[var(--text-soft)]">最高 AI 评分</div><div className="mt-2 text-2xl font-black text-[var(--primary)]">{round(overview.highest_ai_score)}</div><div className="mt-1 text-xs text-[var(--text-faint)]">best score</div></div>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
            <div className="mb-3"><div className="text-sm font-bold text-[var(--text)]">题型完成度</div><div className="mt-1 text-xs text-[var(--text-soft)]">已练预测题 / 当前预测题总量</div></div>
            {hasQuestionCompletionData ? <AnalyticsChart variant="horizontalBar" data={questionTypeCompletionData} xKey="type" yKey="completion" height={420} /> : <ChartEmptyState message="暂无可计算的预测题完成度。" />}
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
            <div className="mb-3"><div className="text-sm font-bold text-[var(--text)]">最近 7 天练习时间</div><div className="mt-1 text-xs text-[var(--text-soft)]">按每天提交记录汇总，单位：分钟</div></div>
            {hasRecentStudyTime ? <AnalyticsChart variant="line" data={recentStudyTimeData} xKey="day" yKey="minutes" tone="success" height={320} /> : <ChartEmptyState message="最近 7 天暂无可计算的练习时间。" />}
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
            <div className="mb-3"><div className="text-sm font-bold text-[var(--text)]">题型正确率</div><div className="mt-1 text-xs text-[var(--text-soft)]">{weakestQuestionType ? `最需关注：${weakestQuestionType.label}（${round(weakestQuestionType.accuracy)}%）` : "完成题型练习后自动生成比较"}</div></div>
            {questionAccuracyData.length > 0 ? <AnalyticsChart variant="bar" data={questionAccuracyData} xKey="type" yKey="accuracy" tone="warning" height={320} /> : <ChartEmptyState message="暂时没有已练习题型数据。" />}
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
            <div className="mb-3"><div className="text-sm font-bold text-[var(--text)]">模块学习时间</div><div className="mt-1 text-xs text-[var(--text-soft)]">累计 {round(overview.total_study_minutes / 60)} 小时</div></div>
            {hasStudyTime ? <AnalyticsChart variant="pie" data={moduleData} pieDataKey="studyMinutes" pieNameKey="module" showLegend height={320} /> : <ChartEmptyState message="有计时练习后，这里将显示学习时间分配。" />}
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4"><div className="text-xs text-[var(--text-faint)]">平均最新评分</div><div className="mt-1 font-bold text-[var(--text)]">{round(overview.average_score)}</div></div>
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4"><div className="text-xs text-[var(--text-faint)]">累计学习时间</div><div className="mt-1 font-bold text-[var(--text)]">{round(overview.total_study_minutes / 60)} 小时</div></div>
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4"><div className="text-xs text-[var(--text-faint)]">历史最高连续答对</div><div className="mt-1 font-bold text-[var(--text)]">{overview.max_correct_streak} 道</div></div>
        </section>
      </div>
    </div>
  );
}

export default function AdminDashboardClient({ overview, students }: Props) {
  const [selectedStudentId, setSelectedStudentId] = useState(
    students[0]?.user_id ?? "",
  );
  const [selectedType, setSelectedType] = useState("");
  const [summaries, setSummaries] = useState<TypeSummary[]>([]);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [studyPlan, setStudyPlan] = useState<StudyPlanSummary>(null);
  const [studyPlanOpen, setStudyPlanOpen] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData>(null);
  const [loading, setLoading] = useState(false);
  const [expandedPracticeIds, setExpandedPracticeIds] = useState<Set<string>>(
    () => new Set(),
  );

  const selectedStudent = useMemo(
    () =>
      students.find((student) => student.user_id === selectedStudentId) ??
      students[0] ??
      null,
    [selectedStudentId, students],
  );

  useEffect(() => {
    if (!selectedStudentId) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const loadStudent = async () => {
        setLoading(true);
        setPractices([]);
        setAnalytics(null);
        setExpandedPracticeIds(new Set());

        try {
          const params = selectedType ? `?type=${selectedType}` : "";
          const res = await fetch(
            `/api/admin/students/${selectedStudentId}/practices${params}`,
            { signal: controller.signal },
          );
          const json = await res.json();

          if (!res.ok || !json.ok) {
            throw new Error(json.message ?? "Failed to load.");
          }

          setSummaries(json.summaries ?? []);
          setPractices(json.practices ?? []);
          setStudyPlan(json.studyPlan ?? null);
          setAnalytics(json.analytics ?? null);
        } catch (error) {
          if (!controller.signal.aborted) {
            console.error(error);
          }
        } finally {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        }
      };

      void loadStudent();
    }, 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [selectedStudentId, selectedType]);

  const togglePractice = (practiceId: string) => {
    setExpandedPracticeIds((prev) => {
      const next = new Set(prev);

      if (next.has(practiceId)) {
        next.delete(practiceId);
      } else {
        next.add(practiceId);
      }

      return next;
    });
  };

  const totalStudentAttempts = summaries.reduce(
    (sum, item) => sum + item.attempts,
    0,
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--text-soft)]">
              Lofty Admin
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--text)]">
              Practice Dashboard
            </h1>
            <p className="mt-2 text-sm text-[var(--text-soft)]">
              Select a student and question type to review practice history.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-4 lg:min-w-[520px]">
            {[
              ["Total", overview.total_attempts],
              ["Today", overview.today_attempts],
              ["7 Days", overview.last_7_days_attempts],
              ["Students", overview.total_students],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3"
              >
                <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]">
                  {label}
                </div>
                <div className="mt-1 text-2xl font-black text-[var(--primary)]">
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[390px_1fr]">
        <section className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
          <div className="border-b border-[var(--border)] px-5 py-4">
            <h2 className="text-lg font-bold text-[var(--text)]">Students</h2>
            <p className="mt-1 text-sm text-[var(--text-soft)]">
              Select a student to view all practice activity.
            </p>
          </div>

          <div className="max-h-[72vh] space-y-2 overflow-y-auto p-3">
            {students.length === 0 ? (
              <div className="rounded border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-6 text-sm text-[var(--text-soft)]">
                No student practice data yet.
              </div>
            ) : (
              students.map((student) => {
                const active = student.user_id === selectedStudent?.user_id;
                const displayName = getStudentName(student);
                const subtitle = student.email?.trim() || student.user_id;
                const avatarLetter = displayName.slice(0, 1).toUpperCase();

                return (
                  <button
                    key={student.user_id}
                    type="button"
                    onClick={() => {
                      setSelectedStudentId(student.user_id);
                      setSelectedType("");
                      setStudyPlanOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-[var(--radius-md)] border px-3 py-3 text-left transition ${
                      active
                        ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                        : "border-[var(--border)] bg-[var(--bg-soft)] hover:border-[var(--primary)]/40 hover:bg-[var(--card-hover)]"
                    }`}
                  >
                    {student.avatar_url ? (
                      <Image
                        src={normalizePublicStorageUrl(student.avatar_url, "avatars")}
                        alt={displayName}
                        referrerPolicy="no-referrer"
                        width={40}
                        height={40}
                        unoptimized
                        className="h-10 w-10 flex-shrink-0 rounded-full border border-[var(--border)] object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-sm font-bold text-[var(--primary)]">
                        {avatarLetter}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-[var(--text)]">
                        {displayName}
                      </div>
                      <div className="truncate text-xs text-[var(--text-soft)]">
                        {subtitle}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-black text-[var(--primary)]">
                        {student.attempts}
                      </div>
                      <div className="text-[10px] uppercase tracking-wide text-[var(--text-soft)]">
                        attempts
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className="min-w-0 space-y-5">
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
            {selectedStudent ? (
              <>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <h2 className="truncate text-xl font-bold text-[var(--text)]">
                      {getStudentName(selectedStudent)}
                    </h2>
                    <div className="mt-1 truncate text-sm text-[var(--text-soft)]">
                      {selectedStudent.email || selectedStudent.user_id}
                    </div>
                  </div>

                  <button type="button" onClick={() => setStudyPlanOpen((current) => !current)} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 text-sm font-bold text-[var(--text)] transition hover:border-[var(--primary)]/40 hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]">
                    学习计划
                    {studyPlanOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[560px] xl:grid-cols-4">
                    <div className="rounded border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3">
                      <div className="text-xs font-semibold text-[var(--text-soft)]">
                        All Attempts
                      </div>
                      <div className="mt-1 text-2xl font-black text-[var(--primary)]">
                        {totalStudentAttempts}
                      </div>
                    </div>
                    <div className="rounded border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3">
                      <div className="text-xs font-semibold text-[var(--text-soft)]">
                        Question Types
                      </div>
                      <div className="mt-1 text-2xl font-black text-[var(--primary)]">
                        {summaries.length}
                      </div>
                    </div>
                    <div className="rounded border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3">
                      <div className="text-xs font-semibold text-[var(--text-soft)]">
                        Target Overall Score
                      </div>
                      <div className="mt-1 text-2xl font-black text-[var(--primary)]">
                        {studyPlan?.overall_target || "—"}
                      </div>
                    </div>
                    <div className="rounded border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3">
                      <div className="text-xs font-semibold text-[var(--text-soft)]">
                        Deadline
                      </div>
                      <div className="mt-1 truncate text-sm font-bold text-[var(--text)]">
                        {formatDate(studyPlan?.exam_deadline)}
                      </div>
                    </div>
                  </div>
                </div>

                {studyPlanOpen ? <AdminStudyPlanPanel studyPlan={studyPlan} /> : null}
              </>
            ) : (
              <p className="text-sm text-[var(--text-soft)]">
                Select a student.
              </p>
            )}
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-[var(--text)]">
                  Question Types
                </h3>
                <p className="mt-1 text-sm text-[var(--text-soft)]">
                  Select a type to view practice history for this student.
                </p>
              </div>

              {selectedType ? (
                <button
                  type="button"
                  onClick={() => setSelectedType("")}
                  className="rounded border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-2 text-xs font-semibold text-[var(--text-soft)] transition hover:text-[var(--text)]"
                >
                  Clear Type
                </button>
              ) : null}
            </div>

            {loading && summaries.length === 0 ? (
              <p className="text-sm text-[var(--text-soft)]">Loading...</p>
            ) : summaries.length === 0 ? (
              <div className="rounded border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-6 text-sm text-[var(--text-soft)]">
                No practice activity yet.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {summaries.map((summary) => {
                  const active = selectedType === summary.questionSource;

                  return (
                    <button
                      key={summary.questionSource}
                      type="button"
                      onClick={() => setSelectedType(summary.questionSource)}
                      className={`rounded-[var(--radius-md)] border px-4 py-3 text-left transition ${
                        active
                          ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                          : "border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text)] hover:border-[var(--primary)]/40"
                      }`}
                    >
                      <div className="text-sm font-black">
                        {getTypeLabel(summary.questionSource)}
                      </div>
                      <div
                        className={`mt-1 text-xs ${
                          active ? "text-white/80" : "text-[var(--text-soft)]"
                        }`}
                      >
                        {summary.attempts} attempts · {summary.correctCount} correct ·{" "}
                        {summary.wrongCount}
                        {" wrong"}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
            <div className="border-b border-[var(--border)] px-5 py-4">
              <h3 className="text-lg font-bold text-[var(--text)]">
                Practice History
              </h3>
              <p className="mt-1 text-sm text-[var(--text-soft)]">
                {selectedType
                  ? `${getTypeLabel(selectedType)} submissions`
                  : "Select a question type."}
              </p>
            </div>

            <div className="p-5">
              {!selectedType ? (
                <div className="rounded border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-6 text-sm text-[var(--text-soft)]">
                  Select a question type above to view practice history.
                </div>
              ) : loading ? (
                <p className="text-sm text-[var(--text-soft)]">
                  Loading practice history...
                </p>
              ) : practices.length === 0 ? (
                <div className="rounded border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-6 text-sm text-[var(--text-soft)]">
                  No practice history for this question type.
                </div>
              ) : (
                <div className="space-y-3">
                  {practices.map((practice, index) => {
                    const expanded = expandedPracticeIds.has(practice.id);

                    return (
                      <div
                        key={practice.id}
                        className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)]"
                      >
                        <button
                          type="button"
                          onClick={() => togglePractice(practice.id)}
                          className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left"
                        >
                          <div>
                            <div className="text-sm font-bold text-[var(--text)]">
                              {getTypeLabel(practice.questionSource)} · Attempt{" "}
                              {index + 1}
                            </div>
                            <div className="mt-1 text-xs text-[var(--text-soft)]">
                              {formatDateTime(practice.submittedAt)}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="rounded bg-[var(--card)] px-3 py-1 text-xs font-bold text-[var(--primary)]">
                              {practice.score ?? practice.accuracy ?? "-"}
                            </span>
                            <span className="text-xs font-semibold text-[var(--text-soft)]">
                              {expanded ? "Collapse" : "Expand"}
                            </span>
                          </div>
                        </button>

                        {expanded ? (
                          <div className="space-y-4 border-t border-[var(--border)] px-4 py-4">
                            {practice.audioUrl ? (
                              <AudioPlayer
                                url={practice.audioUrl}
                                size="compact"
                              />
                            ) : null}

                            <div className="grid gap-2 sm:grid-cols-4">
                              {[
                                ["Score", practice.score],
                                ["Content", practice.contentScore],
                                ["Fluency", practice.fluencyScore],
                                ["Pron", practice.pronunciationScore],
                              ].map(([label, value]) => (
                                <div
                                  key={label}
                                  className="rounded border border-[var(--border)] bg-[var(--card)] px-3 py-2"
                                >
                                  <div className="text-[11px] font-semibold uppercase text-[var(--text-soft)]">
                                    {label}
                                  </div>
                                  <div className="mt-1 text-lg font-black text-[var(--primary)]">
                                    {value ?? "-"}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {practice.feedback ? (
                              <div>
                                <div className="text-sm font-bold text-[var(--text)]">
                                  AI Feedback
                                </div>
                                <p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">
                                  {practice.feedback}
                                </p>
                              </div>
                            ) : null}

                            {practice.suggestions?.length ? (
                              <div>
                                <div className="text-sm font-bold text-[var(--text)]">
                                  Suggestions
                                </div>
                                <ul className="mt-2 space-y-2 text-sm leading-7 text-[var(--text-soft)]">
                                  {practice.suggestions.map((suggestion) => (
                                    <li key={suggestion} className="flex gap-2">
                                      <span className="text-[var(--primary)]">
                                        •
                                      </span>
                                      <span>{suggestion}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}

                            {practice.transcript ||
                            practice.userAnswer ||
                            practice.correctAnswer ? (
                              <div className="grid gap-3 lg:grid-cols-2">
                                {practice.transcript || practice.userAnswer ? (
                                  <div>
                                    <div className="text-sm font-bold text-[var(--text)]">
                                      Student Answer / Transcript
                                    </div>
                                    <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap rounded border border-[var(--border)] bg-[var(--card)] p-3 text-xs leading-6 text-[var(--text)]">
                                      {practice.transcript ??
                                        stringifyAnswer(practice.userAnswer)}
                                    </pre>
                                  </div>
                                ) : null}

                                {practice.correctAnswer ? (
                                  <div>
                                    <div className="text-sm font-bold text-[var(--text)]">
                                      Reference Answer
                                    </div>
                                    <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap rounded border border-[var(--border)] bg-[var(--card)] p-3 text-xs leading-6 text-[var(--text)]">
                                      {stringifyAnswer(practice.correctAnswer)}
                                    </pre>
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <AdminStudentAnalytics analytics={analytics} loading={loading} />
        </section>
      </div>
    </div>
  );
}
