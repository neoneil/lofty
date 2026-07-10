import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const DEFAULT_BOOKS = [15, 14, 13, 12, 11, 10, 9, 8, 7];

function readEnv() {
  const envPath = path.join(root, ".env.local");
  const env = {};
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line.includes("=") || line.trim().startsWith("#")) continue;
    const index = line.indexOf("=");
    env[line.slice(0, index).trim()] = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
  }
  return env;
}

function ids(rows) {
  return rows.map((row) => row.id);
}

async function runQuery(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

const env = readEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY");
}

const supabase = createClient(supabaseUrl, serviceKey, { db: { schema: "ielts" } });
const targetBooks = process.argv.slice(2).length ? process.argv.slice(2).map(Number) : DEFAULT_BOOKS;

const books = await runQuery(
  supabase.from("cambridge_books").select("id, book_number").in("book_number", targetBooks).order("book_number", { ascending: false }),
);
const tests = books.length ? await runQuery(supabase.from("tests").select("id, book_id, test_number").in("book_id", ids(books))) : [];
const modules = tests.length ? await runQuery(supabase.from("test_modules").select("id, test_id, module_type").in("test_id", ids(tests))) : [];
const sections = modules.length ? await runQuery(supabase.from("sections").select("id, module_id").in("module_id", ids(modules))) : [];
const questions = sections.length ? await runQuery(supabase.from("questions").select("id, section_id").in("section_id", ids(sections))) : [];
const assets = tests.length ? await runQuery(supabase.from("assets").select("id, test_id, module_id, asset_type").in("test_id", ids(tests))) : [];

for (const book of books) {
  const bookTests = tests.filter((test) => test.book_id === book.id);
  const bookModules = modules.filter((module) => bookTests.some((test) => test.id === module.test_id));
  const bookSections = sections.filter((section) => bookModules.some((module) => module.id === section.module_id));
  const bookQuestions = questions.filter((question) => bookSections.some((section) => section.id === question.section_id));
  const bookAssets = assets.filter((asset) => bookTests.some((test) => test.id === asset.test_id));
  console.log(`C${book.book_number}: tests=${bookTests.length} modules=${bookModules.length} sections=${bookSections.length} questions=${bookQuestions.length} assets=${bookAssets.length}`);
  for (const moduleType of ["listening", "reading"]) {
    const typedModules = bookModules.filter((module) => module.module_type === moduleType);
    const typedSections = bookSections.filter((section) => typedModules.some((module) => module.id === section.module_id));
    const typedQuestions = bookQuestions.filter((question) => typedSections.some((section) => section.id === question.section_id));
    console.log(`  ${moduleType}: modules=${typedModules.length} sections=${typedSections.length} questions=${typedQuestions.length}`);
  }
}
