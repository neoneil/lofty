import { notFound } from "next/navigation";

import { getIeltsSpeakingVocabularyDocument } from "@/lib/vocabulary/ielts-speaking";
import IeltsSpeakingVocabularyClient from "./ielts-speaking-vocabulary-client";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function IeltsSpeakingVocabularyPage({ params }: PageProps) {
  const { slug } = await params;
  const document = await getIeltsSpeakingVocabularyDocument(slug);

  if (!document) notFound();

  return <IeltsSpeakingVocabularyClient document={document} />;
}
