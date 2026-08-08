import "server-only";

import { buildIeltsSubmitResult } from "@/lib/ielts/answer-scoring";
import { buildOfficialAnswerMap } from "@/lib/ielts/official-answers";
import { getIeltsMarkdownBookPracticeData } from "@/lib/ielts/markdown-practice";
import type { IeltsAsset, IeltsBookPracticeData, IeltsModule, IeltsQuestion, IeltsSection } from "@/lib/ielts/practice";
import { normalizePublicStorageUrl } from "@/lib/storage/public-url";
import type { IeltsMockExamPayload, IeltsMockQuestionGroup, IeltsMockSection, IeltsMockSectionKey, IeltsMockSpeakingTask, IeltsMockSubmitSummary, IeltsMockWritingTask } from "@/lib/mock-test/types";

export const IELTS_MOCK_BOOK_NUMBER = 21;
export const IELTS_MOCK_TEST_NUMBERS = [1, 2, 3, 4] as const;
export const IELTS_SECTION_DURATIONS: Record<IeltsMockSectionKey, number> = {
  listening: 40 * 60,
  reading: 60 * 60,
  writing: 60 * 60,
  speaking: 14 * 60,
};

export function isAllowedIeltsMockTest(value: number) {
  return IELTS_MOCK_TEST_NUMBERS.includes(value as (typeof IELTS_MOCK_TEST_NUMBERS)[number]);
}

export async function loadIeltsMockSource(client: unknown, testNumber: number) {
  if (!isAllowedIeltsMockTest(testNumber)) {
    throw new Error("This IELTS mock test is not available.");
  }

  void client;
  return getIeltsMarkdownBookPracticeData(IELTS_MOCK_BOOK_NUMBER, testNumber);
}

export function buildIeltsMockExamPayload({
  source,
  testNumber,
  attempt,
  answers,
  timers,
  speaking,
  writingTask2,
}: {
  source: IeltsBookPracticeData;
  testNumber: number;
  attempt: IeltsMockExamPayload["attempt"];
  answers: Record<string, string>;
  timers?: Record<string, unknown>;
  speaking?: IeltsMockSpeakingTask | null;
  writingTask2?: IeltsMockWritingTask | null;
}): IeltsMockExamPayload {
  const writingTasks = buildWritingTasks(source);
  const finalWritingTasks = writingTask2 ? writingTasks.map((task) => task.taskKey === "task2" ? writingTask2 : task) : writingTasks;
  return {
    bookNumber: IELTS_MOCK_BOOK_NUMBER,
    testNumber,
    title: `Cambridge IELTS ${IELTS_MOCK_BOOK_NUMBER} Test ${testNumber}`,
    attempt,
    practiceData: source,
    sections: {
      listening: buildModuleSections(source, testNumber, "listening"),
      reading: buildModuleSections(source, testNumber, "reading"),
      writing: finalWritingTasks,
      speaking: speaking ?? null,
    },
    answers,
    timers: {
      listening: numberValue(timers?.listening, IELTS_SECTION_DURATIONS.listening),
      reading: numberValue(timers?.reading, IELTS_SECTION_DURATIONS.reading),
      writing: numberValue(timers?.writing, IELTS_SECTION_DURATIONS.writing),
      speaking: numberValue(timers?.speaking, IELTS_SECTION_DURATIONS.speaking),
    },
  };
}

export function buildIeltsMockSubmitSummary(source: IeltsBookPracticeData, answers: Record<string, string>): IeltsMockSubmitSummary {
  const listeningQuestions = questionsForModule(source, "listening");
  const readingQuestions = questionsForModule(source, "reading");
  const listeningOfficial = buildOfficialAnswerMap(listeningQuestions, source.answers);
  const readingOfficial = buildOfficialAnswerMap(readingQuestions, source.answers);
  const listening = buildIeltsSubmitResult("listening", pickNumberAnswers(answers, "listening"), listeningOfficial);
  const reading = buildIeltsSubmitResult("reading", pickNumberAnswers(answers, "reading"), readingOfficial);
  const task1 = answers["writing:task1"] ?? "";
  const task2 = answers["writing:task2"] ?? "";

  return {
    listening,
    reading,
    writing: {
      task1WordCount: countWords(task1),
      task2WordCount: countWords(task2),
    },
    speaking: {
      answeredCount: Object.entries(answers).filter(([key, value]) => key.startsWith("speaking:") && value.trim()).length,
    },
    sectionScores: { listening, reading },
    correctCount: listening.correctCount + reading.correctCount,
    answeredCount: listening.rows.filter((row) => row.isAnswered).length + reading.rows.filter((row) => row.isAnswered).length + (task1.trim() ? 1 : 0) + (task2.trim() ? 1 : 0) + Object.entries(answers).filter(([key, value]) => key.startsWith("speaking:") && value.trim()).length,
  };
}

export function buildIeltsQuestionSnapshot(group: IeltsMockQuestionGroup) {
  return {
    id: group.id,
    sectionKey: group.sectionKey,
    questionKey: group.questionKey,
    questionType: group.questionType,
    questionNumberStart: group.questionNumberStart,
    questionNumberEnd: group.questionNumberEnd,
    prompt: group.prompt,
    instructions: group.instructions,
    content: group.content,
    options: group.options,
  };
}

