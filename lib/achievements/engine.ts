import type { AchievementCondition, AchievementConfig, AchievementEvaluation, AchievementOverview, AchievementProgress, QuestionTypeStat, StandaloneAchievement, UnlockedAchievement } from "@/lib/achievements/types";

type ModuleStat = {
  completed: number;
  correct: number;
  accuracy: number;
};

export type AchievementEngineContext = {
  overview: AchievementOverview;
  questionTypeStats: QuestionTypeStat[];
  questionTypeMap: Map<string, QuestionTypeStat>;
  moduleStats: Map<string, ModuleStat>;
  requiredQuestionTypes: Map<string, string[]>;
};

function normalizeTarget(field: string | undefined, value: number) {
  return field?.includes("accuracy") && value <= 1 ? value * 100 : value;
}

function compare(current: number, operator: AchievementCondition["operator"], target: number) {
  switch (operator) {
    case ">": return current > target;
    case "<=": return current <= target;
    case "<": return current < target;
    case "=":
    case "==": return current === target;
    default: return current >= target;
  }
}

function result(progress: AchievementProgress[], supported = true): AchievementEvaluation {
  return {
    supported,
    unlocked: supported && progress.length > 0 && progress.every((item) => item.current >= item.target),
    progress,
  };
}

function getOverviewValue(overview: AchievementOverview, field: string) {
  const value = overview[field as keyof AchievementOverview];
  return typeof value === "number" ? value : undefined;
}

export function createAchievementEngineContext(config: AchievementConfig, overview: AchievementOverview, questionTypeStats: QuestionTypeStat[]): AchievementEngineContext {
  const questionTypeMap = new Map(questionTypeStats.map((stat) => [stat.question_type, stat]));
  const moduleStats = new Map<string, ModuleStat>();

  for (const stat of questionTypeStats) {
    const moduleStat = moduleStats.get(stat.module_type) ?? { completed: 0, correct: 0, accuracy: 0 };
    moduleStat.completed += stat.completed;
    moduleStat.correct += stat.correct;
    moduleStat.accuracy = moduleStat.completed > 0 ? (moduleStat.correct / moduleStat.completed) * 100 : 0;
    moduleStats.set(stat.module_type, moduleStat);
  }

  const requiredQuestionTypes = new Map(
    config.categories
      .filter((category) => category.questionTypes?.length)
      .map((category) => [category.id, category.questionTypes?.map((type) => type.id) ?? []]),
  );

  return { overview, questionTypeStats, questionTypeMap, moduleStats, requiredQuestionTypes };
}

export function evaluateAchievementCondition(condition: AchievementCondition | undefined, context: AchievementEngineContext): AchievementEvaluation {
  if (!condition) return { unlocked: false, supported: false, progress: [] };

  if (condition.scope && condition.field && condition.value !== undefined) {
    const target = normalizeTarget(condition.field, condition.value);
    const current = condition.scope === "overall"
      ? getOverviewValue(context.overview, condition.field)
      : context.questionTypeMap.get(condition.question_type?.toLowerCase() ?? "")?.[condition.field as keyof QuestionTypeStat];

    if (typeof current !== "number") return { unlocked: false, supported: false, progress: [] };

    return {
      supported: true,
      unlocked: compare(current, condition.operator, target),
      progress: [{ label: condition.field, current, target }],
    };
  }

  const target = condition.gte ?? 0;
  const moduleStat = condition.module ? context.moduleStats.get(condition.module.toLowerCase()) : undefined;

  switch (condition.type) {
    case "total_completed_questions":
      return result([{ label: "累计完成", current: context.overview.total_completed, target, unit: "道" }]);
    case "overall_accuracy":
      return result([
        { label: "综合正确率", current: context.overview.overall_accuracy, target: normalizeTarget("accuracy", target), unit: "%" },
        ...(condition.minCompletedQuestions ? [{ label: "累计完成", current: context.overview.total_completed, target: condition.minCompletedQuestions, unit: "道" as const }] : []),
      ]);
    case "module_completed_questions":
      return result([{ label: "模块完成", current: moduleStat?.completed ?? 0, target, unit: "道" }]);
    case "module_accuracy":
      return result([
        { label: "模块正确率", current: moduleStat?.accuracy ?? 0, target: normalizeTarget("accuracy", target), unit: "%" },
        ...(condition.minCompletedQuestions ? [{ label: "模块完成", current: moduleStat?.completed ?? 0, target: condition.minCompletedQuestions, unit: "道" as const }] : []),
      ]);
    case "any_ai_score":
      return result([{ label: "最高 AI 评分", current: context.overview.highest_ai_score, target, unit: "分" }]);
    case "all_modules_completed_at_least": {
      const modules = ["speaking", "writing", "reading", "listening"];
      const current = Math.min(...modules.map((name) => context.moduleStats.get(name)?.completed ?? 0));
      return result([{ label: "四模块最低完成量", current, target, unit: "道" }]);
    }
    case "all_question_types_completed": {
      const required = context.requiredQuestionTypes.get(condition.module?.toLowerCase() ?? "") ?? [];
      if (required.length === 0) return { unlocked: false, supported: false, progress: [] };
      const current = Math.min(...required.map((type) => context.questionTypeMap.get(type)?.completed ?? 0));
      return result([{ label: "各题型最低完成量", current, target, unit: "道" }]);
    }
    case "all_modules_accuracy": {
      const modules = ["speaking", "writing", "reading", "listening"];
      const minAccuracy = Math.min(...modules.map((name) => context.moduleStats.get(name)?.accuracy ?? 0));
      const minCompleted = Math.min(...modules.map((name) => context.moduleStats.get(name)?.completed ?? 0));
      return result([
        { label: "四模块最低正确率", current: minAccuracy, target: normalizeTarget("accuracy", target), unit: "%" },
        { label: "四模块最低完成量", current: minCompleted, target: condition.minCompletedQuestionsPerModule ?? 0, unit: "道" },
      ]);
    }
    case "correct_streak":
      return result([{ label: "历史最高连续答对", current: context.overview.max_correct_streak, target, unit: "道" }]);
    case "practice_time_window":
      if (condition.from !== "00:00" || condition.to !== "04:00") return { unlocked: false, supported: false, progress: [] };
      return result([{ label: "午夜练习", current: context.overview.midnight_practice_count, target: 1 }]);
    default:
      return { unlocked: false, supported: false, progress: [] };
  }
}

