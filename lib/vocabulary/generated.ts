import "server-only";

import type { GeneratedVocabularyDocument, GeneratedVocabularyIndexItem } from "@/lib/content-ingest/types";
import { readGeneratedVocabularyDocument, readGeneratedVocabularyIndex } from "@/lib/content-ingest/storage";

export type { GeneratedVocabularyDocument, GeneratedVocabularyIndexItem };

export async function getGeneratedVocabularyDocuments() {
  return readGeneratedVocabularyIndex();
}

export async function getGeneratedVocabularyDocument(slug: string) {
  return readGeneratedVocabularyDocument(slug);
}

