import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local", quiet: true });

const BANK_PATH = path.join(process.cwd(), "content", "ielts", "writing-task1-bank.json");
const ANSWERS_PATH = path.join(process.cwd(), "content", "ielts", "writing-task1-model-answers.json");
const MODEL = process.env.IELTS_TASK1_MODEL_ANSWER_MODEL || process.env.OPENAI_MODEL || "gpt-5.4";

const args = new Set(process.argv.slice(2));
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const onlyArg = process.argv.find((arg) => arg.startsWith("--only="));
const limit = limitArg ? Number(limitArg.split("=", 2)[1]) : Infinity;
const onlyId = onlyArg ? onlyArg.split("=", 2)[1] : "";
const force = args.has("--force");

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is missing. Add it to .env.local or the shell environment.");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function imageDataUrl(publicPath) {
  const imagePath = path.join(process.cwd(), "public", publicPath.replace(/^\//, ""));
  const ext = path.extname(imagePath).slice(1).toLowerCase();
  const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png";
  const data = fs.readFileSync(imagePath).toString("base64");
  return `data:${mime};base64,${data}`;
}

function modelAnswerPrompt(item) {
  return [
    `Write one original IELTS Academic Writing Task 1 Band 9 model answer for this chart/image.`,
    `Item: Cambridge IELTS ${item.bookNumber}, Test ${item.testNumber}, Writing Task 1.`,
    `Requirements:`,
    `- Use English only.`,
    `- 160-190 words. Do not exceed 200 words.`,
    `- No title, no bullet points, no markdown.`,
    `- Include a clear overview.`,
    `- Accurately describe the visual information in the image; do not invent unsupported figures.`,
    `- Use natural IELTS Academic Task 1 style, suitable as a student-facing model answer.`,
  ].join("\n");
}

async function generateModelAnswer(item) {
  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: "You are a senior IELTS Academic Writing examiner and teacher. Produce precise, natural Band 9 Task 1 model answers based only on the supplied task image.",
      },
      {
        role: "user",
        content: [
          { type: "text", text: modelAnswerPrompt(item) },
          { type: "image_url", image_url: { url: imageDataUrl(item.image) } },
        ],
      },
    ],
  });

  const answer = completion.choices[0]?.message?.content?.trim();
  if (!answer) throw new Error("Empty response from OpenAI");
  return answer.replace(/^["']|["']$/g, "").trim();
}

const bank = readJson(BANK_PATH, { items: [] });
const answers = readJson(ANSWERS_PATH, { updatedAt: "", items: {} });
answers.items ||= {};

const candidates = [...bank.items]
  .sort((a, b) => a.sortOrder - b.sortOrder)
  .filter((item) => !onlyId || item.id === onlyId)
  .filter((item) => force || !answers.items[item.id]?.modelAnswer?.trim())
  .slice(0, Number.isFinite(limit) ? limit : undefined);

console.log(`model=${MODEL}`);
console.log(`candidates=${candidates.length}`);

for (const [index, item] of candidates.entries()) {
  const label = `${item.id} (${index + 1}/${candidates.length})`;
  console.log(`generating ${label}`);
  try {
    const modelAnswer = await generateModelAnswer(item);
    const updatedAt = new Date().toISOString();
    answers.items[item.id] = { id: item.id, modelAnswer, updatedAt };
    answers.updatedAt = updatedAt;
    writeJson(ANSWERS_PATH, answers);
    console.log(`saved ${label} words=${modelAnswer.split(/\s+/).filter(Boolean).length}`);
  } catch (error) {
    console.error(`failed ${label}:`, error instanceof Error ? error.message : error);
    writeJson(ANSWERS_PATH, answers);
    process.exitCode = 1;
    break;
  }
}
