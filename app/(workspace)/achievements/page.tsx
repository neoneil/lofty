import { BookOpen, ChevronDown, Headphones, Sparkles } from "lucide-react";

import { AchievementGallery } from "@/components/achievements/achievement-gallery";
import { Badge } from "@/components/ui-v2/badge";
import { Card, CardContent } from "@/components/ui-v2/card";
import { getAchievementConfig, normalizeAchievementExamType, type AchievementExamType } from "@/lib/achievements/configs";
import { requireUser } from "@/lib/auth/require-user";
import { getServerUserWithRole } from "@/lib/auth/server-auth";
import { getAchievementStatsForUser } from "@/lib/achievements/stats";

type StudyPlan = {
  exam_type: string | null;
};

function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat("zh-CN", { maximumFractionDigits: digits }).format(value);
}

function getExamMeta(examType: AchievementExamType) {
  if (examType === "IELTS") {
    return {
      title: "IELTS 成就",
      description: "剑桥阅读、听力、口语和写作的高分进度。",
      icon: BookOpen,
    };
  }

  return {
    title: "PTE 成就",
    description: "PTE 各题型练习、AI 评分和连续学习进度。",
    icon: Headphones,
  };
}

export default async function AchievementsPage() {
  const userContext = await requireUser("/achievements");
  const { supabase, user } = userContext;
  const [{ data: studyPlan }, pteStats, ieltsStats, adminContext] = await Promise.all([
    supabase.from("study_plans").select("exam_type").eq("user_id", user.id).maybeSingle<StudyPlan>(),
    getAchievementStatsForUser(supabase, user.id, { examType: "PTE" }),
    getAchievementStatsForUser(supabase, user.id, { examType: "IELTS" }),
    getServerUserWithRole(["admin"], userContext),
  ]);
  const preferredExamType = normalizeAchievementExamType(studyPlan?.exam_type);
  const isAdmin = Boolean(adminContext);
  const sections = [
    { examType: "PTE" as const, stats: pteStats },
    { examType: "IELTS" as const, stats: ieltsStats },
  ].sort((left, right) => {
    if (left.examType === preferredExamType) return -1;
    if (right.examType === preferredExamType) return 1;
    return 0;
  });

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 sm:space-y-6">
      <Card className="overflow-hidden border-[var(--border-strong)]">
        <CardContent className="relative p-5 sm:p-7 lg:p-8">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[var(--primary-soft)] blur-3xl" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <Badge variant="outline"><Sparkles size={13} className="mr-1.5" />成就中心</Badge>
              <h1 className="mt-4 text-2xl font-semibold text-[var(--text)] sm:text-3xl">PTE 与 IELTS 成就分开计算</h1>
              <p className="mt-3 text-sm leading-7 text-[var(--text-soft)] sm:text-base">默认展开会跟随你的 study plan 考试类型；管理员会同时展开两套，方便检查。</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 text-center"><div className="text-xl font-semibold text-[var(--text)]">{formatNumber(pteStats.overview.total_completed)}</div><div className="mt-1 text-xs text-[var(--text-faint)]">PTE 完成</div></div>
              <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 text-center"><div className="text-xl font-semibold text-[var(--text)]">{formatNumber(ieltsStats.overview.total_completed)}</div><div className="mt-1 text-xs text-[var(--text-faint)]">IELTS 完成</div></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {sections.map(({ examType, stats }) => {
        const config = getAchievementConfig(examType);
        const meta = getExamMeta(examType);
        const Icon = meta.icon;
        const defaultOpen = isAdmin || preferredExamType === examType;

        return (
          <details key={examType} open={defaultOpen} className="group rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
            <summary className="flex cursor-pointer list-none flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]"><Icon size={20} /></span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold text-[var(--text)]">{meta.title}</h2><Badge variant={preferredExamType === examType ? "default" : "secondary"}>{preferredExamType === examType ? "Study Plan 默认" : examType}</Badge></div>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-soft)]">{meta.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <div className="flex gap-2 text-xs text-[var(--text-soft)]"><span className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] px-2.5 py-1.5">{formatNumber(stats.overview.total_completed)} 道</span><span className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] px-2.5 py-1.5">{formatNumber(stats.overview.overall_accuracy, 1)}%</span></div>
                <ChevronDown size={18} className="shrink-0 text-[var(--text-faint)] transition-transform group-open:rotate-180" />
              </div>
            </summary>
            <div className="border-t border-[var(--border)] p-4 sm:p-5">
              <AchievementGallery config={config} overview={stats.overview} questionTypeStats={stats.questionTypeStats} showHero={false} />
            </div>
          </details>
        );
      })}
    </div>
  );
}
