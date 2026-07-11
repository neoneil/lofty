import { notFound } from "next/navigation";

import { IeltsListeningExamClient } from "@/components/ielts-listening/listening-exam-client";
import { IeltsListeningBookSelector, IeltsListeningTestSelector } from "@/components/ielts-listening/listening-selectors";
import { getAdminAccess } from "@/lib/auth/admin-access";
import { requireUser } from "@/lib/auth/require-user";
import { getIeltsMarkdownBookPracticeData } from "@/lib/ielts/markdown-practice";
import { getIeltsBookPracticeData, type IeltsAsset, type IeltsBookPracticeData } from "@/lib/ielts/practice";

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
  const databaseData = await getIeltsBookPracticeData(supabase, bookNumber, selectedTestNumber);
  const data = isAdmin ? mergeDatabaseAudioAssets(markdownData, databaseData.assets) : sanitizePracticeDataForStudent(mergeDatabaseAudioAssets(markdownData, databaseData.assets));

  return <IeltsListeningExamClient data={data} selectedTestNumber={selectedTestNumber} isAdmin={isAdmin} />;
}

function mergeDatabaseAudioAssets(markdownData: IeltsBookPracticeData, databaseAssets: IeltsAsset[]): IeltsBookPracticeData {
  const databaseByPath = new Map(databaseAssets.map((asset) => [asset.storage_path, asset]));
  return {
    ...markdownData,
    assets: markdownData.assets.map((asset) => asset.asset_type === "audio" ? databaseByPath.get(asset.storage_path) ?? asset : asset),
  };
}

function sanitizePracticeDataForStudent(data: IeltsBookPracticeData): IeltsBookPracticeData {
  return {
    ...data,
    answers: [],
    questions: data.questions.map((question) => {
      const contentQuestions = Array.isArray(question.content.questions) ? question.content.questions.map(stripAnswerFields) : question.content.questions;
      return {
        ...question,
        options: isListeningFillAnswerBank(question) ? [] : question.options,
        content: {
          ...question.content,
          questions: contentQuestions,
        },
      };
    }),
  };
}

function stripAnswerFields(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const { answerId: _answerId, optionId: _optionId, optionIds: _optionIds, answerValue: _answerValue, answerExplain: _answerExplain, ...rest } = value as Record<string, unknown>;
  return rest;
}

function isListeningFillAnswerBank(question: IeltsBookPracticeData["questions"][number]) {
  const pageContent = typeof question.content.page_content === "string" ? question.content.page_content : "";
  const instruction = `${question.prompt ?? ""} ${question.instruction ?? ""} ${typeof question.content.section_desc === "string" ? question.content.section_desc : ""} ${pageContent}`.toLowerCase();
  return question.question_type === "11" || hasListeningBlanks(pageContent) || (instruction.includes("complete the") && !instruction.includes("choose"));
}

function hasListeningBlanks(value: string) {
  return /#{2,}\s*-\s*\d{1,3}\s*-\s*#{2,}/.test(value) || /\[blank\]\s*\[\/blank\]/i.test(value) || /_{3,}\s*\d{1,3}\s*_{3,}/.test(value);
}
