import Link from "next/link";
import { ArrowRight, Award, BookOpen, Brain, CalendarDays, CheckCircle2, Clock3, Headphones, LineChart, Mic, PenTool, Sparkles, Target, Trophy } from "lucide-react";

import achievementConfig from "@/constants/achievements/lofty-achievements-wuxia.json";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui-v2/card";
import { Badge } from "@/components/ui-v2/badge";
import { requireUser } from "@/lib/auth/require-user";
import { normalizePublicStorageUrl } from "@/lib/storage/public-url";
import { checkAiUsageLimit } from "@/lib/ai/usage-limit";
import { getRemaining, formatRemainingTime, formatUnlimitedExpiry } from "@/lib/ai/usage-summary";
import { collectUnlockedAchievements, createAchievementEngineContext, getHighestUnlockedCategoryLevel } from "@/lib/achievements/engine";
import { getAchievementStatsForUser } from "@/lib/achievements/stats";
import type { AchievementConfig, QuestionTypeStat } from "@/lib/achievements/types";
import { cn } from "@/lib/utils";

type Profile = {
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
};

type StudyPlan = {
  exam_type: string | null;
  overall_target: number | null;
  overall_current: number | null;
  listening_target: number | null;
  listening_current: number | null;
  reading_target: number | null;
  reading_current: number | null;
  writing_target: number | null;
  writing_current: number | null;
  speaking_target: number | null;
  speaking_current: number | null;
  exam_deadline: string | null;
  study_goal: string | null;
  daily_study_hours: number | null;
};

type RecentAttempt = {
  module_type: string | null;
  question_source: string | null;
  submitted_at: string | null;
  score: number | string | null;
  accuracy: number | string | null;
  is_correct: boolean | null;
  status: string | null;
};

type ModuleSummary = {
  key: string;
  label: string;
  english: string;
  icon: typeof Mic;
  tone: string;
  completed: number;
  accuracy: number;
  studyMinutes: number;
};

const MODULE_META: Record<string, { label: string; english: string; icon: typeof Mic; tone: string }> = {
  speaking: { label: "口语", english: "Speaking", icon: Mic, tone: "text-[var(--danger)] bg-[var(--danger-soft)]" },
  writing: { label: "写作", english: "Writing", icon: PenTool, tone: "text-[var(--primary)] bg-[var(--primary-soft)]" },
  reading: { label: "阅读", english: "Reading", icon: BookOpen, tone: "text-[var(--success)] bg-[var(--success-soft)]" },
  listening: { label: "听力", english: "Listening", icon: Headphones, tone: "text-[var(--warning)] bg-[var(--warning-soft)]" },
};

function toNumber(value: number | string | null | undefined) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat("zh-CN", { maximumFractionDigits: digits }).format(value);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "未设置";
  return new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit" }).format(new Date(value));
}

function getDaysUntil(value: string | null | undefined) {
  if (!value) return null;
  const deadline = new Date(value).getTime();
  if (!Number.isFinite(deadline)) return null;
  return Math.ceil((deadline - Date.now()) / 86_400_000);
}

function getDisplayName(profile: Profile | null, email: string | undefined) {
  return profile?.full_name?.trim() || email?.split("@")[0] || "同学";
}

function getInitial(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "U";
}

function getModuleSummaries(stats: QuestionTypeStat[]): ModuleSummary[] {
  const grouped = new Map<string, { completed: number; correct: number; studyMinutes: number }>();

  for (const stat of stats) {
    const key = stat.module_type;
    const current = grouped.get(key) ?? { completed: 0, correct: 0, studyMinutes: 0 };
    current.completed += stat.completed;
    current.correct += stat.correct;
    current.studyMinutes += stat.total_study_minutes;
    grouped.set(key, current);
  }

  return Object.entries(MODULE_META).map(([key, meta]) => {
    const current = grouped.get(key) ?? { completed: 0, correct: 0, studyMinutes: 0 };
    return { key, ...meta, completed: current.completed, accuracy: current.completed > 0 ? Math.round((current.correct / current.completed) * 1000) / 10 : 0, studyMinutes: Math.round(current.studyMinutes) };
  });
}

