import { getWordRootContent } from "@/lib/vocabulary/content";
import WordRootsClient from "./word-roots-client";

export default async function WordRootsVocabularyPage() {
  const entries = await getWordRootContent();
  return <WordRootsClient entries={entries} />;
}
