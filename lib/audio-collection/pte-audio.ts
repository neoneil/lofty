import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { normalizePublicStorageUrl } from "@/lib/storage/public-url";

export const PTE_AUDIO_PAGE_SIZE = 20;

export type PteAudioBaseType = "sst" | "rl" | "wfd" | "rs";
export type PteAudioGroupId = PteAudioBaseType | `${PteAudioBaseType}-prediction`;

type AudioRow = {
  id: string | number;
  question_text?: string | null;
  title?: string | null;
  question_title?: string | null;
  original_text?: string | null;
  is_prediction?: boolean | null;
  audio_url?: string | null;
  source_audio_url?: string | null;
  storage_path?: string | null;
  audio_duration_seconds?: number | null;
};

type PteAudioConfig = {
  type: PteAudioBaseType;
  label: string;
  title: string;
  href: string;
  select: string;
  audioFilter: string;
};

const CONFIGS: Record<PteAudioBaseType, PteAudioConfig> = {
  sst: {
    type: "sst",
    label: "SST",
    title: "Summarize Spoken Text",
    href: "/pte/listening/sst",
    select: "id,question_text,is_prediction,audio_url,source_audio_url,storage_path,created_at",
    audioFilter: "audio_url.not.is.null,source_audio_url.not.is.null,storage_path.not.is.null",
  },
  rl: {
    type: "rl",
    label: "RL",
    title: "Retell Lecture",
    href: "/pte/speaking/rl",
    select: "id,title,question_title,question_text,original_text,is_prediction,audio_url,source_audio_url,storage_path,created_at",
    audioFilter: "audio_url.not.is.null,source_audio_url.not.is.null,storage_path.not.is.null",
  },
  wfd: {
    type: "wfd",
    label: "WFD",
    title: "Write From Dictation",
    href: "/pte/listening/wfd",
    select: "id,question_text,is_prediction,audio_url,audio_duration_seconds,created_at",
    audioFilter: "audio_url.not.is.null",
  },
  rs: {
    type: "rs",
    label: "RS",
    title: "Repeat Sentence",
    href: "/pte/speaking/rs",
    select: "id,question_text,is_prediction,audio_url,audio_duration_seconds,created_at",
    audioFilter: "audio_url.not.is.null",
  },
};

const PTE_AUDIO_CONFIGS = Object.values(CONFIGS) as PteAudioConfig[];

export const PTE_AUDIO_GROUPS = [
  ...PTE_AUDIO_CONFIGS.map((config) => ({
    id: config.type as PteAudioGroupId,
    collection: "pte" as const,
    label: config.label,
    title: config.title,
    href: config.href,
  })),
  ...PTE_AUDIO_CONFIGS.map((config) => ({
    id: `${config.type}-prediction` as PteAudioGroupId,
    collection: "pte" as const,
    label: `${config.label} 预测`,
    title: `${config.title} Prediction`,
    href: config.href,
  })),
];

export function isPteAudioGroupId(value: string): value is PteAudioGroupId {
  const baseType = value.replace(/-prediction$/, "") as PteAudioBaseType;
  return baseType in CONFIGS && (value === baseType || value === `${baseType}-prediction`);
}

function getPublicAudioUrl(path: string) {
  return normalizePublicStorageUrl(path.replace(/^\/+/, ""), "pte-audio");
}

function getAudioUrls(row: AudioRow) {
  const seen = new Set<string>();
  return [row.storage_path, row.audio_url, row.source_audio_url].flatMap((path) => {
    if (!path?.trim()) return [];
    const url = getPublicAudioUrl(path);
    if (!url || seen.has(url)) return [];
    seen.add(url);
    return [url];
  });
}

function getDisplayText(row: AudioRow) {
  return row.question_text || row.question_title || row.title || row.original_text || "Audio question";
}

function getWordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export async function loadPteAudioPage({
  supabase,
  groupId,
  offset,
  limit = PTE_AUDIO_PAGE_SIZE,
}: {
  supabase: SupabaseClient;
  groupId: PteAudioGroupId;
  offset: number;
  limit?: number;
}) {
  const predictionOnly = groupId.endsWith("-prediction");
  const baseType = groupId.replace(/-prediction$/, "") as PteAudioBaseType;
  const config = CONFIGS[baseType];
  const safeOffset = Math.max(0, Math.floor(offset));
  const safeLimit = Math.max(1, Math.min(Math.floor(limit), PTE_AUDIO_PAGE_SIZE));

  let query = supabase
    .schema("pte")
    .from(config.type)
    .select(config.select, safeOffset === 0 ? { count: "exact" } : undefined)
    .or(config.audioFilter)
    .order("created_at", { ascending: false })
    .range(safeOffset, safeOffset + safeLimit - 1);

  if (predictionOnly) query = query.eq("is_prediction", true);

  const { data, error, count } = await query;
  if (error) throw error;

  const rows = (data ?? []) as unknown as AudioRow[];
  const items = rows.flatMap((row) => {
    const audioUrls = getAudioUrls(row);
    if (audioUrls.length === 0) return [];
    const text = getDisplayText(row);

    return [{
      id: String(row.id),
      type: groupId,
      collection: "pte" as const,
      label: predictionOnly ? `${config.label} 预测` : config.label,
      text,
      sourceQuestionId: null,
      isPrediction: row.is_prediction ?? false,
      audioUrl: audioUrls[0],
      audioUrls,
      durationSeconds: row.audio_duration_seconds ?? null,
      wordCount: getWordCount(text),
    }];
  });

  const nextOffset = safeOffset + rows.length;
  return {
    items,
    totalCount: count,
    nextOffset,
    hasMore: count === null ? rows.length === safeLimit : nextOffset < count,
  };
}
