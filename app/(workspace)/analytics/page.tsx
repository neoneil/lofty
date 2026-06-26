import { Activity, Brain, ChartColumn, Clock3, Flame, Target } from "lucide-react";

import { AnalyticsChart } from "@/components/dashboard-v2/analytics-chart";
import { Badge } from "@/components/ui-v2/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui-v2/card";
import { requireUser } from "@/lib/auth/require-user";
import { getAchievementStatsForUser } from "@/lib/achievements/stats";
import type { QuestionTypeStat } from "@/lib/achievements/types";

const MODULES = [
  { id: "listening", label: "听力" },
  { id: "speaking", label: "口语" },
  { id: "reading", label: "阅读" },
  { id: "writing", label: "写作" },
] as const;

const QUESTION_TYPE_LABELS: Record<string, string> = {
  essay: "Essay",
  rfib: "RFIB",
  fibrw: "FIBRW",
  fib_l: "FIB-L",
};

function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function getQuestionTypeLabel(questionType: string) {
  return QUESTION_TYPE_LABELS[questionType] ?? questionType.toUpperCase();
}

function aggregateModules(questionTypeStats: QuestionTypeStat[]) {
  return MODULES.map((module) => {
    const rows = questionTypeStats.filter((stat) => stat.module_type === module.id);
    const completed = rows.reduce((total, stat) => total + stat.completed, 0);
    const correct = rows.reduce((total, stat) => total + stat.correct, 0);

    return {
      module: module.label,
      completed,
      accuracy: completed > 0 ? round((correct / completed) * 100) : 0,
      studyMinutes: round(rows.reduce((total, stat) => total + stat.total_study_minutes, 0)),
    };
  });
}

function ChartEmptyState({ message }: { message: string }) {
  return <div className="flex h-full min-h-[260px] items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--bg-soft)] px-6 text-center text-sm text-[var(--text-faint)]">{message}</div>;
}

