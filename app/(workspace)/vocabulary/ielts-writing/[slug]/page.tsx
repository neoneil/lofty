import { notFound } from "next/navigation";

import { getIeltsWritingVocabularyDocument } from "@/lib/vocabulary/ielts-writing";
import IeltsWritingVocabularyClient from "./ielts-writing-vocabulary-client";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function IeltsWritingVocabularyPage({ params }: PageProps) {
  const { slug } = await params;
  const document = await getIeltsWritingVocabularyDocument(slug);

  if (!document) notFound();

  return <IeltsWritingVocabularyClient document={document} />;
}
