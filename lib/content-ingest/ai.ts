import "server-only";

import OpenAI from "openai";

import { renderAiPrompt } from "@/lib/ai-prompts/server";
import type { GeneratedVocabularyItem } from "@/lib/content-ingest/types";

const AI_MODEL = "gpt-4o-mini";
const MAX_PROMPT_TEXT_LENGTH = 55_000;
const MAX_AI_FILE_BYTES = 25 * 1024 * 1024;

const STOPWORDS = new Set([
  "about", "above", "after", "again", "against", "also", "among", "because", "before", "being", "between", "both", "could", "during", "each", "from", "have", "into", "more", "most", "other", "over", "same", "some", "such", "than", "that", "their", "there", "these", "they", "this", "through", "under", "very", "were", "what", "when", "where", "which", "while", "with", "would", "your",
]);

type AiVocabularyResponse = {
  summary?: unknown;
  vocabulary?: unknown;
};

function safeJsonParse(value: string): AiVocabularyResponse {
  const trimmed = value.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  const jsonText = firstBrace >= 0 && lastBrace > firstBrace ? trimmed.slice(firstBrace, lastBrace + 1) : trimmed;
  return JSON.parse(jsonText) as AiVocabularyResponse;
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.map(asString).filter(Boolean).slice(0, 6) : [];
}

function normalizeDifficulty(value: string): GeneratedVocabularyItem["difficulty"] {
  if (value === "basic" || value === "intermediate" || value === "advanced") return value;
  return "intermediate";
}

function normalizeAiVocabulary(value: unknown): GeneratedVocabularyItem[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const items: GeneratedVocabularyItem[] = [];

  for (const row of value) {
    if (!row || typeof row !== "object") continue;
    const record = row as Record<string, unknown>;
    const term = asString(record.term);
    const key = term.toLowerCase();
    if (!term || seen.has(key)) continue;
    seen.add(key);
    items.push({
      term,
      partOfSpeech: asString(record.partOfSpeech) || "other",
      chineseMeaning: asString(record.chineseMeaning),
      englishDefinition: asString(record.englishDefinition),
      example: asString(record.example),
      collocations: asStringArray(record.collocations),
      difficulty: normalizeDifficulty(asString(record.difficulty)),
      examUse: asStringArray(record.examUse),
      sourceContext: asString(record.sourceContext),
      frequency: Math.max(1, Number(record.frequency) || 1),
    });
  }

  return items;
}

export function extractFallbackVocabulary(rawText: string, maxItems = 60): GeneratedVocabularyItem[] {
  const counts = new Map<string, number>();
  const words = rawText.toLowerCase().match(/\b[a-z][a-z'-]{3,}\b/g) ?? [];

  for (const word of words) {
    const cleaned = word.replace(/^'+|'+$/g, "");
    if (cleaned.length < 4 || STOPWORDS.has(cleaned) || /^\d+$/.test(cleaned)) continue;
    counts.set(cleaned, (counts.get(cleaned) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, maxItems)
    .map(([term, frequency]) => ({
      term,
      partOfSpeech: "other",
      chineseMeaning: "",
      englishDefinition: "Pending AI definition.",
      example: "",
      collocations: [],
      difficulty: frequency >= 5 ? "intermediate" : "basic",
      examUse: ["IELTS Reading", "PTE"],
      sourceContext: "",
      frequency,
    }));
}

export async function generateVocabularyWithAi({
  title,
  category,
  sourceFileNames,
  rawText,
  maxItems,
}: {
  title: string;
  category: string;
  sourceFileNames: string[];
  rawText: string;
  maxItems: number;
}) {
  if (!process.env.OPENAI_API_KEY) {
    return {
      summary: "未配置 OpenAI API Key，已使用本地候选词提取。",
      vocabulary: extractFallbackVocabulary(rawText, maxItems),
      warning: "OpenAI API Key missing.",
    };
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 120000 });
  const prompt = await renderAiPrompt("content.vocabulary.extract.user", {
    title,
    category,
    sourceFileNames: sourceFileNames.join(", "),
    rawText: rawText.slice(0, MAX_PROMPT_TEXT_LENGTH),
    maxItems,
  });

  const completion = await client.chat.completions.create({
    model: AI_MODEL,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  const content = completion.choices[0]?.message?.content ?? "";
  const parsed = safeJsonParse(content);
  const vocabulary = normalizeAiVocabulary(parsed.vocabulary);

  return {
    summary: asString(parsed.summary) || "已从文档中整理出可学习词汇。",
    vocabulary: vocabulary.length > 0 ? vocabulary.slice(0, maxItems) : extractFallbackVocabulary(rawText, maxItems),
    warning: vocabulary.length > 0 ? null : "AI 未返回有效词汇，已使用本地候选词。",
  };
}

export async function extractTextWithAiFromFile(file: File) {
  if (!process.env.OPENAI_API_KEY) {
    return { text: "", warning: "OpenAI API Key missing." };
  }

  if (file.size > MAX_AI_FILE_BYTES) {
    return { text: "", warning: "文件超过 25MB，已跳过 AI 文件 OCR。" };
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 180000 });
  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = file.type || "application/octet-stream";
  const dataUrl = `data:${mime};base64,${buffer.toString("base64")}`;

  const response = await client.responses.create({
    model: AI_MODEL,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: "Extract all readable text from this uploaded document. Preserve headings, lists, paragraph order, slide/page boundaries, and academic vocabulary. Return plain text only.",
          },
          {
            type: "input_file",
            filename: file.name || "uploaded-document",
            file_data: dataUrl,
            detail: "high",
          },
        ],
      },
    ],
  });

  return {
    text: response.output_text.trim(),
    warning: null,
  };
}
