import "server-only";

import { promises as fs } from "fs";
import path from "path";

import type { ResembleEntry, VocabularyContent, WordRootEntry } from "@/lib/vocabulary/content-types";

export type { ResembleEntry, VocabularyContent, WordRootEntry } from "@/lib/vocabulary/content-types";

type RawWordRoot = {
  root?: unknown;
  meaning?: unknown;
  class?: unknown;
  origin?: unknown;
  function?: unknown;
  example?: unknown;
  synonyms?: unknown;
  antonyms?: unknown;
};

const contentDir = path.join(process.cwd(), "content");

async function readContentFile(fileName: string) {
  const candidates = [
    path.join(contentDir, "words", fileName),
    path.join(contentDir, fileName),
  ];

  for (const filePath of candidates) {
    try {
      return await fs.readFile(filePath, "utf8");
    } catch (error) {
      const code = error instanceof Error && "code" in error ? (error as NodeJS.ErrnoException).code : null;

      if (code !== "ENOENT") {
        throw error;
      }
    }
  }

  return "";
}

function cleanLine(line: string) {
  return line.trim().replace(/\s+/g, " ");
}

function parseResembleBlock(block: string, index: number): ResembleEntry | null {
  const lines = block.split(/\r?\n/).map(cleanLine).filter(Boolean);
  const heading = lines[0]?.replace(/^%\s*/, "").trim();

  if (!heading) return null;

  const definitions: ResembleEntry["definitions"] = [];
  const notes: string[] = [];

  for (const line of lines.slice(1)) {
    if (!line.startsWith("- ")) {
      notes.push(line);
      continue;
    }

    const content = line.replace(/^-\s*/, "");
    const separatorIndex = content.indexOf(":");

    if (separatorIndex === -1) {
      notes.push(content);
      continue;
    }

    definitions.push({
      term: content.slice(0, separatorIndex).trim(),
      explanation: content.slice(separatorIndex + 1).trim(),
    });
  }

  return {
    id: `resemble-${index}`,
    title: heading,
    terms: heading.split(",").map((term) => term.trim()).filter(Boolean),
    summary: notes[0] ?? "",
    notes: notes.slice(1),
    definitions,
  };
}

function parseResemble(content: string) {
  return content
    .split(/\r?\n(?=%\s+)/)
    .map((block, index) => parseResembleBlock(block, index))
    .filter((entry): entry is ResembleEntry => Boolean(entry));
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean) : [];
}

function parseWordRoots(content: string) {
  if (!content.trim()) return [];

  const raw = JSON.parse(content) as Record<string, RawWordRoot>;

  return Object.entries(raw).map(([key, value], index) => ({
    id: `wordroot-${index}`,
    root: asString(value.root) || key,
    meaning: asString(value.meaning),
    wordClass: asString(value.class),
    origin: asString(value.origin),
    functionText: asString(value.function).replace(/\s+/g, " "),
    examples: asStringArray(value.example),
    synonyms: asString(value.synonyms),
    antonyms: asString(value.antonyms),
  }));
}

export async function getVocabularyContent(): Promise<VocabularyContent> {
  const [resembleContent, wordRootContent] = await Promise.all([
    readContentFile("resemble.txt"),
    readContentFile("wordroot.txt"),
  ]);

  return {
    resemble: parseResemble(resembleContent),
    wordRoots: parseWordRoots(wordRootContent),
  };
}

export async function getResembleContent(): Promise<ResembleEntry[]> {
  return parseResemble(await readContentFile("resemble.txt"));
}

export async function getWordRootContent(): Promise<WordRootEntry[]> {
  return parseWordRoots(await readContentFile("wordroot.txt"));
}

export async function searchResembleEntries(query: string, limit = 6) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  const { resemble } = await getVocabularyContent();

  return resemble
    .filter((entry) => [entry.title, entry.summary, ...entry.terms, ...entry.notes, ...entry.definitions.flatMap((item) => [item.term, item.explanation])].join(" ").toLowerCase().includes(normalizedQuery))
    .slice(0, Math.max(1, Math.min(limit, 10)));
}
