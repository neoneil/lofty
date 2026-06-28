import "server-only";

import { createClient } from "@/lib/supabase/server";

export type CoursePredictionQuestion = {
  id: string;
  title: string;
  preview: string;
  href: string;
  difficulty: string | null;
  sourceId: string | null;
};

type QuestionRow = Record<string, unknown> & { id: string | number };

type QuestionSourceConfig = {
  table: string;
  module: string;
  routeType: string;
  select: string;
  titleFields: string[];
  previewFields: string[];
};

const QUESTION_SOURCES: Record<string, QuestionSourceConfig> = {
  ra: { table: "ra", module: "speaking", routeType: "ra", select: "id, question_title, question_body_text, source_question_id, difficulty_level, created_at", titleFields: ["question_title", "question_body_text"], previewFields: ["question_body_text"] },
  rs: { table: "rs", module: "speaking", routeType: "rs", select: "id, question_text, source_question_id, difficulty_level, created_at", titleFields: ["question_text"], previewFields: ["question_text"] },
  di: { table: "di", module: "speaking", routeType: "di", select: "id, title, question_text, difficulty_level, created_at", titleFields: ["title", "question_text"], previewFields: ["question_text"] },
  rl: { table: "rl", module: "speaking", routeType: "rl", select: "id, title, question_title, question_text, source_question_id, difficulty_level, created_at", titleFields: ["title", "question_title", "question_text"], previewFields: ["question_text"] },
  asq: { table: "asq", module: "speaking", routeType: "asq", select: "id, question_text, created_at", titleFields: ["question_text"], previewFields: ["question_text"] },
  rts: { table: "rts", module: "speaking", routeType: "rts", select: "id, title, question_title, question_text, source_question_id, difficulty_level, created_at", titleFields: ["title", "question_title", "question_text"], previewFields: ["question_text"] },
  sgd: { table: "sgd", module: "speaking", routeType: "sgd", select: "id, title, question_title, question_text, source_question_id, difficulty_level, created_at", titleFields: ["title", "question_title", "question_text"], previewFields: ["question_text"] },
  swt: { table: "swt", module: "writing", routeType: "swt", select: "id, question_title, question_text, source_question_id, difficulty_level, created_at", titleFields: ["question_title", "question_text"], previewFields: ["question_text"] },
  essay: { table: "we", module: "writing", routeType: "essay", select: "id, question_text, response_type, created_at", titleFields: ["question_text"], previewFields: ["question_text"] },
  rfib: { table: "fibr", module: "reading", routeType: "fibr", select: "id, question_title, question_body_text, difficulty_level, created_at", titleFields: ["question_title", "question_body_text"], previewFields: ["question_body_text"] },
  fibrw: { table: "fibrw", module: "reading", routeType: "fibrw", select: "id, question_title, question_body_text, difficulty_level, created_at", titleFields: ["question_title", "question_body_text"], previewFields: ["question_body_text"] },
  ro: { table: "ro", module: "reading", routeType: "ro", select: "id, question_title, source_question_id, difficulty_level, created_at", titleFields: ["question_title"], previewFields: ["question_title"] },
  sst: { table: "sst", module: "listening", routeType: "sst", select: "id, question_text, source_question_id, difficulty_level, created_at", titleFields: ["question_text"], previewFields: ["question_text"] },
  hiw: { table: "hiw", module: "listening", routeType: "hiw", select: "id, question_text, source_question_id, difficulty_level, created_at", titleFields: ["question_text"], previewFields: ["question_text"] },
  wfd: { table: "wfd", module: "listening", routeType: "wfd", select: "id, question_text, source_question_id, difficulty_level, created_at", titleFields: ["question_text"], previewFields: ["question_text"] },
};

const QUESTION_TYPE_ALIASES: Record<string, string> = {
  we: "essay",
  essay: "essay",
  fibr: "rfib",
  rfib: "rfib",
  "fib-r": "rfib",
  "fib_r": "rfib",
  "fib-rw": "fibrw",
  "fib_rw": "fibrw",
};

function normalize(value: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

function getText(row: QuestionRow, fields: string[]) {
  for (const field of fields) {
    const value = row[field];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function compactText(value: string, maxLength: number) {
  const compact = value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return compact.length > maxLength ? `${compact.slice(0, maxLength).trim()}...` : compact;
}

export async function getCoursePredictionQuestions(module: string | null, questionType: string | null): Promise<CoursePredictionQuestion[]> {
  const normalizedModule = normalize(module);
  const rawQuestionType = normalize(questionType);
  const normalizedQuestionType = QUESTION_TYPE_ALIASES[rawQuestionType] ?? rawQuestionType;
  const config = QUESTION_SOURCES[normalizedQuestionType];

  if (!config || config.module !== normalizedModule) return [];

  const supabase = await createClient();
  const rows: QuestionRow[] = [];
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase.schema("pte").from(config.table).select(config.select).eq("is_prediction", true).order("created_at", { ascending: false }).range(from, from + pageSize - 1);

    if (error) {
      console.error(`[course-predictions] Failed to read pte.${config.table}:`, error.message);
      return [];
    }

    const page = (data ?? []) as unknown as QuestionRow[];
    rows.push(...page);
    if (page.length < pageSize) break;
  }

  return rows.map((row, index) => {
    const title = compactText(getText(row, config.titleFields), 100) || `预测题 ${index + 1}`;
    const preview = compactText(getText(row, config.previewFields), 180);
    const difficulty = row.difficulty_level == null ? null : String(row.difficulty_level);
    const sourceId = typeof row.source_question_id === "string" && row.source_question_id.trim() ? row.source_question_id.trim() : null;

    return {
      id: String(row.id),
      title,
      preview,
      href: `/pte/${config.module}/${config.routeType}/${row.id}`,
      difficulty,
      sourceId,
    };
  });
}
