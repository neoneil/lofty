import "server-only";

import { getAchievementStatsForUser } from "@/lib/achievements/stats";
import type { QuestionTypeStat } from "@/lib/achievements/types";
import type { ServerSupabaseClient } from "@/lib/auth/server-auth";

const MODULES = [
  { id: "listening", label: "听力" },
  { id: "speaking", label: "口语" },
  { id: "reading", label: "阅读" },
  { id: "writing", label: "写作" },
] as const;

export const QUESTION_TYPE_LABELS: Record<string, string> = {
  asq: "ASQ",
  di: "DI",
  essay: "Essay",
  fibrw: "FIBRW",
  fib_l: "FIB-L",
  hiw: "HIW",
  ra: "RA",
  rfib: "RFIB",
  rl: "RL",
  ro: "RO",
  rs: "RS",
  rts: "RTS",
  sgd: "SGD",
  sst: "SST",
  swt: "SWT",
  wfd: "WFD",
};

const PREDICTION_QUESTION_TYPES = [
  { table: "ra", statType: "ra", label: "RA" },
  { table: "rs", statType: "rs", label: "RS" },
  { table: "di", statType: "di", label: "DI" },
  { table: "rl", statType: "rl", label: "RL" },
  { table: "asq", statType: "asq", label: "ASQ" },
  { table: "rts", statType: "rts", label: "RTS" },
  { table: "sgd", statType: "sgd", label: "SGD" },
  { table: "swt", statType: "swt", label: "SWT" },
  { table: "we", statType: "essay", label: "Essay" },
  { table: "ro", statType: "ro", label: "RO" },
  { table: "fibr", statType: "rfib", label: "RFIB" },
  { table: "fibrw", statType: "fibrw", label: "FIBRW" },
  { table: "sst", statType: "sst", label: "SST" },
  { table: "hiw", statType: "hiw", label: "HIW" },
  { table: "wfd", statType: "wfd", label: "WFD" },
] as const;

type RawQuestionStatRow = {
  question_source: string | null;
  question_id: string | number | null;
  completed_count: number | null;
  is_practiced: boolean | null;
};

type AttemptTimeRow = {
  submitted_at: string | null;
  duration_seconds: number | null;
};

export function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function getQuestionTypeLabel(questionType: string) {
  return QUESTION_TYPE_LABELS[questionType] ?? questionType.toUpperCase();
}

function normalizeQuestionType(value: string | null | undefined) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "we") return "essay";
  if (normalized === "fibr") return "rfib";
  if (normalized === "fibl" || normalized === "fib-l") return "fib_l";
  return normalized;
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

function getSydneyDayKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Sydney", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function getDayLabel(dayKey: string) {
  const date = new Date(`${dayKey}T00:00:00+10:00`);
  return new Intl.DateTimeFormat("zh-CN", { timeZone: "Australia/Sydney", month: "2-digit", day: "2-digit" }).format(date);
}

function getRecentSevenDayKeys() {
  const today = new Date();
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    return getSydneyDayKey(date);
  });
}

async function getPredictionQuestionSets(supabase: ServerSupabaseClient) {
  const entries = await Promise.all(
    PREDICTION_QUESTION_TYPES.map(async (item) => {
      const { data, error } = await supabase.schema("pte").from(item.table).select("id").eq("is_prediction", true).limit(5000);
      if (error) {
        console.error(`Prediction count query failed for ${item.table}:`, error.message);
        return [item.statType, { ...item, ids: new Set<string>() }] as const;
      }

      return [item.statType, { ...item, ids: new Set((data ?? []).map((row) => String(row.id))) }] as const;
    }),
  );

  return new Map<string, (typeof entries)[number][1]>(entries);
}

