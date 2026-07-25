import { notFound, redirect } from "next/navigation";

import { IeltsReadingBookCoverSelector } from "@/components/ielts-reading/book-cover-selector";
import type { IeltsReadingDataSource } from "@/components/ielts-reading/data-source-switch";
import { IeltsReadingExamClient } from "@/components/ielts-reading/reading-exam-client";
import { IeltsReadingTestSelector } from "@/components/ielts-reading/test-selector";
import { requireUser } from "@/lib/auth/require-user";
import { getServerUserWithRole } from "@/lib/auth/server-auth";
import { getIeltsMarkdownBookPracticeData } from "@/lib/ielts/markdown-practice";
import { getIeltsBookPracticeData } from "@/lib/ielts/practice";
import { hasIeltsTestEntryUsage } from "@/lib/ielts/test-entry-usage";

const READING_BOOKS = [21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7];

type Props = {
  searchParams: Promise<{ book?: string; test?: string; source?: string }>;
};

export default async function IeltsReadingPage({ searchParams }: Props) {
  const { book, test, source: sourceParam } = await searchParams;
  const source: IeltsReadingDataSource = sourceParam === "database" ? "database" : "markdown";
  const bookNumber = Number(book);
  const testNumber = Number(test);

  if (!book) return <IeltsReadingBookCoverSelector source={source} />;
  if (!READING_BOOKS.includes(bookNumber)) notFound();

  const sourceQuery = source === "database" ? "source=database&" : "";
  const nextPath = test ? `/ielts/reading?${sourceQuery}book=${bookNumber}&test=${encodeURIComponent(test)}` : `/ielts/reading?${sourceQuery}book=${bookNumber}`;
  const userContext = await requireUser(nextPath);
  const { supabase } = userContext;
  const adminContext = await getServerUserWithRole(["admin"], userContext);
  const data = source === "database" ? await getIeltsBookPracticeData(supabase, bookNumber, Number.isFinite(testNumber) ? testNumber : undefined) : await getIeltsMarkdownBookPracticeData(bookNumber, Number.isFinite(testNumber) ? testNumber : undefined);

  if (!data.book) notFound();
  if (!test) return <IeltsReadingTestSelector bookNumber={bookNumber} data={data} source={source} />;

  const selectedTestNumber = data.tests.some((item) => item.test_number === testNumber) ? testNumber : data.tests[0]?.test_number ?? 1;
  const hasConfirmedEntry = await hasIeltsTestEntryUsage({ userId: userContext.user.id, moduleType: "reading", bookNumber, testNumber: selectedTestNumber });
  if (!hasConfirmedEntry) redirect(`/ielts/reading?${sourceQuery}book=${bookNumber}`);

  return <IeltsReadingExamClient data={data} selectedTestNumber={selectedTestNumber} isAdmin={Boolean(adminContext)} />;
}
