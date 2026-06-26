export type AchievementOverview = {
  total_completed: number;
  total_correct: number;
  total_wrong: number;
  overall_accuracy: number;
  total_study_minutes: number;
  highest_score: number;
  highest_ai_score: number;
  average_score: number;
  practiced_question_count: number;
  longest_study_streak_days: number;
  max_correct_streak: number;
  midnight_practice_count: number;
};

export type QuestionTypeStat = {
  question_type: string;
  module_type: string;
  completed: number;
  correct: number;
  wrong: number;
  accuracy: number;
  best_score: number;
  average_score: number;
  total_study_minutes: number;
};

export type AchievementCondition = {
  type?: string;
  scope?: "overall" | "question_type";
  field?: string;
  operator?: ">=" | ">" | "<=" | "<" | "=" | "==";
  value?: number;
  question_type?: string;
  gte?: number;
  module?: string;
  minCompletedQuestions?: number;
  minCompletedQuestionsPerModule?: number;
  from?: string;
  to?: string;
  completed?: { gte?: number };
  accuracy?: { gte?: number };
};

export type AchievementLevel = {
  level: number;
  title: string;
  englishTitle: string;
  subtitle?: string;
  condition: AchievementCondition;
};

export type QuestionTypeAchievement = {
  id: string;
  name: string;
  wuxiaName: string;
  icon: string;
  levels: string[];
};

export type AchievementCategory = {
  id: string;
  name: string;
  englishName: string;
  description: string;
  icon: string;
  colorToken: string;
  levels: AchievementLevel[];
  questionTypes?: QuestionTypeAchievement[];
};

export type StandaloneAchievement = {
  id: string;
  title: string;
  englishTitle: string;
  description?: string;
  icon: string;
  rarity: string;
  days?: number;
  hidden?: boolean;
  is_hidden?: boolean;
  condition?: AchievementCondition;
};

export type AchievementConfig = {
  appName: string;
  description: string;
  categories: AchievementCategory[];
  globalAchievements: StandaloneAchievement[];
  streakAchievements: StandaloneAchievement[];
  scoreAchievements: StandaloneAchievement[];
  hiddenAchievements: StandaloneAchievement[];
  typeLevelRule: {
    description: string;
    levels: Array<{ index: number; condition: AchievementCondition }>;
  };
  rarityLabels: Record<string, string>;
};

export type AchievementProgress = {
  label: string;
  current: number;
  target: number;
  unit?: "%" | "道" | "分";
};

export type AchievementEvaluation = {
  unlocked: boolean;
  supported: boolean;
  progress: AchievementProgress[];
};