async function getQuestionTypeCompletionData(supabase: ServerSupabaseClient, userId: string) {
  const [predictionSets, { data: rawStats, error }] = await Promise.all([
    getPredictionQuestionSets(supabase),
    supabase
      .from("student_question_stats")
      .select("question_source, question_id, completed_count, is_practiced")
      .eq("user_id", userId)
      .returns<RawQuestionStatRow[]>(),
  ]);

  if (error) throw new Error(`读取题型完成度失败：${error.message}`);

  const practicedByType = new Map<string, Set<string>>();

  for (const row of rawStats ?? []) {
    if (!row.question_id || (!row.is_practiced && (row.completed_count ?? 0) <= 0)) continue;
    const type = normalizeQuestionType(row.question_source);
    const prediction = predictionSets.get(type);
    if (!prediction?.ids.has(String(row.question_id))) continue;
    const current = practicedByType.get(type) ?? new Set<string>();
    current.add(String(row.question_id));
    practicedByType.set(type, current);
  }

  return PREDICTION_QUESTION_TYPES.map((item) => {
    const total = predictionSets.get(item.statType)?.ids.size ?? 0;
    const completed = practicedByType.get(item.statType)?.size ?? 0;

    return {
      type: item.label,
      completed,
      total,
      completion: total > 0 ? round((completed / total) * 100) : 0,
    };
  }).filter((item) => item.total > 0 || item.completed > 0);
}

async function getRecentStudyTimeData(supabase: ServerSupabaseClient, userId: string) {
  const dayKeys = getRecentSevenDayKeys();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("student_attempts")
    .select("submitted_at, duration_seconds")
    .eq("user_id", userId)
    .in("status", ["completed", "submitted"])
    .gte("submitted_at", start.toISOString())
    .not("submitted_at", "is", null)
    .returns<AttemptTimeRow[]>();

  if (error) throw new Error(`读取最近学习时间失败：${error.message}`);

  const minutesByDay = new Map(dayKeys.map((day) => [day, 0]));

  for (const row of data ?? []) {
    if (!row.submitted_at) continue;
    const dayKey = getSydneyDayKey(new Date(row.submitted_at));
    if (!minutesByDay.has(dayKey)) continue;
    minutesByDay.set(dayKey, (minutesByDay.get(dayKey) ?? 0) + (row.duration_seconds ?? 0) / 60);
  }

  return dayKeys.map((day) => ({
    day: getDayLabel(day),
    minutes: round(minutesByDay.get(day) ?? 0),
  }));
}

export async function getPteAnalyticsForUser(supabase: ServerSupabaseClient, userId: string) {
  const [{ overview, questionTypeStats }, questionTypeCompletionData, recentStudyTimeData] = await Promise.all([
    getAchievementStatsForUser(supabase, userId),
    getQuestionTypeCompletionData(supabase, userId),
    getRecentStudyTimeData(supabase, userId),
  ]);
  const moduleData = aggregateModules(questionTypeStats);
  const practicedQuestionTypes = questionTypeStats.filter((stat) => stat.completed > 0);
  const questionAccuracyData = practicedQuestionTypes
    .map((stat) => ({ type: getQuestionTypeLabel(stat.question_type), accuracy: round(stat.accuracy), completed: stat.completed }))
    .sort((a, b) => b.completed - a.completed);
  const weakestQuestionType = [...practicedQuestionTypes].sort((a, b) => a.accuracy - b.accuracy)[0] ?? null;

  return {
    overview,
    moduleData,
    questionTypeCompletionData,
    recentStudyTimeData,
    questionAccuracyData,
    weakestQuestionType: weakestQuestionType
      ? {
          question_type: weakestQuestionType.question_type,
          label: getQuestionTypeLabel(weakestQuestionType.question_type),
          accuracy: round(weakestQuestionType.accuracy),
        }
      : null,
    hasQuestionCompletionData: questionTypeCompletionData.some((item) => item.total > 0),
    hasRecentStudyTime: recentStudyTimeData.some((item) => item.minutes > 0),
    hasStudyTime: moduleData.some((item) => item.studyMinutes > 0),
  };
}
