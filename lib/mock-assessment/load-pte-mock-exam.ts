import "server-only";

import type { ServerSupabaseClient } from "@/lib/auth/server-auth";
import type { PteMockBlank, PteMockExamData, PteMockQuestion } from "@/lib/mock-assessment/pte-mock-types";

type QueryResult = { data: unknown[] | null; error: { message: string } | null };
type Row = Record<string, unknown>;
type PteQuery = PromiseLike<QueryResult> & {
  eq(column: string, value: unknown): PteQuery;
  not(column: string, operator: string, value: unknown): PteQuery;
  limit(count: number): PteQuery;
};
type PteSchemaClient = {
  from(table: string): { select(columns: string): PteQuery };
};

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

function takeRows(result: QueryResult, count: number) {
  return shuffle((result.data ?? []) as Row[]).slice(0, count);
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function resolveStorageUrl(value: unknown, bucket: "pte-audio" | "pte-images") {
  const url = text(value);
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url) || url.startsWith("/")) return url;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${url}`;
}

function normalizeBlanks(value: unknown): PteMockBlank[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, fallbackIndex) => {
    const row = item && typeof item === "object" ? item as Row : {};
    const rawIndex = row.blank_index ?? row.blankIndex ?? fallbackIndex;
    return {
      index: Number.isFinite(Number(rawIndex)) ? Number(rawIndex) : fallbackIndex,
      answer: text(row.answer),
      options: Array.isArray(row.options) ? row.options.map(text).filter(Boolean) : [],
    };
  }).filter((blank) => blank.answer && blank.options.length > 0);
}

function normalizeSentences(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map(text).filter(Boolean);
}

function speakingQuestion(row: Row, type: PteMockQuestion["type"]): PteMockQuestion {
  const prompt = text(row.question_body_text) || text(row.question_text);
  return {
    id: String(row.id),
    section: "speaking",
    type,
    title: text(row.question_title) || text(row.title) || type,
    prompt,
    audioUrl: resolveStorageUrl(row.audio_url ?? row.question_audio_url, "pte-audio"),
    imageUrl: resolveStorageUrl(row.image_url ?? row.question_image_url, "pte-images"),
    answer: type === "ASQ" ? text(row.answer_text) : undefined,
  };
}

function addWarning(warnings: string[], result: QueryResult, label: string) {
  if (result.error) warnings.push(`${label} 题库暂时不可用`);
}

export async function loadPteMockExam(supabase: ServerSupabaseClient): Promise<PteMockExamData> {
  const pte = supabase.schema("pte") as unknown as PteSchemaClient;
  const [ra, rs, di, rl, asq, sgd, rts, swt, essay, ro, fibrw, fibr, sst, hiw, wfd] = await Promise.all([
    pte.from("ra").select("id,question_title,question_body_text").eq("is_active", true).limit(120),
    pte.from("rs").select("id,question_text,audio_url,question_audio_url").eq("is_active", true).limit(120),
    pte.from("di").select("id,title,question_text,image_url").eq("is_active", true).limit(120),
    pte.from("rl").select("id,title,question_title,question_text,audio_url,image_url").eq("is_active", true).eq("is_available", true).limit(120),
    pte.from("asq").select("id,question_text,answer_text").limit(120),
    pte.from("sgd").select("id,title,question_title,question_text,audio_url").eq("is_active", true).eq("is_available", true).limit(120),
    pte.from("rts").select("id,title,question_title,question_text,audio_url").eq("is_active", true).eq("is_available", true).limit(120),
    pte.from("swt").select("id,question_title,question_text").limit(120),
    pte.from("we").select("id,question_text").limit(120),
    pte.from("ro").select("id,question_title,question_body_text").limit(120),
    pte.from("fibrw").select("id,question_title,question_body_text,blanks_json").limit(120),
    pte.from("fibr").select("id,question_title,question_body_text,blanks_json").limit(120),
    pte.from("sst").select("id,question_text,audio_url,source_audio_url").not("audio_url", "is", null).limit(120),
    pte.from("hiw").select("id,question_text,question_body_text,display_text,audio_url").not("audio_url", "is", null).limit(120),
    pte.from("wfd").select("id,question_text,audio_url").not("audio_url", "is", null).limit(120),
  ]);

  const warnings: string[] = [];
  [[ra, "RA"], [rs, "RS"], [di, "DI"], [rl, "RL"], [asq, "ASQ"], [sgd, "SGD"], [rts, "RTS"], [swt, "SWT"], [essay, "Essay"], [ro, "RO"], [fibrw, "FIBRW"], [fibr, "FIBR"], [sst, "SST"], [hiw, "HIW"], [wfd, "WFD"]].forEach(([result, label]) => addWarning(warnings, result as QueryResult, label as string));

  const speaking = [
    ...takeRows(ra, 3).map((row) => speakingQuestion(row, "RA")),
    ...takeRows(rs, 3).map((row) => speakingQuestion(row, "RS")),
    ...takeRows(di, 3).map((row) => speakingQuestion(row, "DI")),
    ...takeRows(rl, 3).map((row) => speakingQuestion(row, "RL")),
    ...takeRows(asq, 3).map((row) => speakingQuestion(row, "ASQ")),
    ...takeRows(sgd, 3).map((row) => speakingQuestion(row, "SGD")),
    ...takeRows(rts, 3).map((row) => speakingQuestion(row, "RTS")),
  ];

  const writing: PteMockQuestion[] = [
    ...takeRows(swt, 1).map((row) => ({ id: String(row.id), section: "writing" as const, type: "SWT" as const, title: text(row.question_title) || "Summarize Written Text", prompt: text(row.question_text) })),
    ...takeRows(essay, 1).map((row) => ({ id: String(row.id), section: "writing" as const, type: "ESSAY" as const, title: "Write Essay", prompt: text(row.question_text) })),
  ];

  const reading: PteMockQuestion[] = [
    ...takeRows(ro, 2).map((row) => ({ id: String(row.id), section: "reading" as const, type: "RO" as const, title: text(row.question_title) || "Re-order Paragraphs", prompt: "将句子调整为正确顺序。", sentences: normalizeSentences(row.question_body_text) })),
    ...takeRows(fibrw, 2).map((row) => ({ id: String(row.id), section: "reading" as const, type: "FIBRW" as const, title: text(row.question_title) || "Reading & Writing: Fill in the Blanks", prompt: text(row.question_body_text), blanks: normalizeBlanks(row.blanks_json) })),
    ...takeRows(fibr, 2).map((row) => ({ id: String(row.id), section: "reading" as const, type: "FIBR" as const, title: text(row.question_title) || "Reading: Fill in the Blanks", prompt: text(row.question_body_text), blanks: normalizeBlanks(row.blanks_json) })),
  ];

  const listening: PteMockQuestion[] = [
    ...takeRows(sst, 1).map((row) => ({ id: String(row.id), section: "listening" as const, type: "SST" as const, title: "Summarize Spoken Text", prompt: text(row.question_text), audioUrl: resolveStorageUrl(row.audio_url ?? row.source_audio_url, "pte-audio") })),
    ...takeRows(hiw, 3).map((row) => ({ id: String(row.id), section: "listening" as const, type: "HIW" as const, title: "Highlight Incorrect Words", prompt: text(row.question_body_text) || text(row.display_text) || text(row.question_text), audioUrl: resolveStorageUrl(row.audio_url, "pte-audio") })),
    ...takeRows(wfd, 3).map((row) => ({ id: String(row.id), section: "listening" as const, type: "WFD" as const, title: "Write From Dictation", prompt: text(row.question_text), audioUrl: resolveStorageUrl(row.audio_url, "pte-audio") })),
  ];

  return { speaking, writing, reading, listening, warnings };
}
