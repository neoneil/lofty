import "server-only";

import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

import type { IeltsAnswer, IeltsAsset, IeltsBook, IeltsBookPracticeData, IeltsModule, IeltsQuestion, IeltsSection, IeltsTest } from "@/lib/ielts/practice";

const CONTENT_ROOT = path.join(process.cwd(), "content", "ielts", "cambridge");
const MODULE_TYPES = ["listening", "reading", "writing"] as const;

type ModuleType = typeof MODULE_TYPES[number];

type LessonFrontmatter = {
  book_id?: string;
  book_number?: number;
  book_title?: string;
  book_is_active?: boolean;
  test_id?: string;
  test_number?: number;
  test_title?: string;
  module_id?: string;
  module_type?: ModuleType;
  module_title?: string;
  duration_minutes?: number | null;
  module_sort_order?: number;
  section_id?: string;
  section_number?: number;
  section_title?: string | null;
  section_instruction?: string | null;
  passage_title?: string | null;
  section_sort_order?: number;
  module_raw_data_json?: string;
  section_raw_data_json?: string;
  questions_json?: string;
  answers_json?: string;
  assets_json?: string;
};

export async function getIeltsMarkdownBookPracticeData(bookNumber: number, testNumber?: number): Promise<IeltsBookPracticeData> {
  const bookDir = path.join(CONTENT_ROOT, `${bookNumber}`);
  if (!await exists(bookDir)) {
    return { book: null, tests: [], modules: [], sections: [], questions: [], answers: [], assets: [] };
  }

  const tests = await readMarkdownTests(bookNumber);
  const activeTest = tests.find((test) => test.test_number === testNumber) ?? tests[0];
  const book: IeltsBook = {
    id: `markdown-book-${bookNumber}`,
    book_number: bookNumber,
    title: `Cambridge IELTS ${bookNumber}`,
    is_active: true,
  };

  if (!activeTest) {
    return { book, tests, modules: [], sections: [], questions: [], answers: [], assets: [] };
  }

  const modules: IeltsModule[] = [];
  const sections: IeltsSection[] = [];
  const questions: IeltsQuestion[] = [];
  const answers: IeltsAnswer[] = [];
  const assets: IeltsAsset[] = [];

  for (const moduleType of MODULE_TYPES) {
    const moduleDir = path.join(bookDir, `test${activeTest.test_number}`, moduleType);
    const files = await readMarkdownFiles(moduleDir, moduleType);
    if (files.length === 0) continue;

    let testModule: IeltsModule | null = null;
    for (const file of files) {
      const parsed = await readLessonFile(path.join(moduleDir, file));
      if (!parsed || parsed.module_type !== moduleType) continue;

      testModule ??= {
        id: parsed.module_id || `markdown-${bookNumber}-${activeTest.test_number}-${moduleType}`,
        test_id: activeTest.id,
        module_type: moduleType,
        title: parsed.module_title || `${moduleType[0].toUpperCase()}${moduleType.slice(1)}`,
        duration_minutes: parsed.duration_minutes ?? (moduleType === "reading" ? 60 : null),
        sort_order: parsed.module_sort_order ?? moduleSortOrder(moduleType),
        raw_data: parseJsonRecord(parsed.module_raw_data_json),
      };

      sections.push({
        id: parsed.section_id || `markdown-${bookNumber}-${activeTest.test_number}-${moduleType}-${parsed.section_number}`,
        module_id: testModule.id,
        section_number: parsed.section_number ?? sectionNumberFromFile(file),
        title: parsed.section_title ?? null,
        instruction: parsed.section_instruction ?? null,
        passage_title: parsed.passage_title ?? null,
        passage_text: parsed.content.trim() || null,
        sort_order: parsed.section_sort_order ?? sectionNumberFromFile(file),
        raw_data: parseJsonRecord(parsed.section_raw_data_json),
      });

      questions.push(...parseJsonArray<IeltsQuestion>(parsed.questions_json));
      answers.push(...parseJsonArray<IeltsAnswer>(parsed.answers_json));
      assets.push(...parseJsonArray<IeltsAsset>(parsed.assets_json));
    }

    if (testModule) modules.push(testModule);
  }

  return {
    book: { ...book, id: firstString(modules[0]?.raw_data.book_id) || book.id },
    tests,
    modules: modules.sort((a, b) => a.sort_order - b.sort_order),
    sections: sections.sort((a, b) => a.sort_order - b.sort_order),
    questions: questions.sort((a, b) => a.sort_order - b.sort_order),
    answers,
    assets,
  };
}

async function readMarkdownTests(bookNumber: number) {
  const bookDir = path.join(CONTENT_ROOT, `${bookNumber}`);
  const entries = await readdir(bookDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && /^test\d+$/i.test(entry.name))
    .map<IeltsTest>((entry) => {
      const testNumber = Number(entry.name.replace(/\D/g, ""));
      return {
        id: `markdown-${bookNumber}-test${testNumber}`,
        book_id: `markdown-book-${bookNumber}`,
        test_number: testNumber,
        title: `Cambridge IELTS ${bookNumber} Test ${testNumber}`,
      };
    })
    .sort((a, b) => a.test_number - b.test_number);
}

async function readLessonFile(filePath: string) {
  const source = await readFile(filePath, "utf8");
  const parsed = matter(source);
  return { ...(parsed.data as LessonFrontmatter), content: parsed.content };
}

async function readMarkdownFiles(dir: string, moduleType: ModuleType) {
  if (!await exists(dir)) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && moduleFilePattern(moduleType).test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => sectionNumberFromFile(a) - sectionNumberFromFile(b));
}

async function exists(targetPath: string) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

function parseJsonArray<T>(value: unknown): T[] {
  if (!value) return [];
  if (Array.isArray(value)) return value as T[];
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

function parseJsonRecord(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function moduleSortOrder(moduleType: ModuleType) {
  return MODULE_TYPES.indexOf(moduleType) + 1;
}

function moduleFilePattern(moduleType: ModuleType) {
  if (moduleType === "reading") return /^part\d+\.md$/i;
  if (moduleType === "writing") return /^task\d+\.md$/i;
  return /^section\d+\.md$/i;
}

function sectionNumberFromFile(file: string) {
  const match = file.match(/\d+/);
  return match ? Number(match[0]) : 1;
}

function firstString(value: unknown) {
  return typeof value === "string" ? value : "";
}