function getTopQuestionTypes(stats: QuestionTypeStat[]) {
  return [...stats].sort((a, b) => b.completed - a.completed).slice(0, 5);
}

function getWeakestModule(modules: ModuleSummary[]) {
  const practiced = modules.filter((module) => module.completed > 0);
  if (practiced.length === 0) return null;
  return [...practiced].sort((a, b) => a.accuracy - b.accuracy)[0];
}

function getAiStatus(limit: Awaited<ReturnType<typeof checkAiUsageLimit>>) {
  const now = new Date().toISOString();
  if (limit.isUnlimited && limit.unlimitedUntil) return { title: "内部学生", detail: `临时无限 · 剩余 ${formatRemainingTime(limit.unlimitedUntil, now)}`, meta: `有效至 ${formatUnlimitedExpiry(limit.unlimitedUntil)}` };
  if (limit.isUnlimited) return { title: "内部学生", detail: "永久无限 AI 评分额度", meta: "可直接使用 AI 反馈功能" };
  return { title: "普通用户", detail: `今日剩余 ${getRemaining(limit.todayUsed, limit.dailyLimit)} 张 AI 券`, meta: `本月剩余 ${getRemaining(limit.monthUsed, limit.monthlyLimit)} 张` };
}

function StatTile({ title, value, helper, icon: Icon, tone = "primary" }: { title: string; value: string; helper: string; icon: typeof Mic; tone?: "primary" | "success" | "warning" | "danger" }) {
  const toneClass = {
    primary: "bg-[var(--primary-soft)] text-[var(--primary)]",
    success: "bg-[var(--success-soft)] text-[var(--success)]",
    warning: "bg-[var(--warning-soft)] text-[var(--warning)]",
    danger: "bg-[var(--danger-soft)] text-[var(--danger)]",
  }[tone];

  return <Card className="rounded-[var(--radius-lg)]"><CardContent className="p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">{title}</p><p className="mt-3 text-2xl font-bold tracking-tight text-[var(--text)]">{value}</p><p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">{helper}</p></div><span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)]", toneClass)}><Icon size={18} /></span></div></CardContent></Card>;
}

function ProgressBar({ value }: { value: number }) {
  return <div className="h-2 overflow-hidden rounded-full bg-[var(--border-soft)]"><div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }} /></div>;
}

