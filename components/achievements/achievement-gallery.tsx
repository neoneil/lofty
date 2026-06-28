import { Award, BookOpen, Check, Crown, Ear, Flame, LockKeyhole, Medal, Mic, PenTool, ShieldCheck, Sparkles, Star, Target, Trophy } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui-v2/card";
import { createAchievementEngineContext, evaluateAchievementCondition, evaluateQuestionTypeRule, evaluateStandaloneAchievement, isHiddenAchievement } from "@/lib/achievements/engine";
import type { AchievementConfig, AchievementEvaluation, AchievementOverview, QuestionTypeStat, StandaloneAchievement } from "@/lib/achievements/types";

const categoryIcons = {
  overall: Crown,
  speaking: Mic,
  writing: PenTool,
  reading: BookOpen,
  listening: Ear,
};

const rarityVariants = {
  common: "secondary",
  uncommon: "success",
  rare: "default",
  epic: "warning",
  legendary: "danger",
  mythic: "danger",
} as const;

function formatNumber(value: number, unit?: string) {
  const displayed = Number.isInteger(value) ? value.toString() : value.toFixed(1);
  return `${displayed}${unit ?? ""}`;
}

function ProgressDetails({ evaluation }: { evaluation: AchievementEvaluation }) {
  if (!evaluation.supported) {
    return <div className="mt-3 flex items-center gap-2 border-t border-[var(--border)] pt-3 text-xs text-[var(--text-faint)]"><LockKeyhole size={14} /><span>当前统计数据暂不支持计算</span></div>;
  }

  return (
    <div className="mt-3 space-y-2 border-t border-[var(--border)] pt-3">
      {evaluation.progress.map((item) => {
        const percent = item.target > 0 ? Math.min((item.current / item.target) * 100, 100) : 100;
        return (
          <div key={item.label}>
            <div className="flex items-center justify-between gap-3 text-xs"><span className="text-[var(--text-faint)]">{item.label}</span><span className="font-medium text-[var(--text-soft)]">{formatNumber(item.current, item.unit)} / {formatNumber(item.target, item.unit)}</span></div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--border)]"><div className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-300" style={{ width: `${percent}%` }} /></div>
          </div>
        );
      })}
    </div>
  );
}

function StatusIcon({ evaluation }: { evaluation: AchievementEvaluation }) {
  if (evaluation.unlocked) return <Check size={15} />;
  return <LockKeyhole size={14} />;
}

function AchievementDoneStamp({ compact = false }: { compact?: boolean }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute z-10 -rotate-12 rounded-[3px] border-2 border-[var(--success)] p-0.5 text-[var(--success)] opacity-55 ${compact ? "right-3 top-12" : "right-5 top-[76px]"}`}>
      <div className={`flex items-center border border-[var(--success)] font-black leading-none tracking-[0.12em] ${compact ? "gap-0.5 px-1.5 py-1 text-[9px]" : "gap-1 px-2 py-1.5 text-xs"}`}><Check size={compact ? 10 : 13} strokeWidth={3} />DONE</div>
    </div>
  );
}

function AchievementCollection({ title, description, achievements, rarityLabels, icon: Icon, context }: { title: string; description: string; achievements: StandaloneAchievement[]; rarityLabels: Record<string, string>; icon: typeof Trophy; context: ReturnType<typeof createAchievementEngineContext> }) {
  const visibleAchievements = achievements.filter((achievement) => {
    const evaluation = evaluateStandaloneAchievement(achievement, context);
    return !isHiddenAchievement(achievement) || evaluation.unlocked;
  });

  if (visibleAchievements.length === 0) return null;

  return (
    <section className="space-y-4">
      <div>
        <div className="flex items-center gap-2 text-[var(--text)]"><Icon size={20} className="text-[var(--primary)]" /><h2 className="text-lg font-semibold">{title}</h2></div>
        <p className="mt-1 text-sm leading-6 text-[var(--text-soft)]">{description}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visibleAchievements.map((achievement) => {
          const evaluation = evaluateStandaloneAchievement(achievement, context);
          return (
            <Card key={achievement.id} className={`group relative overflow-hidden ${evaluation.unlocked ? "border-[var(--border-strong)] hover:shadow-[var(--shadow-md)]" : "bg-[var(--bg-soft)] opacity-60"}`}>
              {evaluation.unlocked ? <AchievementDoneStamp /> : null}
              <CardContent className="relative p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] ${evaluation.unlocked ? "bg-[var(--primary-soft)] text-[var(--primary)]" : "bg-[var(--border)] text-[var(--text-faint)]"}`}><Award size={21} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold text-[var(--text)]">{achievement.title}</h3><Badge variant={evaluation.unlocked ? rarityVariants[achievement.rarity as keyof typeof rarityVariants] ?? "secondary" : "secondary"}>{evaluation.unlocked ? rarityLabels[achievement.rarity] ?? achievement.rarity : "未解锁"}</Badge></div>
                    <p className="mt-0.5 text-xs text-[var(--text-faint)]">{achievement.englishTitle}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-[var(--text-soft)]">{achievement.description ?? (achievement.days ? `连续学习 ${achievement.days} 天。` : "达成指定学习目标。")}</p>
                <ProgressDetails evaluation={evaluation} />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

