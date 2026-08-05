import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

import type { IeltsListeningVocabularyDocument, IeltsListeningVocabularyIndexItem } from "@/lib/vocabulary/ielts-listening-types";

const IELTS_LISTENING_VOCABULARY_ROOT = path.join(process.cwd(), "content", "ielts", "vocabulary", "listening");

function isSafeVocabularySlug(slug: string) {
  return /^[a-z0-9][a-z0-9-]{1,80}$/.test(slug);
}

function getIeltsListeningVocabularyFilePath(slug: string) {
  if (!isSafeVocabularySlug(slug)) throw new Error("Invalid IELTS listening vocabulary slug.");
  return path.join(IELTS_LISTENING_VOCABULARY_ROOT, `${slug}.json`);
}

export async function getIeltsListeningVocabularyDocument(slug: string): Promise<IeltsListeningVocabularyDocument | null> {
  try {
    const content = await fs.readFile(getIeltsListeningVocabularyFilePath(slug), "utf8");
    return JSON.parse(content) as IeltsListeningVocabularyDocument;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function getIeltsListeningVocabularyIndex(): Promise<IeltsListeningVocabularyIndexItem[]> {
  let fileNames: string[];
  try {
    fileNames = await fs.readdir(IELTS_LISTENING_VOCABULARY_ROOT);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }

  const documents = await Promise.all(
    fileNames
      .filter((fileName) => fileName.endsWith(".json"))
      .map((fileName) => getIeltsListeningVocabularyDocument(fileName.replace(/\.json$/, ""))),
  );

  return documents
    .filter((document): document is IeltsListeningVocabularyDocument => Boolean(document))
    .map((document) => ({
      id: document.id,
      slug: document.slug,
      title: document.title,
      subtitle: document.subtitle,
      exam: document.exam,
      skill: document.skill,
      wordCount: document.wordCount,
      sceneCount: document.sceneCount,
      audioCount: document.audioCount,
      sectionTitles: document.sections.map((section) => section.title),
    }))
    .sort((a, b) => a.slug.localeCompare(b.slug, "en", { numeric: true }));
}
