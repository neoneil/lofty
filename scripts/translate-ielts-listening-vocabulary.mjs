import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config({ path: ".env.local", quiet: true });

const MODEL = process.env.OPENAI_TRANSLATION_MODEL || "gpt-4o-mini";
const DOCUMENT_PATH = path.join(process.cwd(), "content", "ielts", "vocabulary", "listening", "scene-vocabulary.json");
const force = process.argv.includes("--force");

if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is missing.");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 120000 });

function parseJsonObject(value) {
  try {
    return JSON.parse(value);
  } catch {
    const match = value.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("OpenAI response did not contain a JSON object.");
    return JSON.parse(match[0]);
  }
}

async function translateScene(scene) {
  const items = scene.items.filter((item) => force || !item.translation);
  if (items.length === 0) return { updated: 0, skipped: scene.items.length };

  const completion = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "你是雅思听力词汇老师。把英文单词或短语翻译成简洁、准确、适合雅思听力场景记忆的中文释义。只返回 JSON 对象，key 必须原样使用英文词条，value 是中文释义，不要解释。",
      },
      {
        role: "user",
        content: JSON.stringify({
          scene: scene.title,
          section: scene.sectionTitle,
          terms: items.map((item) => item.term),
          rules: [
            "中文释义要短，通常 2-10 个汉字或一个短语。",
            "专有地名只给常用中文译名，例如 Melbourne -> 墨尔本。",
            "英式/美式同义词保留一个合并释义，例如 lift / elevator -> 电梯。",
            "不要把场景名当作释义。",
          ],
        }),
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error(`Empty translation response for ${scene.sceneCode}`);

  const translations = parseJsonObject(content);
  let updated = 0;

  for (const item of items) {
    const translation = translations[item.term];
    if (typeof translation === "string" && translation.trim()) {
      item.translation = translation.trim();
      updated += 1;
    }
  }

  return { updated, skipped: scene.items.length - items.length };
}

const document = JSON.parse(readFileSync(DOCUMENT_PATH, "utf8"));
let totalUpdated = 0;

for (const scene of document.scenes) {
  console.log(`Translating ${scene.sceneCode} ${scene.title}...`);
  const result = await translateScene(scene);
  totalUpdated += result.updated;
  console.log(`  updated=${result.updated} skipped=${result.skipped}`);
  writeFileSync(DOCUMENT_PATH, `${JSON.stringify(document, null, 2)}\n`, "utf8");
}

document.updatedAt = new Date().toISOString();
writeFileSync(DOCUMENT_PATH, `${JSON.stringify(document, null, 2)}\n`, "utf8");
console.log(`Done. Updated translations: ${totalUpdated}`);

const missing = document.scenes.flatMap((scene) => scene.items
  .filter((item) => !item.translation)
  .map((item) => `${scene.sceneCode} ${scene.title} #${item.number} ${item.term}`));
console.log(`Missing translations: ${missing.length}`);
for (const item of missing) console.log(`  ${item}`);