export function AchievementGallery({ config, overview, questionTypeStats }: { config: AchievementConfig; overview: AchievementOverview; questionTypeStats: QuestionTypeStat[] }) {
  const context = createAchievementEngineContext(config, overview, questionTypeStats);
  const categoryEvaluations = config.categories.flatMap((category) => category.levels.map((level) => evaluateAchievementCondition(level.condition, context)));
  const standaloneAchievements = [...config.globalAchievements, ...config.streakAchievements, ...config.scoreAchievements, ...config.hiddenAchievements];
  const standaloneEvaluations = standaloneAchievements.map((achievement) => evaluateStandaloneAchievement(achievement, context));
  const questionTypeEvaluations = config.categories.flatMap((category) => (category.questionTypes ?? []).flatMap((questionType) => config.typeLevelRule.levels.map((rule) => evaluateQuestionTypeRule(rule.condition, context.questionTypeMap.get(questionType.id)))));
  const allEvaluations = [...categoryEvaluations, ...standaloneEvaluations, ...questionTypeEvaluations];
  const unlockedCount = allEvaluations.filter((evaluation) => evaluation.unlocked).length;
  const supportedCount = allEvaluations.filter((evaluation) => evaluation.supported).length;

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden border-[var(--border-strong)]">
        <CardContent className="relative p-5 sm:p-7 lg:p-8">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[var(--primary-soft)] blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <Badge variant="outline"><Sparkles size={13} className="mr-1.5" />致远成就图鉴</Badge>
              <h1 className="mt-4 text-2xl font-semibold text-[var(--text)] sm:text-3xl">练习有迹，成就可循</h1>
              <p className="mt-3 text-sm leading-7 text-[var(--text-soft)] sm:text-base">成就状态根据你的真实练习统计实时计算，继续学习即可逐步解锁。</p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-3 text-center sm:px-5"><div className="text-xl font-semibold text-[var(--text)]">{overview.total_completed}</div><div className="mt-1 text-xs text-[var(--text-faint)]">累计完成</div></div>
              <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-3 text-center sm:px-5"><div className="text-xl font-semibold text-[var(--text)]">{formatNumber(overview.overall_accuracy, "%")}</div><div className="mt-1 text-xs text-[var(--text-faint)]">综合正确率</div></div>
              <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-3 text-center sm:px-5"><div className="text-xl font-semibold text-[var(--text)]">{unlockedCount}/{supportedCount}</div><div className="mt-1 text-xs text-[var(--text-faint)]">已解锁</div></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {config.categories.map((category) => {
        const Icon = categoryIcons[category.id as keyof typeof categoryIcons] ?? Medal;
        return (
          <section key={category.id} className="space-y-4">
            <Card>
              <CardHeader className="items-start gap-4 p-5 pb-0 sm:p-6 sm:pb-0">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]"><Icon size={23} /></div>
                  <div><CardTitle>{category.name}</CardTitle><p className="mt-0.5 text-xs font-medium text-[var(--text-faint)]">{category.englishName}</p><p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{category.description}</p></div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 p-5 sm:p-6">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                  {category.levels.map((level) => {
                    const evaluation = evaluateAchievementCondition(level.condition, context);
                    return (
                      <div key={level.level} className={`relative rounded-[var(--radius-md)] border p-3.5 ${evaluation.unlocked ? "border-[var(--border-strong)] bg-[var(--card)]" : "border-[var(--border)] bg-[var(--bg-soft)] opacity-60"}`}>
                        {evaluation.unlocked ? <AchievementDoneStamp compact /> : null}
                        <div className="flex items-center justify-between gap-2"><span className={evaluation.unlocked ? "text-xs font-semibold text-[var(--primary)]" : "text-xs font-semibold text-[var(--text-faint)]"}>LEVEL {level.level}</span><span className={evaluation.unlocked ? "text-[var(--success)]" : "text-[var(--text-faint)]"}><StatusIcon evaluation={evaluation} /></span></div>
                        <div className="mt-3 font-semibold text-[var(--text)]">{level.title}</div>
                        <div className="mt-0.5 truncate text-xs text-[var(--text-faint)]">{level.englishTitle}</div>
                        <ProgressDetails evaluation={evaluation} />
                      </div>
                    );
                  })}
                </div>

                {category.questionTypes && category.questionTypes.length > 0 && (
                  <div>
                    <div className="mb-3 flex items-center gap-2"><ShieldCheck size={17} className="text-[var(--primary)]" /><h3 className="text-sm font-semibold text-[var(--text)]">题型专属称号</h3></div>
                    <div className="grid gap-3 lg:grid-cols-2">
                      {category.questionTypes.map((questionType) => {
                        const stat = context.questionTypeMap.get(questionType.id);
                        const levelEvaluations = config.typeLevelRule.levels.map((rule) => evaluateQuestionTypeRule(rule.condition, stat));
                        const unlockedLevel = levelEvaluations.reduce((highest, evaluation, index) => evaluation.unlocked ? index : highest, -1);
                        const nextEvaluation = levelEvaluations[Math.min(unlockedLevel + 1, levelEvaluations.length - 1)];
                        return (
                          <div key={questionType.id} className="relative rounded-[var(--radius-md)] border border-[var(--border)] px-4 py-3.5 lg:w-4/5 lg:justify-self-center">
                            {unlockedLevel === questionType.levels.length - 1 ? <AchievementDoneStamp compact /> : null}
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><div className="font-semibold text-[var(--text)]">{questionType.wuxiaName}</div><div className="text-xs text-[var(--text-faint)]">{questionType.name}</div></div>
                            <div className="mt-3 flex flex-wrap gap-1.5">{questionType.levels.map((level, index) => <Badge key={level} variant={levelEvaluations[index]?.unlocked ? "default" : "secondary"} className={levelEvaluations[index]?.unlocked ? "" : "opacity-60"}>{levelEvaluations[index]?.unlocked ? <Check size={11} className="mr-1" /> : <LockKeyhole size={11} className="mr-1" />}{index + 1}. {level}</Badge>)}</div>
                            <ProgressDetails evaluation={nextEvaluation} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        );
      })}

      <AchievementCollection title="江湖里程碑" description="记录练习总量与综合准确率的重要节点。" achievements={config.globalAchievements} rarityLabels={config.rarityLabels} icon={Trophy} context={context} />
      <AchievementCollection title="连续修行" description="按悉尼时区计算历史最长连续学习天数。" achievements={config.streakAchievements} rarityLabels={config.rarityLabels} icon={Flame} context={context} />
      <AchievementCollection title="高分试炼" description="根据带有 AI 反馈的历史提交最高分判断。" achievements={config.scoreAchievements} rarityLabels={config.rarityLabels} icon={Star} context={context} />
      <AchievementCollection title="隐藏奇遇" description="隐藏成就只会在真实达成后出现。" achievements={config.hiddenAchievements} rarityLabels={config.rarityLabels} icon={Sparkles} context={context} />

      <Card>
        <CardHeader><div><CardTitle>题型称号晋级规则</CardTitle><p className="mt-1 text-sm text-[var(--text-soft)]">每个题型按完成量与正确率逐步晋级，共五重境界。</p></div></CardHeader>
        <CardContent className="grid gap-2 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-5">
          {config.typeLevelRule.levels.map((rule) => <div key={rule.index} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4"><div className="flex items-center gap-2 text-xs font-semibold text-[var(--primary)]"><Target size={14} />第 {rule.index + 1} 重</div><div className="mt-2 text-sm leading-6 text-[var(--text-soft)]">完成 {rule.condition.completed?.gte ?? 0} 道题{rule.condition.accuracy?.gte ? `，正确率达到 ${rule.condition.accuracy.gte * 100}%` : ""}</div></div>)}
        </CardContent>
      </Card>
    </div>
  );
}