export default async function AnalyticsPage() {
  const { supabase, user } = await requireUser("/analytics");
  const { overview, questionTypeStats } = await getAchievementStatsForUser(supabase, user.id);
  const moduleData = aggregateModules(questionTypeStats);
  const practicedQuestionTypes = questionTypeStats.filter((stat) => stat.completed > 0);
  const questionAccuracyData = practicedQuestionTypes
    .map((stat) => ({ type: getQuestionTypeLabel(stat.question_type), accuracy: round(stat.accuracy), completed: stat.completed }))
    .sort((a, b) => b.completed - a.completed);
  const weakestQuestionType = [...practicedQuestionTypes].sort((a, b) => a.accuracy - b.accuracy)[0];
  const hasModuleData = moduleData.some((item) => item.completed > 0);
  const hasStudyTime = moduleData.some((item) => item.studyMinutes > 0);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="mx-auto flex w-full max-w-[1700px] flex-col gap-6 px-3 py-4 sm:px-4 sm:py-6 lg:px-6">
        <header>
          <Badge className="mb-3">Learning Analytics</Badge>
          <h1 className="text-2xl font-semibold text-[var(--text)] sm:text-3xl">学习数据分析</h1>
          <p className="mt-2 text-sm text-[var(--text-soft)]">根据你的真实练习记录汇总完成量、正确率、学习时间和 AI 评分。</p>
        </header>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:gap-5 xl:grid-cols-4">
          <Card>
            <CardContent className="flex items-center justify-between gap-4 p-5 sm:p-6">
              <div><div className="text-sm text-[var(--text-soft)]">综合正确率</div><div className="mt-2 text-3xl font-semibold text-[var(--text)]">{round(overview.overall_accuracy)}%</div><div className="mt-2 text-sm text-[var(--text-faint)]">{overview.total_correct} 次正确</div></div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]"><Target size={22} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between gap-4 p-5 sm:p-6">
              <div><div className="text-sm text-[var(--text-soft)]">累计完成</div><div className="mt-2 text-3xl font-semibold text-[var(--text)]">{overview.total_completed}</div><div className="mt-2 text-sm text-[var(--text-faint)]">{overview.practiced_question_count} 道题已练习</div></div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--success-soft)] text-[var(--success)]"><Activity size={22} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between gap-4 p-5 sm:p-6">
              <div><div className="text-sm text-[var(--text-soft)]">最长连续学习</div><div className="mt-2 text-3xl font-semibold text-[var(--text)]">{overview.longest_study_streak_days}</div><div className="mt-2 text-sm text-[var(--text-faint)]">天</div></div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--warning-soft)] text-[var(--warning)]"><Flame size={22} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between gap-4 p-5 sm:p-6">
              <div><div className="text-sm text-[var(--text-soft)]">最高 AI 评分</div><div className="mt-2 text-3xl font-semibold text-[var(--text)]">{round(overview.highest_ai_score)}</div><div className="mt-2 text-sm text-[var(--text-faint)]">历史最高分</div></div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]"><Brain size={22} /></div>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-6">
          <Card>
            <CardHeader><div><Badge variant="secondary" className="mb-3">Completion</Badge><CardTitle>模块完成量</CardTitle><CardDescription>听说读写各模块累计完成次数</CardDescription></div></CardHeader>
            <CardContent className="p-4 pt-2 sm:p-6 sm:pt-2">{hasModuleData ? <AnalyticsChart variant="area" data={moduleData} xKey="module" yKey="completed" height={320} /> : <ChartEmptyState message="完成练习后，这里将显示模块完成量。" />}</CardContent>
          </Card>

          <Card>
            <CardHeader><div><Badge variant="secondary" className="mb-3">Accuracy</Badge><CardTitle>模块正确率</CardTitle><CardDescription>按各模块完成量加权计算正确率</CardDescription></div></CardHeader>
            <CardContent className="p-4 pt-2 sm:p-6 sm:pt-2">{hasModuleData ? <AnalyticsChart variant="line" data={moduleData} xKey="module" yKey="accuracy" tone="success" goal={80} height={320} /> : <ChartEmptyState message="暂时没有可计算的模块正确率。" />}</CardContent>
          </Card>

          <Card>
            <CardHeader><div><Badge variant="secondary" className="mb-3">Question Types</Badge><CardTitle>题型正确率</CardTitle><CardDescription>{weakestQuestionType ? `当前最需关注：${getQuestionTypeLabel(weakestQuestionType.question_type)}（${round(weakestQuestionType.accuracy)}%）` : "完成题型练习后自动生成比较"}</CardDescription></div></CardHeader>
            <CardContent className="p-4 pt-2 sm:p-6 sm:pt-2">{questionAccuracyData.length > 0 ? <AnalyticsChart variant="bar" data={questionAccuracyData} xKey="type" yKey="accuracy" tone="warning" height={320} /> : <ChartEmptyState message="暂时没有已练习题型数据。" />}</CardContent>
          </Card>

          <Card>
            <CardHeader><div><Badge variant="secondary" className="mb-3">Study Time</Badge><CardTitle>模块学习时间</CardTitle><CardDescription>当前累计 {round(overview.total_study_minutes / 60)} 小时</CardDescription></div></CardHeader>
            <CardContent className="p-4 pt-2 sm:p-6 sm:pt-2">{hasStudyTime ? <AnalyticsChart variant="pie" data={moduleData} pieDataKey="studyMinutes" pieNameKey="module" showLegend height={320} /> : <ChartEmptyState message="有计时练习后，这里将显示学习时间分配。" />}</CardContent>
          </Card>
        </section>

        <Card>
          <CardContent className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
            <div className="flex items-center gap-3"><ChartColumn size={18} className="text-[var(--primary)]" /><div><div className="text-xs text-[var(--text-faint)]">平均最新评分</div><div className="mt-1 font-semibold text-[var(--text)]">{round(overview.average_score)}</div></div></div>
            <div className="flex items-center gap-3"><Clock3 size={18} className="text-[var(--primary)]" /><div><div className="text-xs text-[var(--text-faint)]">累计学习时间</div><div className="mt-1 font-semibold text-[var(--text)]">{round(overview.total_study_minutes / 60)} 小时</div></div></div>
            <div className="flex items-center gap-3"><Target size={18} className="text-[var(--primary)]" /><div><div className="text-xs text-[var(--text-faint)]">历史最高连续答对</div><div className="mt-1 font-semibold text-[var(--text)]">{overview.max_correct_streak} 道</div></div></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
