import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const BOOKS = [16, 17, 18, 19, 20, 21];
const TESTS = [1, 2, 3, 4];
const PARTS = [1, 2, 3];
const MODEL = process.env.OPENAI_TRANSLATION_MODEL || "gpt-4.1-mini";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY is missing.");
  process.exit(1);
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&nbsp;|&#160;|&#xA0;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

function htmlToText(html) {
  return decodeHtmlEntities(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h\d|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitSentences(text) {
  const segmenter = typeof Intl !== "undefined" && Intl.Segmenter ? new Intl.Segmenter("en", { granularity: "sentence" }) : null;
  const raw = segmenter ? [...segmenter.segment(text)].map((item) => item.segment) : text.split(/(?<=[.!?])\s+(?=[A-Z"'(])/);
  return raw
    .map((item) => item.replace(/\s+/g, " ").trim())
    .filter((item) => item.length > 8 && /[A-Za-z]/.test(item));
}

function parseMarkdown(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return null;
  return {
    frontmatter: match[1],
    body: source.slice(match[0].length),
    fullFrontmatter: match[0],
  };
}

function hasTranslation(frontmatter) {
  return /^passage_translation_json:/m.test(frontmatter);
}

function insertTranslationBlock(source, items) {
  const parsed = parseMarkdown(source);
  if (!parsed) throw new Error("Missing front matter");
  const json = JSON.stringify(items, null, 2);
  const block = `passage_translation_json: |\n${json.split("\n").map((line) => `  ${line}`).join("\n")}\n`;
  const nextFrontmatter = hasTranslation(parsed.frontmatter)
    ? parsed.frontmatter.replace(/^passage_translation_json:\s*\|\n(?:  .*\n?)*/m, block.trimEnd())
    : `${parsed.frontmatter.trimEnd()}\n${block.trimEnd()}`;
  return `---\n${nextFrontmatter}\n---\n${parsed.body}`;
}

async function translateSentences(sentences, label) {
  const items = sentences.map((sentence, index) => ({ id: `s${index + 1}`, en: sentence }));
  const response = await client.responses.create({
    model: MODEL,
    input: [
      {
        role: "system",
        content: "You are an IELTS reading teacher. Translate English reading passage sentences into clear, natural Simplified Chinese for students. Preserve names, dates, numbers, technical terms, and meaning. Return only valid JSON.",
      },
      {
        role: "user",
        content: JSON.stringify({
          task: "Translate each item.en into Simplified Chinese. Keep the same id and en. Add zh. Do not add commentary.",
          label,
          items,
        }),
      },
    ],
    text: { format: { type: "json_object" } },
  });

  const text = response.output_text;
  const parsed = JSON.parse(text);
  const translated = Array.isArray(parsed.items) ? parsed.items : [];
  const byId = new Map(translated.map((item) => [item.id, item]));
  return items.map((item) => {
    const match = byId.get(item.id);
    return {
      id: item.id,
      en: item.en,
      zh: typeof match?.zh === "string" && match.zh.trim() ? match.zh.trim() : "",
    };
  });
}

async function main() {
  const files = [];
  for (const book of BOOKS) {
    for (const test of TESTS) {
      for (const part of PARTS) {
        files.push(path.join("content", "ielts", "cambridge", String(book), `test${test}`, "reading", `part${part}.md`));
      }
    }
  }

  let done = 0;
  for (const file of files) {
    const source = await fs.readFile(file, "utf8");
    const parsed = parseMarkdown(source);
    if (!parsed) {
      console.log(`[skip] ${file}: no front matter`);
      continue;
    }
    if (hasTranslation(parsed.frontmatter)) {
      done += 1;
      console.log(`[${done}/${files.length}] skip existing ${file}`);
      continue;
    }

    const sentences = splitSentences(htmlToText(parsed.body));
    if (sentences.length === 0) {
      done += 1;
      console.log(`[${done}/${files.length}] skip empty ${file}`);
      continue;
    }

    const label = file.replaceAll(path.sep, "/");
    console.log(`[${done + 1}/${files.length}] translating ${label} (${sentences.length} sentences)`);
    const translations = await translateSentences(sentences, label);
    const missing = translations.filter((item) => !item.zh).length;
    if (missing > 0) throw new Error(`${file}: ${missing} translations missing`);

    await fs.writeFile(file, insertTranslationBlock(source, translations), "utf8");
    done += 1;
    console.log(`[${done}/${files.length}] wrote ${label}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
