import { notFound, redirect } from "next/navigation";

import { IeltsReadingBookCoverSelector } from "@/components/ielts-reading/book-cover-selector";
import { IeltsReadingExamClient } from "@/components/ielts-reading/reading-exam-client";
import { IeltsReadingTestSelector } from "@/components/ielts-reading/test-selector";
import { getAdminAccess } from "@/lib/auth/admin-access";
import { requireUser } from "@/lib/auth/require-user";
import { getIeltsMarkdownBookPracticeData } from "@/lib/ielts/markdown-practice";
import { hasIeltsTestEntryUsage } from "@/lib/ielts/test-entry-usage";

const READING_BOOKS = [21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7];

type Props = {
  searchParams: Promise<{ book?: string; test?: string }>;
};

export default async function IeltsReadingPage({ searchParams }: Props) {
  const { book, test } = await searchParams;
  const bookNumber = Number(book);
  const testNumber = Number(test);

  if (!book) return <IeltsReadingBookCoverSelector />;
  if (!READING_BOOKS.includes(bookNumber)) notFound();

  const nextPath = test ? `/ielts/reading?book=${bookNumber}&test=${encodeURIComponent(test)}` : `/ielts/reading?book=${bookNumber}`;
  const userContext = await requireUser(nextPath);
  const isAdmin = await getAdminAccess(userContext);
  const data = await getIeltsMarkdownBookPracticeData(bookNumber, Number.isFinite(testNumber) ? testNumber : undefined);

  if (!data.book) notFound();
  if (!test) return <IeltsReadingTestSelector bookNumber={bookNumber} data={data} />;

  const selectedTestNumber = data.tests.some((item) => item.test_number === testNumber) ? testNumber : data.tests[0]?.test_number ?? 1;
  const hasConfirmedEntry = await hasIeltsTestEntryUsage({ userId: userContext.user.id, moduleType: "reading", bookNumber, testNumber: selectedTestNumber });
  if (!hasConfirmedEntry) redirect(`/ielts/reading?book=${bookNumber}`);

  return <IeltsReadingExamClient data={data} selectedTestNumber={selectedTestNumber} isAdmin={isAdmin} />;
}
