import { createClient } from "@/lib/supabase/server";
import { getAllAchievementConfigs } from "@/lib/achievements/configs";
import type { AchievementOverview, QuestionTypeStat } from "@/lib/achievements/types";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

type StudentQuestionStatRow = {
  module_type: string;
  question_source: string;
  completed_count: number | null;
  correct_count: number | null;
  wrong_count: number | null;
  total_duration_seconds: number | null;
  best_score: number | string | null;
  latest_score: number | string | null;
  is_practiced: boolean | null;
};

type StudentAttemptRow = {
  submitted_at: string;
  is_correct: boolean | null;
};

type AchievementStatsOptions = {
  examType?: string;
};

const PAGE_SIZE = 1000;
const ACHIEVEMENT_TIME_ZONE = "Australia/Sydney";
const DAY_IN_MS = 86_400_000;
const QUESTION_TYPE_ALIASES: Record<string, string> = {
  we: "essay",
  fibr: "rfib",
  fibl: "fib_l",
  "fib-l": "fib_l",
  fib_rw: "fibrw",
};
const QUESTION_TYPE_MODULES = new Map(
  getAllAchievementConfigs().flatMap((config) =>
    config.categories.flatMap((category) =>
      (category.questionTypes ?? []).map((questionType) => [questionType.id, category.id] as const),
    ),
  ),
);

function toNumber(value: number | string | null | undefined) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function normalizeQuestionType(value: string) {
  const normalized = value.trim().toLowerCase();
  return QUESTION_TYPE_ALIASES[normalized] ?? normalized;
}

function resolveModuleType(moduleType: string, questionType: string) {
  const normalizedModule = moduleType.trim().toLowerCase();
  if (["speaking", "writing", "reading", "listening"].includes(normalizedModule)) return normalizedModule;

  const canonicalModuleQuestionType = normalizeQuestionType(normalizedModule);
  return QUESTION_TYPE_MODULES.get(questionType) ?? QUESTION_TYPE_MODULES.get(canonicalModuleQuestionType) ?? normalizedModule;
}

async function readAllQuestionStats(supabase: ServerSupabaseClient, userId: string, examType?: string) {
  const rows: StudentQuestionStatRow[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    let query = supabase
      .from("student_question_stats")
      .select("module_type, question_source, completed_count, correct_count, wrong_count, total_duration_seconds, best_score, latest_score, is_practiced")
      .eq("user_id", userId)
      .order("id", { ascending: true });

    if (examType) query = query.eq("exam_type", examType);

    const { data, error } = await query.range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(`读取学习统计失败：${error.message}`);

    const page = (data ?? []) as StudentQuestionStatRow[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }

  return rows;
}

async function readAllCompletedAttempts(supabase: ServerSupabaseClient, userId: string, examType?: string) {
  const rows: StudentAttemptRow[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    let query = supabase
      .from("student_attempts")
      .select("submitted_at, is_correct")
      .eq("user_id", userId)
      .eq("status", "completed")
      .not("submitted_at", "is", null)
      .order("submitted_at", { ascending: true })
      .order("id", { ascending: true });

    if (examType) query = query.eq("exam_type", examType);

    const { data, error } = await query.range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(`读取练习记录失败：${error.message}`);

    const page = (data ?? []) as StudentAttemptRow[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }

  return rows;
}

async function readHighestAiScore(supabase: ServerSupabaseClient, userId: string, examType?: string) {
  let query = supabase
    .from("student_attempts")
    .select("score")
    .eq("user_id", userId)
    .eq("status", "completed")
    .not("ai_feedback", "is", null)
    .not("score", "is", null)
    .order("score", { ascending: false })
    .limit(1);

  if (examType) query = query.eq("exam_type", examType);

  const { data, error } = await query.maybeSingle();

  if (error) throw new Error(`读取 AI 评分失败：${error.message}`);
  return round(toNumber(data?.score));
}

function createZonedDateFormatter(timeZone: string) {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  });
}

function getZonedDateParts(timestamp: string, formatter: Intl.DateTimeFormat) {
  const parts = formatter.formatToParts(new Date(timestamp));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    dateKey: `${values.year}-${values.month}-${values.day}`,
    hour: Number(values.hour),
  };
}

function dateKeyToDayNumber(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / DAY_IN_MS);
}