export default async function DashboardPage() {
  const { supabase, user } = await requireUser("/dashboard-v2");
  const [{ data: profile }, { data: studyPlan }, achievementStats, aiLimit, { data: recentAttempts }] = await Promise.all([
    supabase.from("profiles").select("full_name, email, avatar_url").eq("id", user.id).maybeSingle<Profile>(),
    supabase.from("study_plans").select("exam_type, overall_target, overall_current, listening_target, listening_current, reading_target, reading_current, writing_target, writing_current, speaking_target, speaking_current, exam_deadline, study_goal, daily_study_hours").eq("user_id", user.id).maybeSingle<StudyPlan>(),
    getAchievementStatsForUser(supabase, user.id),
    checkAiUsageLimit(user.id, "dashboard"),
    supabase.from("student_attempts").select("module_type, question_source, submitted_at, score, accuracy, is_correct, status").eq("user_id", user.id).order("submitted_at", { ascending: false, nullsFirst: false }).limit(5).returns<RecentAttempt[]>(),
  ]);

  const displayName = getDisplayName(profile, user.email);
  const email = profile?.email || user.email || "未绑定邮箱";
  const avatarUrl = normalizePublicStorageUrl(profile?.avatar_url, "avatars") || user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
  const modules = getModuleSummaries(achievementStats.questionTypeStats);
  const topQuestionTypes = getTopQuestionTypes(achievementStats.questionTypeStats);
  const weakestModule = getWeakestModule(modules);
  const config = achievementConfig as AchievementConfig;
  const achievementContext = createAchievementEngineContext(config, achievementStats.overview, achievementStats.questionTypeStats);
  const overallAchievement = getHighestUnlockedCategoryLevel(config, "overall", achievementContext);
  const unlockedAchievements = collectUnlockedAchievements(config, achievementContext);
  const latestAchievement = unlockedAchievements.at(-1);
  const daysUntilExam = getDaysUntil(studyPlan?.exam_deadline);
  const aiStatus = getAiStatus(aiLimit);
  const targetProgress = studyPlan?.overall_target ? Math.round((toNumber(studyPlan.overall_current) / toNumber(studyPlan.overall_target)) * 100) : 0;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 sm:space-y-6">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
        <Card className="relative overflow-hidden rounded-[var(--radius-lg)] border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-md)]">
          <div className="absolute right-[-10%] top-[-30%] h-72 w-72 rounded-full bg-[var(--primary-soft)] blur-3xl" />
          <CardContent className="relative z-10 grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <Badge>Dashboard</Badge>
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">欢迎回来，{displayName}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-soft)]">这里汇总你的学习计划、题型完成度、AI 额度与成就状态。今天继续推进一点点，长期看会很可观。</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/study-plan" className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--primary)] px-5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--primary-hover)]">学习计划<ArrowRight size={16} /></Link>
                <Link href="/analytics" className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-5 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--bg-soft)]">查看分析<LineChart size={16} /></Link>
              </div>
            </div>
            <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 shadow-[var(--shadow-sm)] sm:min-w-[340px]">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-lg)] bg-[var(--primary-soft)] text-2xl font-black text-[var(--primary)]">{avatarUrl ? <span className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${avatarUrl})` }} aria-label={displayName} /> : getInitial(displayName)}</div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><span className="truncate text-lg font-bold text-[var(--text)]">{displayName}</span>{overallAchievement ? <span className="rounded-[var(--radius-xs)] border border-[var(--border-strong)] bg-[var(--card)] px-2 py-1 text-xs font-bold text-[var(--primary)]">{overallAchievement.title}</span> : null}</div>
                  <p className="mt-1 truncate text-sm text-[var(--text-soft)]">{email}</p>
                  <p className="mt-3 text-xs leading-5 text-[var(--text-soft)]">{aiStatus.title} · {aiStatus.detail}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] p-3 text-center"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-faint)]">考试</p><p className="mt-1 truncate text-sm font-bold text-[var(--text)]">{studyPlan?.exam_type || "未设置"}</p></div>
                <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] p-3 text-center"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-faint)]">目标</p><p className="mt-1 text-sm font-bold text-[var(--primary)]">{studyPlan?.overall_target ?? "-"}</p></div>
                <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] p-3 text-center"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-faint)]">日期</p><p className="mt-1 text-sm font-bold text-[var(--text)]">{formatDate(studyPlan?.exam_deadline)}</p></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[var(--radius-lg)]">
          <CardHeader className="items-start gap-4">
            <div>
              <CardTitle>今日状态</CardTitle>
              <CardDescription>根据你的真实学习记录计算</CardDescription>
            </div>
            <Badge variant={daysUntilExam !== null && daysUntilExam <= 14 ? "warning" : "secondary"}>{daysUntilExam === null ? "未设考试日期" : daysUntilExam >= 0 ? `距考试 ${daysUntilExam} 天` : "考试日期已过"}</Badge>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
              <div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold text-[var(--text)]">目标进度</span><span className="text-sm font-bold text-[var(--primary)]">{Math.min(Math.max(targetProgress, 0), 100)}%</span></div>
              <div className="mt-3"><ProgressBar value={targetProgress} /></div>
              <p className="mt-3 text-xs leading-5 text-[var(--text-soft)]">{studyPlan?.overall_current ? `当前总分 ${studyPlan.overall_current}，目标总分 ${studyPlan?.overall_target ?? "-"}` : "设置当前分数后，这里会显示目标进度。"}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-4"><p className="text-xs font-semibold text-[var(--text-faint)]">每日学习</p><p className="mt-2 text-xl font-bold text-[var(--text)]">{studyPlan?.daily_study_hours ?? "-"}h</p></div>
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-4"><p className="text-xs font-semibold text-[var(--text-faint)]">AI 额度</p><p className="mt-2 text-sm font-bold leading-6 text-[var(--text)]">{aiStatus.meta}</p></div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile title="累计完成" value={`${formatNumber(achievementStats.overview.total_completed)} 道`} helper={`已练题目 ${formatNumber(achievementStats.overview.practiced_question_count)} 个`} icon={CheckCircle2} tone="success" />
        <StatTile title="综合正确率" value={`${formatNumber(achievementStats.overview.overall_accuracy, 1)}%`} helper={`${formatNumber(achievementStats.overview.total_correct)} 对 · ${formatNumber(achievementStats.overview.total_wrong)} 错`} icon={Target} tone="primary" />
        <StatTile title="学习时长" value={`${formatNumber(Math.round(achievementStats.overview.total_study_minutes))} 分钟`} helper={`最长连续 ${achievementStats.overview.longest_study_streak_days} 天`} icon={Clock3} tone="warning" />
        <StatTile title="最高评分" value={`${formatNumber(Math.max(achievementStats.overview.highest_score, achievementStats.overview.highest_ai_score), 1)} 分`} helper={`平均分 ${formatNumber(achievementStats.overview.average_score, 1)}`} icon={Trophy} tone="danger" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
        <Card className="rounded-[var(--radius-lg)]">
          <CardHeader>
            <div><CardTitle>四项能力进度</CardTitle><CardDescription>来自 student_question_stats 的实时统计</CardDescription></div>
            <Link href="/analytics" className="hidden items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm font-semibold text-[var(--primary)] transition hover:bg-[var(--primary-soft)] sm:inline-flex">详细图表<ArrowRight size={15} /></Link>
          </CardHeader>
          <CardContent className="grid gap-3 pt-4 sm:grid-cols-2">
            {modules.map((module) => {
              const Icon = module.icon;
              return <div key={module.key} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className={cn("flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)]", module.tone)}><Icon size={18} /></span><div><p className="font-bold text-[var(--text)]">{module.label}</p><p className="text-xs font-semibold text-[var(--text-faint)]">{module.english}</p></div></div><Badge variant="secondary">{formatNumber(module.accuracy, 1)}%</Badge></div><div className="mt-4"><ProgressBar value={module.accuracy} /></div><div className="mt-3 flex items-center justify-between text-xs text-[var(--text-soft)]"><span>{formatNumber(module.completed)} 道完成</span><span>{formatNumber(module.studyMinutes)} 分钟</span></div></div>;
            })}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="rounded-[var(--radius-lg)]">
            <CardHeader><div><CardTitle>下一步建议</CardTitle><CardDescription>自动从薄弱项和计划生成</CardDescription></div></CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4"><div className="flex gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary-soft)] text-[var(--primary)]"><Brain size={17} /></span><div><p className="text-sm font-bold text-[var(--text)]">{weakestModule ? `优先加强${weakestModule.label}` : "先完成第一组练习"}</p><p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">{weakestModule ? `${weakestModule.english} 当前正确率 ${formatNumber(weakestModule.accuracy, 1)}%，建议先做低压复盘。` : "完成几道题后，这里会自动根据真实数据给出建议。"}</p></div></div></div>
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4"><div className="flex gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--warning-soft)] text-[var(--warning)]"><CalendarDays size={17} /></span><div><p className="text-sm font-bold text-[var(--text)]">{studyPlan?.study_goal || "完善学习计划"}</p><p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">{studyPlan ? "保持每日目标，系统会持续积累练习画像。" : "设置考试类型、目标分和考试日期后，dashboard 会更准确。"}</p></div></div></div>
            </CardContent>
          </Card>

          <Card className="rounded-[var(--radius-lg)]">
            <CardHeader><div><CardTitle>成就状态</CardTitle><CardDescription>你的当前称号与最近解锁</CardDescription></div></CardHeader>
            <CardContent className="pt-4">
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--success-soft)] text-[var(--success)]"><Award size={19} /></span><div className="min-w-0"><p className="truncate text-sm font-bold text-[var(--text)]">{overallAchievement?.title || "暂无称号"}</p><p className="mt-1 truncate text-xs text-[var(--text-soft)]">{latestAchievement ? `最近解锁：${latestAchievement.title}` : "完成练习后会开始解锁成就。"}</p></div></div><Link href="/achievements" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--bg-soft)]">查看成就<ArrowRight size={15} /></Link></div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <Card className="rounded-[var(--radius-lg)]">
          <CardHeader><div><CardTitle>高频练习题型</CardTitle><CardDescription>按完成量排序</CardDescription></div></CardHeader>
          <CardContent className="space-y-3 pt-4">
            {topQuestionTypes.length > 0 ? topQuestionTypes.map((item) => <div key={`${item.module_type}-${item.question_type}`} className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-3"><div className="min-w-0"><p className="truncate text-sm font-bold uppercase text-[var(--text)]">{item.question_type}</p><p className="mt-1 text-xs text-[var(--text-soft)]">{MODULE_META[item.module_type]?.english || item.module_type} · {formatNumber(item.total_study_minutes)} 分钟</p></div><div className="text-right"><p className="text-sm font-bold text-[var(--primary)]">{formatNumber(item.completed)} 道</p><p className="mt-1 text-xs text-[var(--text-soft)]">{formatNumber(item.accuracy, 1)}%</p></div></div>) : <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--bg-soft)] p-6 text-center text-sm text-[var(--text-soft)]">还没有题型统计。开始做题后，这里会自动生成你的训练画像。</div>}
          </CardContent>
        </Card>

        <Card className="rounded-[var(--radius-lg)]">
          <CardHeader><div><CardTitle>最近练习</CardTitle><CardDescription>最新提交记录</CardDescription></div></CardHeader>
          <CardContent className="space-y-3 pt-4">
            {(recentAttempts ?? []).length > 0 ? (recentAttempts ?? []).map((attempt, index) => <div key={`${attempt.submitted_at}-${attempt.question_source}-${index}`} className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-3"><div className="min-w-0"><p className="truncate text-sm font-bold uppercase text-[var(--text)]">{attempt.question_source || "练习记录"}</p><p className="mt-1 text-xs text-[var(--text-soft)]">{attempt.module_type || "未知模块"} · {attempt.submitted_at ? formatDate(attempt.submitted_at) : "无时间"}</p></div><div className="text-right"><p className="text-sm font-bold text-[var(--text)]">{attempt.score !== null ? `${formatNumber(toNumber(attempt.score), 1)} 分` : attempt.accuracy !== null ? `${formatNumber(toNumber(attempt.accuracy), 1)}%` : attempt.is_correct === true ? "正确" : attempt.is_correct === false ? "待复盘" : attempt.status || "-"}</p><p className="mt-1 text-xs text-[var(--text-soft)]">#{index + 1}</p></div></div>) : <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--bg-soft)] p-6 text-center text-sm text-[var(--text-soft)]">暂无最近练习记录。</div>}
          </CardContent>
        </Card>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)] sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary-soft)] text-[var(--primary)]"><Sparkles size={18} /></span><div><p className="font-bold text-[var(--text)]">今日推荐路径</p><p className="mt-1 text-sm leading-6 text-[var(--text-soft)]">先做薄弱模块，再用 AI 反馈复盘，最后进入 analytics 看趋势。这样不会盲练。</p></div></div>
          <div className="flex flex-col gap-2 sm:flex-row"><Link href="/mock-test" className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--bg-soft)]">模拟评估</Link><Link href="/my-courses" className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)]">进入课程</Link></div>
        </div>
      </section>
    </main>
  );
}
