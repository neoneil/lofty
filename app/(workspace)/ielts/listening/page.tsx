import { notFound, redirect } from "next/navigation";

import { IeltsListeningExamClient } from "@/components/ielts-listening/listening-exam-client";
import { IeltsListeningBookSelector, IeltsListeningTestSelector } from "@/components/ielts-listening/listening-selectors";
import { getAdminAccess } from "@/lib/auth/admin-access";
import { requireUser } from "@/lib/auth/require-user";
import { getIeltsMarkdownBookPracticeData } from "@/lib/ielts/markdown-practice";
import { getIeltsBookPracticeData, type IeltsAsset, type IeltsBookPracticeData } from "@/lib/ielts/practice";
import { hasIeltsTestEntryUsage } from "@/lib/ielts/test-entry-usage";

const LISTENING_BOOKS = [21, 20, 19, 18, 17, 16];

type Props = {
  searchParams: Promise<{ book?: string; test?: string }>;
};

export default async function IeltsListeningPage({ searchParams }: Props) {
  const { book, test } = await searchParams;
  const bookNumber = Number(book);
  const testNumber = Number(test);

  if (!book) return <IeltsListeningBookSelector />;
  if (!LISTENING_BOOKS.includes(bookNumber)) notFound();

  const nextPath = test ? `/ielts/listening?book=${bookNumber}&test=${encodeURIComponent(test)}` : `/ielts/listening?book=${bookNumber}`;
  const userContext = await requireUser(nextPath);
  const { supabase } = userContext;
  const isAdmin = await getAdminAccess(userContext);
  const markdownData = await getIeltsMarkdownBookPracticeData(bookNumber, Number.isFinite(testNumber) ? testNumber : undefined);

  if (!markdownData.book) notFound();
  if (!test) return <IeltsListeningTestSelector bookNumber={bookNumber} data={markdownData} />;

  const selectedTestNumber = markdownData.tests.some((item) => item.test_number === testNumber) ? testNumber : markdownData.tests[0]?.test_number ?? 1;
  const hasConfirmedEntry = await hasIeltsTestEntryUsage({ userId: userContext.user.id, moduleType: "listening", bookNumber, testNumber: selectedTestNumber });
  if (!hasConfirmedEntry) redirect(`/ielts/listening?book=${bookNumber}`);

  const databaseData = await getIeltsBookPracticeData(supabase, bookNumber, selectedTestNumber);
  const data = mergeDatabaseAudioAssets(markdownData, databaseData.assets);

  return <IeltsListeningExamClient data={data} selectedTestNumber={selectedTestNumber} isAdmin={isAdmin} />;
}

function mergeDatabaseAudioAssets(markdownData: IeltsBookPracticeData, databaseAssets: IeltsAsset[]): IeltsBookPracticeData {
  const databaseByPath = new Map(databaseAssets.map((asset) => [asset.storage_path, asset]));
  return {
    ...markdownData,
    assets: markdownData.assets.map((asset) => asset.asset_type === "audio" ? databaseByPath.get(asset.storage_path) ?? asset : asset),
  };
}
