import { notFound } from "next/navigation";

import PteStaticSamplePage from "@/components/pte/pte-static-sample-page";
import { getPteStaticQuestion } from "@/lib/pte/static-sample-questions";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PteListeningMcmaDetailPage({ params }: PageProps) {
  const { id } = await params;
  const question = getPteStaticQuestion("mcma", id);

  if (!question) notFound();

  return <PteStaticSamplePage question={question} />;
}