function buildModuleSections(source: IeltsBookPracticeData, testNumber: number, moduleType: "listening" | "reading"): IeltsMockSection[] {
  const ieltsModule = source.modules.find((item) => item.module_type === moduleType);
  if (!ieltsModule) return [];
  const sections = source.sections.filter((section) => section.module_id === ieltsModule.id).sort((a, b) => a.sort_order - b.sort_order);
  const sectionAudios = moduleType === "listening" ? selectSectionAudios(source.assets, sections, ieltsModule) : [];

  return sections.map((section, index) => {
    const questions = source.questions
      .filter((question) => question.section_id === section.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((question) => mapQuestionGroup(question, section.id, moduleType));

    return {
      id: section.id,
      sectionKey: moduleType,
      sectionNumber: section.section_number,
      title: section.title || section.passage_title || `${moduleType === "listening" ? "Part" : "Passage"} ${index + 1}`,
      instructions: section.instruction || "",
      passageTitle: section.passage_title || "",
      passageText: section.passage_text || stringValue(section.raw_data, "content"),
      audioUrl: sectionAudios[index] ? getAssetUrl(sectionAudios[index]) : undefined,
      imageUrls: source.assets.filter((asset) => asset.section_id === section.id && asset.asset_type === "image").map(getAssetUrl).filter(Boolean),
      questions,
    };
  });
}

function buildWritingTasks(source: IeltsBookPracticeData): IeltsMockWritingTask[] {
  const ieltsModule = source.modules.find((item) => item.module_type === "writing");
  if (!ieltsModule) {
    return [
      { taskKey: "task1", title: "Writing Task 1", prompt: "", instructions: "Write at least 150 words.", imageUrls: [] },
      { taskKey: "task2", title: "Writing Task 2", prompt: "", instructions: "Write at least 250 words.", imageUrls: [] },
    ];
  }
  const sections = source.sections.filter((section) => section.module_id === ieltsModule.id).sort((a, b) => a.sort_order - b.sort_order);
  const tasks = sections.slice(0, 2).map((section, index) => ({
    taskKey: index === 0 ? "task1" as const : "task2" as const,
    title: index === 0 ? "Writing Task 1" : "Writing Task 2",
    prompt: section.passage_text || section.instruction || section.title || stringValue(section.raw_data, "content"),
    instructions: index === 0 ? "Write at least 150 words." : "Write at least 250 words.",
    imageUrls: index === 0 ? source.assets.filter((asset) => asset.module_id === ieltsModule.id && (asset.section_id === section.id || !asset.section_id) && asset.asset_type === "image").map(getAssetUrl).filter(Boolean) : [],
  }));

  if (!tasks.some((task) => task.taskKey === "task1")) tasks.unshift({ taskKey: "task1", title: "Writing Task 1", prompt: "", instructions: "Write at least 150 words.", imageUrls: [] });
  if (!tasks.some((task) => task.taskKey === "task2")) tasks.push({ taskKey: "task2", title: "Writing Task 2", prompt: "", instructions: "Write at least 250 words.", imageUrls: [] });
  return tasks;
}

function mapQuestionGroup(question: IeltsQuestion, sectionId: string, sectionKey: "listening" | "reading"): IeltsMockQuestionGroup {
  return {
    id: question.id,
    sectionId,
    sectionKey,
    questionKey: `${sectionKey}:${question.question_number_start}-${question.question_number_end ?? question.question_number_start}`,
    questionType: question.question_type,
    questionNumberStart: question.question_number_start,
    questionNumberEnd: question.question_number_end ?? question.question_number_start,
    prompt: question.prompt || "",
    instructions: question.instruction || "",
    content: question.content,
    options: question.options,
    sortOrder: question.sort_order,
  };
}

function questionsForModule(source: IeltsBookPracticeData, moduleType: "listening" | "reading") {
  const ieltsModule = source.modules.find((item) => item.module_type === moduleType);
  if (!ieltsModule) return [];
  const sectionIds = source.sections.filter((section) => section.module_id === ieltsModule.id).map((section) => section.id);
  return source.questions.filter((question) => sectionIds.includes(question.section_id));
}

function selectSectionAudios(assets: IeltsAsset[], sections: IeltsSection[], module: IeltsModule) {
  const candidates = assets
    .filter((asset) => asset.asset_type === "audio" && asset.module_id === module.id)
    .sort((a, b) => {
      const aOrder = typeof a.metadata?.sort_order === "number" ? a.metadata.sort_order : 0;
      const bOrder = typeof b.metadata?.sort_order === "number" ? b.metadata.sort_order : 0;
      return aOrder - bOrder || a.storage_path.localeCompare(b.storage_path);
    });

  return sections.map((section, index) => {
    return candidates.find((asset) => asset.section_id === section.id) ?? candidates[index] ?? candidates[0];
  }).filter(Boolean);
}

function pickNumberAnswers(answers: Record<string, string>, sectionKey: "listening" | "reading") {
  const prefix = `${sectionKey}:`;
  return Object.fromEntries(Object.entries(answers).filter(([key]) => key.startsWith(prefix)).map(([key, value]) => [key.slice(prefix.length), value]));
}

function getAssetUrl(asset: IeltsAsset) {
  return normalizePublicStorageUrl(asset.public_url || asset.storage_path, asset.bucket || "ielts") || "";
}

function stringValue(record: Record<string, unknown> | undefined, key: string) {
  const value = record?.[key];
  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}
