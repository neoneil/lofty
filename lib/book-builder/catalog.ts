import "server-only";

import { readdir } from "node:fs/promises";
import path from "node:path";

import { getAdminLessonCatalog } from "@/lib/admin/lesson-content";
import { getIeltsWritingTask1BankIndex } from "@/lib/ielts/writing-task1-bank";
import type { BookBuilderExam, BookCatalogItem } from "@/lib/book-builder/types";

const CAMBRIDGE_ROOT = path.join(process.cwd(), "content", "ielts", "cambridge");

const PTE_CATALOG: Array<{
  key: string;
  group: string;
  title: string;
  description: string;
}> = [
  { key: "ra", group: "Speaking", title: "Read Aloud (RA)", description: "朗读题目正文与配图。" },
  { key: "rs", group: "Speaking", title: "Repeat Sentence (RS)", description: "重复句子题目文本，不包含音频。" },
  { key: "di", group: "Speaking", title: "Describe Image (DI)", description: "描述图片题目、图片与提示信息。" },
  { key: "rl", group: "Speaking", title: "Retell Lecture (RL)", description: "复述讲座题目、图片与文字材料，不包含音频。" },
  { key: "asq", group: "Speaking", title: "Answer Short Question (ASQ)", description: "简答题目；可选择附带参考答案。" },
  { key: "rts", group: "Speaking", title: "Respond to a Situation (RTS)", description: "情景应答题目与文字信息。" },
  { key: "sgd", group: "Speaking", title: "Summarize Group Discussion (SGD)", description: "小组讨论总结题目与文字材料。" },
  { key: "swt", group: "Writing", title: "Summarize Written Text (SWT)", description: "书面文本总结题目；可选择附带答案。" },
  { key: "we", group: "Writing", title: "Write Essay (WE)", description: "PTE 大作文题目。" },
  { key: "ro", group: "Reading", title: "Re-order Paragraphs (RO)", description: "段落排序题目正文。" },
  { key: "fibr", group: "Reading", title: "Reading Fill in the Blanks (FIB-R)", description: "阅读填空题目与空格数据。" },
  { key: "fibrw", group: "Reading & Writing", title: "Reading & Writing Fill in the Blanks (FIB-RW)", description: "读写填空题目与空格数据。" },
  { key: "sst", group: "Listening", title: "Summarize Spoken Text (SST)", description: "听力总结题目与文本材料，不包含音频。" },
  { key: "hiw", group: "Listening", title: "Highlight Incorrect Words (HIW)", description: "找错词题目正文，不包含音频。" },
  { key: "wfd", group: "Listening", title: "Write From Dictation (WFD)", description: "听写句子题库，不包含音频。" },
];

async function listDirectories(directory: string) {
  try {
    return (await readdir(directory, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function hasModuleFiles(directory: string, module: "listening" | "reading" | "writing") {
  try {
    const pattern = module === "listening" ? /^section\d+\.md$/i : module === "reading" ? /^part\d+\.md$/i : /^task\d+\.md$/i;
    return (await readdir(directory, { withFileTypes: true })).some((entry) => entry.isFile() && pattern.test(entry.name));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

async function getCambridgeCatalog(): Promise<BookCatalogItem[]> {
  const books = (await listDirectories(CAMBRIDGE_ROOT))
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => b - a);
  const items: BookCatalogItem[] = [];

  for (const bookNumber of books) {
    const bookRoot = path.join(CAMBRIDGE_ROOT, String(bookNumber));
    const testNumbers = (await listDirectories(bookRoot))
      .filter((name) => /^test\d+$/i.test(name))
      .map((name) => Number(name.replace(/\D/g, "")))
      .filter(Number.isFinite)
      .sort((a, b) => a - b);

    for (const moduleType of ["listening", "reading", "writing"] as const) {
      const availableTests: number[] = [];
      for (const testNumber of testNumbers) {
        if (await hasModuleFiles(path.join(bookRoot, `test${testNumber}`, moduleType), moduleType)) {
          availableTests.push(testNumber);
        }
      }

      if (availableTests.length === 0) continue;
      const moduleLabel = moduleType[0].toUpperCase() + moduleType.slice(1);
      items.push({
        id: `ielts-cambridge:${bookNumber}:${moduleType}`,
        exam: "ielts",
        kind: "ielts-cambridge",
        group: `Cambridge IELTS ${bookNumber}`,
        title: `${moduleLabel} · Tests ${availableTests.join(", ")}`,
        description: `读取本地静态文件，包含 ${availableTests.length} 套 Test 的完整 ${moduleLabel} 内容。`,
        itemCount: availableTests.length,
        badge: moduleLabel,
      });
    }
  }

  return items;
}

async function getTask1Catalog(): Promise<BookCatalogItem[]> {
  const bank = await getIeltsWritingTask1BankIndex();
  const byBook = new Map<number, number>();
  for (const item of bank.items) byBook.set(item.bookNumber, (byBook.get(item.bookNumber) ?? 0) + 1);

  return [...byBook.entries()]
    .sort(([a], [b]) => b - a)
    .map(([bookNumber, count]) => ({
      id: `ielts-task1-bank:${bookNumber}`,
      exam: "ielts" as const,
      kind: "ielts-task1-bank" as const,
      group: "Writing Task 1 图片与范文",
      title: `Cambridge IELTS ${bookNumber} · Task 1`,
      description: `包含 ${count} 张完整题目图片；勾选答案时同时加入现有高分范文。`,
      itemCount: count,
      badge: "Task 1",
    }));
}

async function getLessonCatalog(): Promise<BookCatalogItem[]> {
  const lessons = await getAdminLessonCatalog();
  return lessons.map((lesson) => {
    const exam = lesson.exam as BookBuilderExam;
    const skill = lesson.lessonPath[0] ?? "lesson";
    return {
      id: `lesson:${exam}:${lesson.lessonPath.join("/")}`,
      exam,
      kind: "lesson-note",
      group: `授课笔记 · ${skill[0].toUpperCase()}${skill.slice(1)}`,
      title: lesson.title,
      description: lesson.subtitle || `${exam.toUpperCase()} 动态 Markdown 授课笔记`,
      itemCount: 1,
      badge: "Lesson",
    };
  });
}

function getPteCatalog(): BookCatalogItem[] {
  return PTE_CATALOG.map((item) => ({
    id: `pte-question-bank:${item.key}`,
    exam: "pte",
    kind: "pte-question-bank",
    group: `PTE · ${item.group}`,
    title: item.title,
    description: `${item.description} 生成时按需读取当前题库，最多 500 题。`,
    itemCount: null,
    badge: item.key.toUpperCase(),
  }));
}

export async function getBookBuilderCatalog(): Promise<BookCatalogItem[]> {
  const [cambridge, task1, lessons] = await Promise.all([
    getCambridgeCatalog(),
    getTask1Catalog(),
    getLessonCatalog(),
  ]);

  return [...cambridge, ...task1, ...getPteCatalog(), ...lessons];
}
