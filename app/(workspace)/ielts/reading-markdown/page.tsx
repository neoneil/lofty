import { notFound } from "next/navigation";

import { IeltsReadingBookCoverSelector } from "@/components/ielts-reading/book-cover-selector";
import { IeltsReadingExamClient } from "@/components/ielts-reading/reading-exam-client";
import { IeltsReadingTestSelector } from "@/components/ielts-reading/test-selector";
import { requireUser } from "@/lib/auth/require-user";
import { getIeltsMarkdownBookPracticeData } from "@/lib/ielts/markdown-practice";

const READING_BOOKS = [21, 20, 19, 18, 17, 16];
const BASE_PATH = "/ielts/reading-markdown";

type Props = {
  searchParams: Promise<{ book?: string; test?: string }>;
};

export default async function IeltsReadingMarkdownPage({ searchParams }: Props) {
  const { book, test } = await searchParams;
  const bookNumber = Number(book);
  const testNumber = Number(test);

  if (!book) return <IeltsReadingBookCoverSelector basePath={BASE_PATH} />;
  if (!READING_BOOKS.includes(bookNumber)) notFound();

  const nextPath = test ? `${BASE_PATH}?book=${bookNumber}&test=${encodeURIComponent(test)}` : `${BASE_PATH}?book=${bookNumber}`;
  await requireUser(nextPath);

  const data = await getIeltsMarkdownBookPracticeData(bookNumber, Number.isFinite(testNumber) ? testNumber : undefined);

  if (!data.book) notFound();
  if (!test) return <IeltsReadingTestSelector bookNumber={bookNumber} data={data} basePath={BASE_PATH} />;

  const selectedTestNumber = data.tests.some((item) => item.test_number === testNumber) ? testNumber : data.tests[0]?.test_number ?? 1;
  return <IeltsReadingExamClient data={data} selectedTestNumber={selectedTestNumber} />;
}
