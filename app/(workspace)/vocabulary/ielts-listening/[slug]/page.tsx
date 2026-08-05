import { notFound } from "next/navigation";

import { getIeltsListeningVocabularyDocument } from "@/lib/vocabulary/ielts-listening";
import IeltsListeningVocabularyClient from "./ielts-listening-vocabulary-client";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function IeltsListeningVocabularyPage({ params }: PageProps) {
  const { slug } = await params;
  const document = await getIeltsListeningVocabularyDocument(slug);

  if (!document) notFound();

  return <IeltsListeningVocabularyClient document={document} />;
}
