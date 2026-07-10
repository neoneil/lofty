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

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function buildOptions(question) {
  const trunkList = asArray(question.raw_data?.theme?.trunkList);
  return trunkList.flatMap((trunk) => asArray(trunk.option).map((option, optionIndex) => ({
    question_no: trunk.serial || null,
    value: String.fromCharCode(65 + optionIndex),
    title: option,
  })));
}

const env = readEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) throw new Error("Missing Supabase env");

const supabase = createClient(supabaseUrl, serviceKey, { db: { schema: "ielts" } });
const books = await runQuery(supabase.from("cambridge_books").select("id, book_number").in("book_number", targetBooks));
const tests = await runQuery(supabase.from("tests").select("id, book_id").in("book_id", ids(books)));
const modules = await runQuery(supabase.from("test_modules").select("id, test_id").in("test_id", ids(tests)));
const sections = await runQuery(supabase.from("sections").select("id, module_id").in("module_id", ids(modules)));
const questions = await runQuery(supabase.from("questions").select("id, options, raw_data").in("section_id", ids(sections)));

let updated = 0;
let withOptions = 0;
for (const question of questions) {
  const options = buildOptions(question);
  if (!options.length) continue;
  withOptions += 1;
  const savedOptions = Array.isArray(question.options) ? question.options : [];
  if (savedOptions.length === options.length) continue;
  const { error } = await supabase.from("questions").update({ options }).eq("id", question.id);
  if (error) throw error;
  updated += 1;
}

console.log(`questions=${questions.length} withOptions=${withOptions} updated=${updated}`);
