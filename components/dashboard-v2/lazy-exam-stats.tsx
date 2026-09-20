"use client";

import { BookOpen, Headphones, LoaderCircle, Mic, PenTool } from "lucide-react";
import { useCallback, useState } from "react";

import { Badge } from "@/components/ui-v2/badge";
import type { AchievementStats, QuestionTypeStat } from "@/lib/achievements/types";
import { cn } from "@/lib/utils";

type ExamType = "PTE" | "IELTS";

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

function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat("zh-CN", { maximumFractionDigits: digits }).format(value);
}

function getModuleSummaries(stats: QuestionTypeStat[]): ModuleSummary[] {
  const grouped = new Map<string, { completed: number; correct: number; studyMinutes: number }>();
  for (const stat of stats) {
    const current = grouped.get(stat.module_type) ?? { completed: 0, correct: 0, studyMinutes: 0 };
    current.completed += stat.completed;
    current.correct += stat.correct;
    current.studyMinutes += stat.total_study_minutes;
    grouped.set(stat.module_type, current);
  }
  return Object.entries(MODULE_META).map(([key, meta]) => {
    const current = grouped.get(key) ?? { completed: 0, correct: 0, studyMinutes: 0 };
    return { key, ...meta, completed: current.completed, accuracy: current.completed > 0 ? Math.round((current.correct / current.completed) * 1000) / 10 : 0, studyMinutes: Math.round(current.studyMinutes) };
  });
}

function ProgressBar({ value }: { value: number }) {
  return <div className="h-2 overflow-hidden rounded-full bg-[var(--border-soft)]"><div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }} /></div>;
}

function ExamPanel({ examType, stats, initialOpen, loading, error, onLoad }: { examType: ExamType; stats?: AchievementStats; initialOpen: boolean; loading: boolean; error?: string; onLoad: () => void }) {
  const [open, setOpen] = useState(initialOpen);
  const modules = stats ? getModuleSummaries(stats.questionTypeStats) : [];

  return (
    <details open={open} onToggle={(event) => { const nextOpen = event.currentTarget.open; setOpen(nextOpen); if (nextOpen && !stats) onLoad(); }} className="group rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 sm:px-5"><div><Badge className="mb-2">{examType}</Badge><h3 className="font-bold text-[var(--text)]">{examType === "IELTS" ? "IELTS 数据概览" : "PTE 数据概览"}</h3><p className="mt-1 text-xs text-[var(--text-soft)]">{stats ? `${stats.overview.total_completed} 次完成 · 正确率 ${formatNumber(stats.overview.overall_accuracy, 1)}%` : "展开后加载数据"}</p></div><span className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-bold text-[var(--primary)] group-open:hidden">展开</span><span className="hidden rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-bold text-[var(--primary)] group-open:inline">收起</span></summary>
      {stats ? <div className="grid gap-3 border-t border-[var(--border)] p-4 sm:grid-cols-2">{modules.map((module) => { const Icon = module.icon; return <div key={module.key} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)]", module.tone)}><Icon size={17} /></span><div><p className="text-sm font-bold text-[var(--text)]">{module.label}</p><p className="text-xs font-semibold text-[var(--text-faint)]">{module.english}</p></div></div><Badge variant="secondary">{formatNumber(module.accuracy, 1)}%</Badge></div><div className="mt-3"><ProgressBar value={module.accuracy} /></div><div className="mt-3 flex items-center justify-between text-xs text-[var(--text-soft)]"><span>{formatNumber(module.completed)} 道完成</span><span>{formatNumber(module.studyMinutes)} 分钟</span></div></div>; })}</div> : <div className="flex min-h-36 items-center justify-center gap-2 border-t border-[var(--border)] p-5 text-sm text-[var(--text-soft)]">{loading ? <><LoaderCircle size={17} className="animate-spin text-[var(--primary)]" />正在加载...</> : error ? <button type="button" onClick={onLoad} className="font-semibold text-[var(--primary)]">{error} 点击重试</button> : "展开后加载数据"}</div>}
    </details>
  );
}

export function LazyExamStats({ preferredExamType, initialStats }: { preferredExamType: ExamType; initialStats: AchievementStats }) {
  const [statsByExam, setStatsByExam] = useState<Partial<Record<ExamType, AchievementStats>>>({ [preferredExamType]: initialStats });
  const [loadingExam, setLoadingExam] = useState<ExamType | null>(null);
  const [errors, setErrors] = useState<Partial<Record<ExamType, string>>>({});

  const loadExam = useCallback(async (examType: ExamType) => {
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

  return <section className="grid gap-4 xl:grid-cols-2">{(["IELTS", "PTE"] as const).map((examType) => <ExamPanel key={examType} examType={examType} stats={statsByExam[examType]} initialOpen={preferredExamType === examType} loading={loadingExam === examType} error={errors[examType]} onLoad={() => void loadExam(examType)} />)}</section>;
}
