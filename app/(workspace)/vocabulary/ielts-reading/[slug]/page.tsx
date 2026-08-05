import { notFound } from "next/navigation";

import { getIeltsReadingVocabularyDocument } from "@/lib/vocabulary/ielts-reading";
import IeltsReadingVocabularyClient from "./ielts-reading-vocabulary-client";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function IeltsReadingVocabularyPage({ params }: PageProps) {
  const { slug } = await params;
  const document = await getIeltsReadingVocabularyDocument(slug);

  if (!document) notFound();

  return <IeltsReadingVocabularyClient document={document} />;
}
