import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const BASE_DIR = path.join(process.cwd(), "content", "ielts", "cambridge");
const BOOKS = [21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7];
const TESTS = [1, 2, 3, 4];
const MODULES = ["listening", "reading", "writing"];

const bookNumber = Number(process.argv[2] ?? 21);

if (!BOOKS.includes(bookNumber)) {
  throw new Error(`Unsupported IELTS book: ${bookNumber}`);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseKey = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase env. Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

await ensureDirectoryTree();
await exportBook(bookNumber);

async function ensureDirectoryTree() {
  for (const book of BOOKS) {
    for (const test of TESTS) {
      for (const moduleType of MODULES) {
        const dir = path.join(BASE_DIR, `${book}`, `test${test}`, moduleType);
        await mkdir(dir, { recursive: true });
        await writeFile(path.join(dir, ".gitkeep"), "", "utf8");
      }
    }
  }
}

async function exportBook(targetBookNumber) {
  const [book] = await query(
    supabase.schema("ielts").from("cambridge_books").select("id, book_number, title, is_active").eq("book_number", targetBookNumber),
  );

  if (!book) {
    throw new Error(`Book ${targetBookNumber} was not found in ielts.cambridge_books.`);
  }

  const tests = await query(
    supabase.schema("ielts").from("tests").select("id, book_id, test_number, title").eq("book_id", book.id).order("test_number", { ascending: true }),
  );

  const modules = tests.length > 0 ? await query(
    supabase.schema("ielts").from("test_modules").select("id, test_id, module_type, title, duration_minutes, sort_order, raw_data").in("test_id", tests.map((test) => test.id)).order("sort_order", { ascending: true }),
  ) : [];

  const sections = modules.length > 0 ? await query(
    supabase.schema("ielts").from("sections").select("id, module_id, section_number, title, instruction, passage_title, passage_text, sort_order, raw_data").in("module_id", modules.map((module) => module.id)).order("sort_order", { ascending: true }),
  ) : [];

  const questions = sections.length > 0 ? await query(
    supabase.schema("ielts").from("questions").select("id, section_id, question_number_start, question_number_end, question_type, prompt, instruction, content, options, sort_order").in("section_id", sections.map((section) => section.id)).order("sort_order", { ascending: true }),
  ) : [];

  const answers = questions.length > 0 ? await query(
    supabase.schema("ielts").from("answers").select("id, question_id, answer_data, explanation, raw_data").in("question_id", questions.map((question) => question.id)),
  ) : [];

  const assets = tests.length > 0 ? await query(
    supabase.schema("ielts").from("assets").select("id, book_id, test_id, module_id, section_id, question_id, asset_type, bucket, storage_path, public_url, mime_type, duration_seconds, metadata").in("test_id", tests.map((test) => test.id)),
  ) : [];

  let fileCount = 0;
  for (const test of tests) {
    const testModules = modules.filter((module) => module.test_id === test.id && MODULES.includes(module.module_type));
    for (const testModule of testModules) {
      const moduleSections = sections.filter((section) => section.module_id === testModule.id).sort((a, b) => a.sort_order - b.sort_order);
      for (const section of moduleSections) {
        const sectionQuestions = questions.filter((question) => question.section_id === section.id).sort((a, b) => a.sort_order - b.sort_order);
        const questionIds = new Set(sectionQuestions.map((question) => question.id));
        const sectionAnswers = answers.filter((answer) => questionIds.has(answer.question_id));
        const sectionAssets = assets.filter((asset) => asset.section_id === section.id || asset.module_id === testModule.id || sectionQuestions.some((question) => question.id === asset.question_id));
        const filePath = path.join(BASE_DIR, `${targetBookNumber}`, `test${test.test_number}`, testModule.module_type, sectionFileName(testModule.module_type, section.section_number));
        await writeFile(filePath, buildMarkdown({ book, test, testModule, section, questions: sectionQuestions, answers: sectionAnswers, assets: sectionAssets }), "utf8");
        fileCount += 1;
      }
    }
  }

  console.log(`Exported Cambridge IELTS ${targetBookNumber}: ${fileCount} markdown files.`);
}

async function query(builder) {
  const { data, error } = await builder;
  if (error) throw new Error(error.message);
  return data ?? [];
}

function sectionFileName(moduleType, sectionNumber) {
  if (moduleType === "reading") return `part${sectionNumber}.md`;
  if (moduleType === "writing") return `task${sectionNumber}.md`;
  return `section${sectionNumber}.md`;
}

function buildMarkdown({ book, test, testModule, section, questions, answers, assets }) {
  const frontmatter = [
    "---",
    scalar("book_id", book.id),
    scalar("book_number", book.book_number),
    scalar("book_title", book.title),
    scalar("book_is_active", book.is_active),
    scalar("test_id", test.id),
    scalar("test_number", test.test_number),
    scalar("test_title", test.title),
    scalar("module_id", testModule.id),
    scalar("module_type", testModule.module_type),
    scalar("module_title", testModule.title),
    scalar("duration_minutes", testModule.duration_minutes),
    scalar("module_sort_order", testModule.sort_order),
    scalar("section_id", section.id),
    scalar("section_number", section.section_number),
    scalar("section_title", section.title),
    scalar("section_instruction", section.instruction),
    scalar("passage_title", section.passage_title),
    scalar("section_sort_order", section.sort_order),
    jsonBlock("module_raw_data_json", testModule.raw_data ?? {}),
    jsonBlock("section_raw_data_json", section.raw_data ?? {}),
    jsonBlock("questions_json", questions),
    jsonBlock("answers_json", answers),
    jsonBlock("assets_json", assets),
    "---",
    "",
  ].join("\n");

  return `${frontmatter}${section.passage_text ?? ""}\n`;
}

function scalar(key, value) {
  if (value === null || value === undefined) return `${key}: null`;
  if (typeof value === "number" || typeof value === "boolean") return `${key}: ${value}`;
  return `${key}: ${JSON.stringify(value)}`;
}

function jsonBlock(key, value) {
  const json = JSON.stringify(value, null, 2);
  return `${key}: |\n${json.split("\n").map((line) => `  ${line}`).join("\n")}`;
}
