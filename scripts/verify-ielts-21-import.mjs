import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function readEnv() {
  const env = {};
  for (const line of fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)) {
    if (!line.includes("=") || line.trim().startsWith("#")) continue;
    const index = line.indexOf("=");
    env[line.slice(0, index).trim()] = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
  }
  return env;
}

const env = readEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SECRET_KEY;
const headers = {
  apikey: serviceKey,
  authorization: `Bearer ${serviceKey}`,
  "accept-profile": "ielts",
};

async function get(pathname) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${pathname}`, { headers });
  const text = await res.text();
  if (!res.ok) throw new Error(`${pathname} failed ${res.status}: ${text}`);
  return JSON.parse(text);
}

const [book] = await get("cambridge_books?book_number=eq.21&select=id,title");
const tests = await get(`tests?book_id=eq.${book.id}&select=id,test_number,title`);
const modules = await get(`test_modules?select=id,test_id,module_type&test_id=in.(${tests.map((test) => test.id).join(",")})`);
const sections = await get(`sections?select=id,module_id&module_id=in.(${modules.map((module) => module.id).join(",")})`);
const questions = await get(`questions?select=id,section_id&section_id=in.(${sections.map((section) => section.id).join(",")})`);
const answers = await get(`answers?select=id,question_id&question_id=in.(${questions.map((question) => question.id).join(",")})`);
const assets = await get("assets?select=id,storage_path,asset_type,metadata&storage_path=like.21/*");

const assetSummary = assets.reduce((acc, asset) => {
  acc[asset.asset_type] = (acc[asset.asset_type] || 0) + 1;
  return acc;
}, {});

const failedAssets = assets.filter((asset) => asset.metadata?.error);

console.log(JSON.stringify({
  book: book.title,
  tests: tests.length,
  modules: modules.length,
  sections: sections.length,
  questions: questions.length,
  answers: answers.length,
  assets: assets.length,
  assetSummary,
  failedAssets: failedAssets.map((asset) => asset.storage_path),
}, null, 2));