export function aggregateAttemptAchievementStats(rows: StudentAttemptRow[], timeZone = ACHIEVEMENT_TIME_ZONE) {
  const practiceDates = new Set<string>();
  const dateFormatter = createZonedDateFormatter(timeZone);
  let maxCorrectStreak = 0;
  let currentCorrectStreak = 0;
  let midnightPracticeCount = 0;

  const orderedRows = [...rows].sort((a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime());

  for (const row of orderedRows) {
    const { dateKey, hour } = getZonedDateParts(row.submitted_at, dateFormatter);
    practiceDates.add(dateKey);
    if (hour >= 0 && hour < 4) midnightPracticeCount += 1;

    if (row.is_correct === true) {
      currentCorrectStreak += 1;
      maxCorrectStreak = Math.max(maxCorrectStreak, currentCorrectStreak);
    } else if (row.is_correct === false) {
      currentCorrectStreak = 0;
    }

  }

  const orderedDays = Array.from(practiceDates).map(dateKeyToDayNumber).sort((a, b) => a - b);
  let longestStudyStreakDays = orderedDays.length > 0 ? 1 : 0;
  let currentStudyStreakDays = longestStudyStreakDays;

  for (let index = 1; index < orderedDays.length; index += 1) {
    currentStudyStreakDays = orderedDays[index] === orderedDays[index - 1] + 1 ? currentStudyStreakDays + 1 : 1;
    longestStudyStreakDays = Math.max(longestStudyStreakDays, currentStudyStreakDays);
  }

  return {
    longest_study_streak_days: longestStudyStreakDays,
    max_correct_streak: maxCorrectStreak,
    midnight_practice_count: midnightPracticeCount,
  };
}

export function aggregateAchievementStats(rows: StudentQuestionStatRow[]) {
  let totalCompleted = 0;
  let totalCorrect = 0;
  let totalWrong = 0;
  let totalDurationSeconds = 0;
  let highestScore = 0;
  let latestScoreSum = 0;
  let latestScoreCount = 0;
  let practicedQuestionCount = 0;

  const grouped = new Map<string, QuestionTypeStat & { latest_score_sum: number; latest_score_count: number }>();

  for (const row of rows) {
    const completed = toNumber(row.completed_count);
    const correct = toNumber(row.correct_count);
    const wrong = toNumber(row.wrong_count);
    const duration = toNumber(row.total_duration_seconds);
    const bestScore = toNumber(row.best_score);
    const hasLatestScore = row.latest_score !== null && row.latest_score !== undefined;
    const latestScore = toNumber(row.latest_score);
    const questionType = normalizeQuestionType(row.question_source);
    const moduleType = resolveModuleType(row.module_type, questionType);
    const key = `${moduleType}:${questionType}`;

    totalCompleted += completed;
    totalCorrect += correct;
    totalWrong += wrong;
    totalDurationSeconds += duration;
    highestScore = Math.max(highestScore, bestScore);
    practicedQuestionCount += row.is_practiced ? 1 : 0;

    if (hasLatestScore) {
      latestScoreSum += latestScore;
      latestScoreCount += 1;
    }

    const current = grouped.get(key) ?? {
      question_type: questionType,
      module_type: moduleType,
      completed: 0,
      correct: 0,
      wrong: 0,
      accuracy: 0,
      best_score: 0,
      average_score: 0,
      total_study_minutes: 0,
      latest_score_sum: 0,
      latest_score_count: 0,
    };

    current.completed += completed;
    current.correct += correct;
    current.wrong += wrong;
    current.total_study_minutes += duration / 60;
    current.best_score = Math.max(current.best_score, bestScore);

    if (hasLatestScore) {
      current.latest_score_sum += latestScore;
      current.latest_score_count += 1;
    }

    grouped.set(key, current);
  }

  const overview: AchievementOverview = {
    total_completed: totalCompleted,
    total_correct: totalCorrect,
    total_wrong: totalWrong,
    overall_accuracy: totalCompleted > 0 ? round((totalCorrect / totalCompleted) * 100) : 0,
    total_study_minutes: round(totalDurationSeconds / 60),
    highest_score: round(highestScore),
    highest_ai_score: 0,
    average_score: latestScoreCount > 0 ? round(latestScoreSum / latestScoreCount) : 0,
    practiced_question_count: practicedQuestionCount,
    longest_study_streak_days: 0,
    max_correct_streak: 0,
    midnight_practice_count: 0,
  };

  const questionTypeStats = Array.from(grouped.values())
    .map(({ latest_score_sum, latest_score_count, ...stat }) => ({
      ...stat,
      accuracy: stat.completed > 0 ? round((stat.correct / stat.completed) * 100) : 0,
      average_score: latest_score_count > 0 ? round(latest_score_sum / latest_score_count) : 0,
      total_study_minutes: round(stat.total_study_minutes),
    }))
    .sort((a, b) => a.module_type.localeCompare(b.module_type) || a.question_type.localeCompare(b.question_type));

  return { overview, questionTypeStats };
}

export async function getAchievementStatsForUser(supabase: ServerSupabaseClient, userId: string, options: AchievementStatsOptions = {}) {
  const [questionStatsRows, attemptRows, highestAiScore] = await Promise.all([
    readAllQuestionStats(supabase, userId, options.examType),
    readAllCompletedAttempts(supabase, userId, options.examType),
    readHighestAiScore(supabase, userId, options.examType),
  ]);
  const { overview, questionTypeStats } = aggregateAchievementStats(questionStatsRows);
  const attemptStats = aggregateAttemptAchievementStats(attemptRows);

  return {
    overview: { ...overview, ...attemptStats, highest_ai_score: highestAiScore },
    questionTypeStats,
  };
}
