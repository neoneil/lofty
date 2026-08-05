import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

import type { IeltsWritingVocabularyDocument, IeltsWritingVocabularyIndexItem } from "@/lib/vocabulary/ielts-writing-types";

const IELTS_WRITING_VOCABULARY_ROOT = path.join(process.cwd(), "content", "ielts", "vocabulary", "writing");

function isSafeVocabularySlug(slug: string) {
  return /^[a-z0-9][a-z0-9-]{1,80}$/.test(slug);
}

function getIeltsWritingVocabularyFilePath(slug: string) {
  if (!isSafeVocabularySlug(slug)) throw new Error("Invalid IELTS writing vocabulary slug.");
  return path.join(IELTS_WRITING_VOCABULARY_ROOT, `${slug}.json`);
}

export async function getIeltsWritingVocabularyDocument(slug: string): Promise<IeltsWritingVocabularyDocument | null> {
  try {
    const content = await fs.readFile(getIeltsWritingVocabularyFilePath(slug), "utf8");
    return JSON.parse(content) as IeltsWritingVocabularyDocument;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function getIeltsWritingVocabularyIndex(): Promise<IeltsWritingVocabularyIndexItem[]> {
  let fileNames: string[];
  try {
    fileNames = await fs.readdir(IELTS_WRITING_VOCABULARY_ROOT);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }

  const documents = await Promise.all(
    fileNames
      .filter((fileName) => fileName.endsWith(".json"))
      .map((fileName) => getIeltsWritingVocabularyDocument(fileName.replace(/\.json$/, ""))),
  );

  return documents
    .filter((document): document is IeltsWritingVocabularyDocument => Boolean(document))
    .map((document) => ({
      id: document.id,
      slug: document.slug,
      title: document.title,
      subtitle: document.subtitle,
      exam: document.exam,
      skill: document.skill,
      wordCount: document.wordCount,
      categoryCount: document.categoryCount,
      exampleCount: document.exampleCount,
      categoryTitles: document.categories.map((category) => category.title),
    }))
    .sort((a, b) => a.slug.localeCompare(b.slug, "en", { numeric: true }));
}
