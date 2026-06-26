import { getVocabularyContent } from "@/lib/vocabulary/content";
import VocabularyClient from "./vocabulary-client";

export default async function VocabularyPage() {
  const { resemble, wordRoots } = await getVocabularyContent();

  return <VocabularyClient resemble={resemble} wordRoots={wordRoots} />;
}
