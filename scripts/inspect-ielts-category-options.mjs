import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const targetBooks = process.argv.slice(2).length ? process.argv.slice(2).map(Number) : [15, 14, 13, 12, 11, 10, 9, 8, 7];

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

function optionLikeKeys(value) {
  if (!value || typeof value !== "object") return [];
  return Object.keys(value).filter((key) => /option|choice|select|answer/i.test(key));
}

function summarizeOptions(question) {
  const theme = question.raw_data?.theme ?? {};
  const trunkList = Array.isArray(theme.trunkList) ? theme.trunkList : [];
  const nestedKeys = new Set();
  for (const trunk of trunkList) {
    for (const key of optionLikeKeys(trunk)) nestedKeys.add(`trunkList.${key}`);
  }
  return {
    question_type: question.question_type,
    prompt: question.prompt,
    saved_options: Array.isArray(question.options) ? question.options.length : 0,
    theme_keys: optionLikeKeys(theme),
    trunk_keys: [...nestedKeys],
    sample_trunk: trunkList[0] ?? null,
  };
}

const env = readEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) throw new Error("Missing Supabase env");

const supabase = createClient(supabaseUrl, serviceKey, { db: { schema: "ielts" } });
const books = await runQuery(supabase.from("cambridge_books").select("id, book_number").in("book_number", targetBooks));
const tests = await runQuery(supabase.from("tests").select("id, book_id").in("book_id", ids(books)));
const modules = await runQuery(supabase.from("test_modules").select("id, test_id, module_type").in("test_id", ids(tests)));
const sections = await runQuery(supabase.from("sections").select("id, module_id").in("module_id", ids(modules)));
const questions = await runQuery(supabase.from("questions").select("id, section_id, question_type, prompt, options, raw_data").in("section_id", ids(sections)));
const candidates = questions.filter((question) => /选择|choice|multiple|single|matching/i.test(question.question_type) || optionLikeKeys(question.raw_data?.theme ?? {}).length > 0);

console.log(`questions=${questions.length} candidates=${candidates.length}`);
for (const sample of candidates.slice(0, 20).map(summarizeOptions)) {
  console.log(JSON.stringify(sample, null, 2));
}
