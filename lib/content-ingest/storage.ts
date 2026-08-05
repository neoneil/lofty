import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

import type { GeneratedVocabularyDocument, GeneratedVocabularyIndexItem } from "@/lib/content-ingest/types";

const CONTENT_ROOT = path.join(process.cwd(), "content", "generated-vocabulary");
const INDEX_FILE = path.join(CONTENT_ROOT, "index.json");

function isSafeSlug(slug: string) {
  return /^[a-z0-9][a-z0-9-]{1,80}$/.test(slug);
}

export function slugifyTitle(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);

  return slug || `document-${Date.now()}`;
}

export function getGeneratedVocabularyFilePath(slug: string) {
  if (!isSafeSlug(slug)) throw new Error("Invalid generated vocabulary slug.");
  return path.join(CONTENT_ROOT, `${slug}.json`);
}

export async function readGeneratedVocabularyIndex(): Promise<GeneratedVocabularyIndexItem[]> {
  try {
    const content = await fs.readFile(INDEX_FILE, "utf8");
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed as GeneratedVocabularyIndexItem[] : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function readGeneratedVocabularyDocument(slug: string): Promise<GeneratedVocabularyDocument | null> {
  try {
    const content = await fs.readFile(getGeneratedVocabularyFilePath(slug), "utf8");
    return JSON.parse(content) as GeneratedVocabularyDocument;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function writeGeneratedVocabularyDocument(document: GeneratedVocabularyDocument) {
  await fs.mkdir(CONTENT_ROOT, { recursive: true });
  await fs.writeFile(getGeneratedVocabularyFilePath(document.slug), `${JSON.stringify(document, null, 2)}\n`, "utf8");

  const index = await readGeneratedVocabularyIndex();
  const nextItem: GeneratedVocabularyIndexItem = {
    id: document.id,
    slug: document.slug,
    title: document.title,
    category: document.category,
    summary: document.summary,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    sourceFileNames: document.sourceFiles.map((file) => file.fileName),
    wordCount: document.vocabulary.length,
    rawTextLength: document.rawText.length,
  };
  const nextIndex = [nextItem, ...index.filter((item) => item.slug !== document.slug)]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  await fs.writeFile(INDEX_FILE, `${JSON.stringify(nextIndex, null, 2)}\n`, "utf8");
  return nextItem;
}

