import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { AI_PROMPT_DEFINITIONS, getDefaultAiPromptDefinition } from "@/lib/ai-prompts/defaults";
import { renderPromptTemplate } from "@/lib/ai-prompts/render";
import type { AiPromptDefinition, AiPromptRecord } from "@/lib/ai-prompts/types";

type AiPromptRow = {
  id: string;
  title: string;
  category: string;
  scope: "system" | "user" | "input";
  description: string | null;
  used_by: string[] | null;
  variables: { name: string; description: string }[] | null;
  content: string;
  default_content: string | null;
  is_active: boolean | null;
  is_custom: boolean | null;
  updated_at: string | null;
  updated_by: string | null;
};

function rowToRecord(row: AiPromptRow, fallback?: AiPromptDefinition | null): AiPromptRecord {
  const defaultContent = row.default_content ?? fallback?.defaultContent ?? row.content;
  return {
    id: row.id,
    title: row.title || fallback?.title || row.id,
    category: row.category || fallback?.category || "Custom",
    scope: row.scope || fallback?.scope || "user",
    description: row.description ?? fallback?.description ?? "",
    usedBy: row.used_by ?? fallback?.usedBy ?? [],
    variables: row.variables ?? fallback?.variables ?? [],
    defaultContent,
    content: row.content,
    source: "database",
    isActive: row.is_active ?? true,
    isCustom: row.is_custom ?? !fallback,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

function defaultToRecord(prompt: AiPromptDefinition): AiPromptRecord {
  return {
    ...prompt,
    content: prompt.defaultContent,
    source: "default",
    isActive: true,
    isCustom: false,
    updatedAt: null,
    updatedBy: null,
  };
}

function isMissingPromptTableError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String((error as { code?: unknown }).code) : "";
  const message = "message" in error ? String((error as { message?: unknown }).message) : "";
  return code === "42P01" || message.includes("ai_prompts") || message.includes("relation") && message.includes("does not exist");
}

export async function getAiPromptContent(id: string) {
  const fallback = getDefaultAiPromptDefinition(id);
  if (!fallback) throw new Error(`Unknown AI prompt id: ${id}`);

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("ai_prompts").select("content,is_active").eq("id", id).maybeSingle();
    if (error) {
      if (isMissingPromptTableError(error)) return fallback.defaultContent;
      throw error;
    }
    if (!data || data.is_active === false || typeof data.content !== "string" || !data.content.trim()) return fallback.defaultContent;
    return data.content;
  } catch (error) {
    if (isMissingPromptTableError(error)) return fallback.defaultContent;
    console.error(`AI prompt ${id} load failed, using default prompt:`, error);
    return fallback.defaultContent;
  }
}

export async function renderAiPrompt(id: string, values: Record<string, unknown>) {
  return renderPromptTemplate(await getAiPromptContent(id), values as Record<string, string | number | boolean | null | undefined | Record<string, unknown> | unknown[]>);
}

export async function listAiPromptsForAdmin() {
  const defaults = new Map(AI_PROMPT_DEFINITIONS.map((prompt) => [prompt.id, prompt]));

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("ai_prompts").select("id,title,category,scope,description,used_by,variables,content,default_content,is_active,is_custom,updated_at,updated_by").order("category", { ascending: true }).order("title", { ascending: true });
    if (error) {
      if (isMissingPromptTableError(error)) return { prompts: AI_PROMPT_DEFINITIONS.map(defaultToRecord), tableReady: false };
      throw error;
    }

    const records = new Map<string, AiPromptRecord>();
    for (const row of (data ?? []) as AiPromptRow[]) {
      records.set(row.id, rowToRecord(row, defaults.get(row.id)));
    }
    for (const prompt of AI_PROMPT_DEFINITIONS) {
      if (!records.has(prompt.id)) records.set(prompt.id, defaultToRecord(prompt));
    }

    return { prompts: [...records.values()].sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title)), tableReady: true };
  } catch (error) {
    if (isMissingPromptTableError(error)) return { prompts: AI_PROMPT_DEFINITIONS.map(defaultToRecord), tableReady: false };
    throw error;
  }
}

export async function upsertAiPromptForAdmin({
  id,
  title,
  category,
  scope,
  description,
  usedBy,
  variables,
  content,
  updatedBy,
}: {
  id: string;
  title?: string;
  category?: string;
  scope?: "system" | "user" | "input";
  description?: string;
  usedBy?: string[];
  variables?: { name: string; description: string }[];
  content: string;
  updatedBy: string;
}) {
  const fallback = getDefaultAiPromptDefinition(id);
  const supabase = createAdminClient();
  const payload = {
    id,
    title: title || fallback?.title || id,
    category: category || fallback?.category || "Custom",
    scope: scope || fallback?.scope || "user",
    description: description ?? fallback?.description ?? "",
    used_by: usedBy ?? fallback?.usedBy ?? [],
    variables: variables ?? fallback?.variables ?? [],
    content,
    default_content: fallback?.defaultContent ?? content,
    is_active: true,
    is_custom: !fallback,
    updated_by: updatedBy,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("ai_prompts").upsert(payload, { onConflict: "id" }).select("id,title,category,scope,description,used_by,variables,content,default_content,is_active,is_custom,updated_at,updated_by").single();
  if (error) throw error;
  return rowToRecord(data as AiPromptRow, fallback);
}

export async function seedDefaultAiPrompts(updatedBy: string) {
  const supabase = createAdminClient();
  const rows = AI_PROMPT_DEFINITIONS.map((prompt) => ({
    id: prompt.id,
    title: prompt.title,
    category: prompt.category,
    scope: prompt.scope,
    description: prompt.description,
    used_by: prompt.usedBy,
    variables: prompt.variables,
    content: prompt.defaultContent,
    default_content: prompt.defaultContent,
    is_active: true,
    is_custom: false,
    updated_by: updatedBy,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("ai_prompts").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}
