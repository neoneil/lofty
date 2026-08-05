import { getResembleContent } from "@/lib/vocabulary/content";
import ResembleClient from "./resemble-client";

export default async function ResembleVocabularyPage() {
  const entries = await getResembleContent();
  return <ResembleClient entries={entries} />;
}
