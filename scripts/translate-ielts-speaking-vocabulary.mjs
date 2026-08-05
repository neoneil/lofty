import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config({ path: ".env.local", quiet: true });

const MODEL = process.env.OPENAI_TRANSLATION_MODEL || "gpt-4o-mini";
const DOCUMENT_PATH = path.join(process.cwd(), "content", "ielts", "vocabulary", "speaking", "classified-vocabulary.json");
const force = process.argv.includes("--force");
const batchSizeArg = process.argv.find((arg) => arg.startsWith("--batch-size="));
const batchSize = Math.max(20, Math.min(120, Number(batchSizeArg?.split("=")[1] ?? 80)));
const maxBatchesArg = process.argv.find((arg) => arg.startsWith("--max-batches="));
const maxBatches = maxBatchesArg ? Math.max(1, Number(maxBatchesArg.split("=")[1] ?? 1)) : Number.POSITIVE_INFINITY;
const startTopicArg = process.argv.find((arg) => arg.startsWith("--start-topic="));
const startTopic = startTopicArg ? startTopicArg.split("=")[1] : "";

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

function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
  return chunks;
}

async function translateBatch(topic, items) {
  const completion = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "你是雅思口语词汇老师。把英文单词或短语翻译成简洁、准确、适合雅思口语表达记忆的中文释义。只返回 JSON 对象，key 必须原样使用英文词条，value 是中文释义，不要解释。",
      },
      {
        role: "user",
        content: JSON.stringify({
          part: topic.partTitle,
          topic: topic.title,
          topicCode: topic.topicCode,
          terms: items.map((item) => item.term),
          rules: [
            "中文释义要短，通常 2-12 个汉字或一个短语。",
            "多个英文同义词用一个合并释义即可。",
            "人名、地名、节日名给常见中文译名；没有固定译名时保留英文并加简短说明。",
            "不要把分类名当作释义。",
          ],
        }),
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error(`Empty translation response for ${topic.topicCode}`);
  return parseJsonObject(content);
}

function save(document) {
  document.updatedAt = new Date().toISOString();
  writeFileSync(DOCUMENT_PATH, `${JSON.stringify(document, null, 2)}\n`, "utf8");
}

const document = JSON.parse(readFileSync(DOCUMENT_PATH, "utf8"));
let totalUpdated = 0;
let processedBatches = 0;

for (const topic of document.topics) {
  if (startTopic && compareTopicCode(topic.topicCode, startTopic) < 0) continue;
  const pending = topic.items.filter((item) => force || !item.translation);
  if (pending.length === 0) {
    console.log(`${topic.topicCode} ${topic.title}: skipped ${topic.items.length}`);
    continue;
  }

  console.log(`${topic.topicCode} ${topic.title}: translating ${pending.length}`);

  for (const [batchIndex, items] of chunk(pending, batchSize).entries()) {
    if (processedBatches >= maxBatches) break;
    const translations = await translateBatch(topic, items);
    let updated = 0;

    for (const item of items) {
      const translation = translations[item.term];
      if (typeof translation === "string" && translation.trim()) {
        item.translation = translation.trim();
        updated += 1;
      }
    }

    totalUpdated += updated;
    processedBatches += 1;
    save(document);
    console.log(`  batch ${batchIndex + 1}: updated ${updated}/${items.length}`);
  }

  if (processedBatches >= maxBatches) break;
}

save(document);

const missing = document.topics.flatMap((topic) => topic.items
  .filter((item) => !item.translation)
  .map((item) => `${topic.topicCode} ${topic.title} #${item.number} ${item.term}`));

console.log(`Done. Updated translations: ${totalUpdated}`);
console.log(`Processed batches: ${processedBatches}`);
console.log(`Missing translations: ${missing.length}`);
for (const item of missing.slice(0, 80)) console.log(`  ${item}`);

function compareTopicCode(a, b) {
  const [aPart, aIndex] = a.split(".").map(Number);
  const [bPart, bIndex] = b.split(".").map(Number);
  return (aPart - bPart) || (aIndex - bIndex);
}
