import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

import type { IeltsSpeakingVocabularyDocument, IeltsSpeakingVocabularyIndexItem } from "@/lib/vocabulary/ielts-speaking-types";

const IELTS_SPEAKING_VOCABULARY_ROOT = path.join(process.cwd(), "content", "ielts", "vocabulary", "speaking");

function isSafeVocabularySlug(slug: string) {
  return /^[a-z0-9][a-z0-9-]{1,80}$/.test(slug);
}

function getIeltsSpeakingVocabularyFilePath(slug: string) {
  if (!isSafeVocabularySlug(slug)) throw new Error("Invalid IELTS speaking vocabulary slug.");
  return path.join(IELTS_SPEAKING_VOCABULARY_ROOT, `${slug}.json`);
}

export async function getIeltsSpeakingVocabularyDocument(slug: string): Promise<IeltsSpeakingVocabularyDocument | null> {
  try {
    const content = await fs.readFile(getIeltsSpeakingVocabularyFilePath(slug), "utf8");
    return JSON.parse(content) as IeltsSpeakingVocabularyDocument;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function getIeltsSpeakingVocabularyIndex(): Promise<IeltsSpeakingVocabularyIndexItem[]> {
  let fileNames: string[];
  try {
    fileNames = await fs.readdir(IELTS_SPEAKING_VOCABULARY_ROOT);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }

  const documents = await Promise.all(
    fileNames
      .filter((fileName) => fileName.endsWith(".json"))
      .map((fileName) => getIeltsSpeakingVocabularyDocument(fileName.replace(/\.json$/, ""))),
  );

  return documents
    .filter((document): document is IeltsSpeakingVocabularyDocument => Boolean(document))
    .map((document) => ({
      id: document.id,
      slug: document.slug,
      title: document.title,
      subtitle: document.subtitle,
      exam: document.exam,
      skill: document.skill,
      wordCount: document.wordCount,
      topicCount: document.topicCount,
      partCount: document.partCount,
      partTitles: document.parts.map((part) => part.title),
    }))
    .sort((a, b) => a.slug.localeCompare(b.slug, "en", { numeric: true }));
}