export function evaluateStandaloneAchievement(achievement: StandaloneAchievement, context: AchievementEngineContext): AchievementEvaluation {
  if (achievement.days !== undefined) {
    return result([{ label: "历史最长连续学习", current: context.overview.longest_study_streak_days, target: achievement.days }]);
  }

  return evaluateAchievementCondition(achievement.condition, context);
}

export function getHighestUnlockedCategoryLevel(config: AchievementConfig, categoryId: string, context: AchievementEngineContext) {
  const category = config.categories.find((item) => item.id === categoryId);
  if (!category) return null;

  return [...category.levels]
    .sort((a, b) => b.level - a.level)
    .find((level) => evaluateAchievementCondition(level.condition, context).unlocked) ?? null;
}

export function collectUnlockedAchievements(config: AchievementConfig, context: AchievementEngineContext): UnlockedAchievement[] {
  const unlocked: UnlockedAchievement[] = [];

  for (const category of config.categories) {
    for (const level of category.levels) {
      const evaluation = evaluateAchievementCondition(level.condition, context);
      if (!evaluation.unlocked) continue;

      unlocked.push({
        id: `category:${category.id}:level:${level.level}`,
        title: level.title,
        englishTitle: level.englishTitle,
        description: level.subtitle ?? category.description,
        group: category.name,
        statusLabel: `LEVEL ${level.level}`,
        progress: evaluation.progress,
      });
    }

    for (const questionType of category.questionTypes ?? []) {
      const stat = context.questionTypeMap.get(questionType.id);

      config.typeLevelRule.levels.forEach((rule, index) => {
        const evaluation = evaluateQuestionTypeRule(rule.condition, stat);
        if (!evaluation.unlocked) return;

        unlocked.push({
          id: `question-type:${questionType.id}:level:${index + 1}`,
          title: questionType.levels[index],
          englishTitle: questionType.name,
          description: `${questionType.name} 专属称号达到第 ${index + 1} 级。`,
          group: category.name,
          statusLabel: `LEVEL ${index + 1}`,
          progress: evaluation.progress,
        });
      });
    }
  }

  const collections = [
    { group: "江湖里程碑", items: config.globalAchievements },
    { group: "连续修行", items: config.streakAchievements },
    { group: "高分试炼", items: config.scoreAchievements },
    { group: "隐藏成就", items: config.hiddenAchievements },
  ];

  for (const collection of collections) {
    for (const achievement of collection.items) {
      const evaluation = evaluateStandaloneAchievement(achievement, context);
      if (!evaluation.unlocked) continue;

      unlocked.push({
        id: `achievement:${achievement.id}`,
        title: achievement.title,
        englishTitle: achievement.englishTitle,
        description: achievement.description ?? (achievement.days ? `连续学习 ${achievement.days} 天。` : "已达成指定学习目标。"),
        group: collection.group,
        statusLabel: config.rarityLabels[achievement.rarity] ?? achievement.rarity,
        progress: evaluation.progress,
      });
    }
  }

  return unlocked;
}

export function evaluateQuestionTypeRule(condition: AchievementCondition, stat?: QuestionTypeStat): AchievementEvaluation {
  const progress: AchievementProgress[] = [];
  if (condition.completed?.gte !== undefined) progress.push({ label: "题型完成", current: stat?.completed ?? 0, target: condition.completed.gte, unit: "道" });
  if (condition.accuracy?.gte !== undefined) progress.push({ label: "题型正确率", current: stat?.accuracy ?? 0, target: normalizeTarget("accuracy", condition.accuracy.gte), unit: "%" });
  return progress.length > 0 ? result(progress) : { unlocked: false, supported: false, progress: [] };
}

export function isHiddenAchievement(achievement: StandaloneAchievement) {
  return achievement.is_hidden === true || achievement.hidden === true;
}
