import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

import type { IeltsReadingVocabularyDocument, IeltsReadingVocabularyIndexItem } from "@/lib/vocabulary/ielts-reading-types";

const IELTS_READING_VOCABULARY_ROOT = path.join(process.cwd(), "content", "ielts", "vocabulary", "reading");

function isSafeVocabularySlug(slug: string) {
  return /^[a-z0-9][a-z0-9-]{1,80}$/.test(slug);
}

function getIeltsReadingVocabularyFilePath(slug: string) {
  if (!isSafeVocabularySlug(slug)) throw new Error("Invalid IELTS reading vocabulary slug.");
  return path.join(IELTS_READING_VOCABULARY_ROOT, `${slug}.json`);
}

export async function getIeltsReadingVocabularyDocument(slug: string): Promise<IeltsReadingVocabularyDocument | null> {
  try {
    const content = await fs.readFile(getIeltsReadingVocabularyFilePath(slug), "utf8");
    return JSON.parse(content) as IeltsReadingVocabularyDocument;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function getIeltsReadingVocabularyIndex(): Promise<IeltsReadingVocabularyIndexItem[]> {
  let fileNames: string[];
  try {
    fileNames = await fs.readdir(IELTS_READING_VOCABULARY_ROOT);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }

  const documents = await Promise.all(
    fileNames
      .filter((fileName) => fileName.endsWith(".json"))
      .map((fileName) => getIeltsReadingVocabularyDocument(fileName.replace(/\.json$/, ""))),
  );

  return documents
    .filter((document): document is IeltsReadingVocabularyDocument => Boolean(document))
    .map((document) => ({
      id: document.id,
      slug: document.slug,
      title: document.title,
      subtitle: document.subtitle,
      exam: document.exam,
      skill: document.skill,
      wordCount: document.wordCount,
      listCount: document.listCount,
      chapterTitles: Array.from(new Set(document.lists.map((list) => list.chapterTitle).filter(Boolean))),
    }))
    .sort((a, b) => a.slug.localeCompare(b.slug, "en", { numeric: true }));
}
