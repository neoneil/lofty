"use client";

import { BookOpen, ChevronDown, Headphones, LoaderCircle, Sparkles } from "lucide-react";
import { useCallback, useState } from "react";

import { AchievementGallery } from "@/components/achievements/achievement-gallery";
import { Badge } from "@/components/ui-v2/badge";
import { Card, CardContent } from "@/components/ui-v2/card";
import { getAchievementConfig, type AchievementExamType } from "@/lib/achievements/configs";
import type { AchievementStats } from "@/lib/achievements/types";

function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat("zh-CN", { maximumFractionDigits: digits }).format(value);
}

function getExamMeta(examType: AchievementExamType) {
  return examType === "IELTS"
    ? { title: "IELTS 成就", description: "剑桥阅读、听力、口语和写作的高分进度。", icon: BookOpen }
    : { title: "PTE 成就", description: "PTE 各题型练习、AI 评分和连续学习进度。", icon: Headphones };
}

function AchievementSection({ examType, preferredExamType, stats, loading, error, onLoad }: { examType: AchievementExamType; preferredExamType: AchievementExamType; stats?: AchievementStats; loading: boolean; error?: string; onLoad: () => void }) {
  const [open, setOpen] = useState(preferredExamType === examType);
  const config = getAchievementConfig(examType);
  const meta = getExamMeta(examType);
  const Icon = meta.icon;

  return (
    <details open={open} onToggle={(event) => { const nextOpen = event.currentTarget.open; setOpen(nextOpen); if (nextOpen && !stats) onLoad(); }} className="group rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
      <summary className="flex cursor-pointer list-none flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div className="flex min-w-0 items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]"><Icon size={20} /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold text-[var(--text)]">{meta.title}</h2><Badge variant={preferredExamType === examType ? "default" : "secondary"}>{preferredExamType === examType ? "Profile 默认" : examType}</Badge></div><p className="mt-1 text-sm leading-6 text-[var(--text-soft)]">{meta.description}</p></div></div><div className="flex items-center justify-between gap-3 sm:justify-end">{stats ? <div className="flex gap-2 text-xs text-[var(--text-soft)]"><span className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] px-2.5 py-1.5">{formatNumber(stats.overview.total_completed)} 道</span><span className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] px-2.5 py-1.5">{formatNumber(stats.overview.overall_accuracy, 1)}%</span></div> : null}<ChevronDown size={18} className="shrink-0 text-[var(--text-faint)] transition-transform group-open:rotate-180" /></div></summary>
      {stats ? <div className="border-t border-[var(--border)] p-4 sm:p-5"><AchievementGallery config={config} overview={stats.overview} questionTypeStats={stats.questionTypeStats} showHero={false} /></div> : <div className="flex min-h-40 items-center justify-center gap-2 border-t border-[var(--border)] p-5 text-sm text-[var(--text-soft)]">{loading ? <><LoaderCircle size={17} className="animate-spin text-[var(--primary)]" />正在加载...</> : error ? <button type="button" onClick={onLoad} className="font-semibold text-[var(--primary)]">{error} 点击重试</button> : "展开后加载成就数据"}</div>}
    </details>
  );
}

export function AchievementsPageClient({ preferredExamType, initialStats }: { preferredExamType: AchievementExamType; initialStats: AchievementStats }) {
  const [statsByExam, setStatsByExam] = useState<Partial<Record<AchievementExamType, AchievementStats>>>({ [preferredExamType]: initialStats });
  const [loadingExam, setLoadingExam] = useState<AchievementExamType | null>(null);
  const [errors, setErrors] = useState<Partial<Record<AchievementExamType, string>>>({});

  const loadExam = useCallback(async (examType: AchievementExamType) => {
    if (statsByExam[examType] || loadingExam === examType) return;
    setLoadingExam(examType);
    try {
      const response = await fetch(`/api/profile/achievement-stats?examType=${examType}`, { cache: "no-store" });
      const payload = await response.json() as { stats?: AchievementStats; message?: string };
      if (!response.ok || !payload.stats) throw new Error(payload.message || "加载失败");
      setStatsByExam((current) => ({ ...current, [examType]: payload.stats }));
      setErrors((current) => ({ ...current, [examType]: undefined }));
    } catch (error) {
      setErrors((current) => ({ ...current, [examType]: error instanceof Error ? error.message : "加载失败" }));
    } finally {
      setLoadingExam(null);
    }
  }, [loadingExam, statsByExam]);

  const orderedExamTypes: AchievementExamType[] = [preferredExamType, preferredExamType === "PTE" ? "IELTS" : "PTE"];
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 sm:space-y-6">
      <Card className="overflow-hidden border-[var(--border-strong)]"><CardContent className="p-5 sm:p-7 lg:p-8"><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-2xl"><Badge variant="outline"><Sparkles size={13} className="mr-1.5" />成就中心</Badge><h1 className="mt-4 text-2xl font-semibold text-[var(--text)] sm:text-3xl">PTE 与 IELTS 成就</h1><p className="mt-3 text-sm leading-7 text-[var(--text-soft)] sm:text-base">默认展开会跟随你的 Profile 考试类型</p></div><div className="grid grid-cols-2 gap-2 sm:gap-3">{(["PTE", "IELTS"] as const).map((examType) => <div key={examType} className="min-w-0 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 text-center"><div className="text-xl font-semibold text-[var(--text)]">{statsByExam[examType] ? formatNumber(statsByExam[examType]!.overview.total_completed) : "--"}</div><div className="mt-1 text-xs text-[var(--text-faint)]">{examType} 完成</div></div>)}</div></div></CardContent></Card>
      {orderedExamTypes.map((examType) => <AchievementSection key={examType} examType={examType} preferredExamType={preferredExamType} stats={statsByExam[examType]} loading={loadingExam === examType} error={errors[examType]} onLoad={() => void loadExam(examType)} />)}
    </div>
  );
}
