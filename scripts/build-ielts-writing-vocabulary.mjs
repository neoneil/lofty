import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const SOURCE_FILE_NAME = `【2】${String.fromCharCode(0x987e, 0x5bb6, 0x5317)}词伙整理.pdf`;
const SOURCE_PDF = path.join("/mnt/c/BaiduNetdiskDownload/雅思写作大全", SOURCE_FILE_NAME);
const FALLBACK_PDF = path.join(process.cwd(), "tmp", "pdfs", "gjb-writing-collocations.pdf");
const OUTPUT_PATH = path.join(process.cwd(), "content", "ielts", "vocabulary", "writing", "gujiabei-collocations.json");
const DISPLAY_SOURCE_PATH = "雅思写作大全/【2】写作词伙整理.pdf";

const categoryTitles = {
  1: "城市化",
  2: "青少年犯罪",
  3: "工作类",
  4: "环境类",
  5: "教育类",
  6: "科技、人工智能",
  7: "政府类",
  8: "全球化",
  9: "生活方式、人口老龄化",
  10: "文化艺术、娱乐",
};

const categorySlugs = {
  1: "urbanisation",
  2: "youth-crime",
  3: "work-career",
  4: "environment",
  5: "education",
  6: "technology-ai",
  7: "government",
  8: "globalisation",
  9: "lifestyle-ageing",
  10: "culture-entertainment",
};

function normalizeSpaces(value) {
  return value.replace(/\u0000/g, "").replace(/[ \t]+/g, " ").trim();
}

function cleanEnglish(value) {
  return normalizeSpaces(value)
    .replace(/_+/g, "")
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s*;\s*/g, "; ")
    .replace(/\s*\/\s*/g, " / ")
    .replace(/\s*=\s*/g, " = ")
    .replace(/\s{2,}/g, " ")
    .replace(/^[-_—]+/, "")
    .trim();
}

function cleanChinese(value) {
  return normalizeSpaces(value)
    .replace(/[_—]\s*份/g, "一份")
    .replace(/[_—]\s*种/g, "一种")
    .replace(/[_—]\s*贯/g, "一贯")
    .replace(/[_—]\s*个/g, "一个")
    .replace(/—份/g, "一份")
    .replace(/—种/g, "一种")
    .replace(/—贯/g, "一贯")
    .replace(/—个/g, "一个")
    .replace(/_个/g, "一个")
    .replace(/釆/g, "采")
    .replace(/増/g, "增")
    .replace(/投拆/g, "投诉")
    .replace(/间题/g, "问题")
    .replace(/逢筑/g, "建筑")
    .replace(/髙/g, "高")
    .replace(/剌激/g, "刺激")
    .replace(/\s+/g, "")
    .trim();
}

function hasChinese(value) {
  return /[\u3400-\u9fff]/.test(value);
}

function hasLatin(value) {
  return /[A-Za-z]/.test(value);
}

function splitMixedToken(token) {
  const value = normalizeSpaces(token);
  const firstChineseIndex = [...value].findIndex((char) => /[\u3400-\u9fff]/.test(char));
  if (firstChineseIndex > 0 && /[A-Za-z]/.test(value.slice(0, firstChineseIndex))) {
    return [value.slice(0, firstChineseIndex).trim(), value.slice(firstChineseIndex).trim()].filter(Boolean);
  }
  return [value];
}

function categoryFromToken(token, nextToken) {
  const joined = `${token}${nextToken?.startsWith("、") ? nextToken : ""}`;
  const match = joined.match(/^(\d{1,2})、(.+)$/);
  if (!match) return null;
  const number = Number(match[1]);
  if (!categoryTitles[number]) return null;
  return {
    number,
    title: categoryTitles[number],
    consumedNext: Boolean(nextToken?.startsWith("、")),
  };
}

function isMetadataToken(token) {
  if (!token) return true;
  if (/^\d+$/.test(token)) return false;
  if (/^第\s*\d+\s*页/.test(token)) return true;
  if (token.includes(String.fromCharCode(0x987e, 0x5bb6, 0x5317)) || /词伙整理|公众号|微信/.test(token)) return true;
  if (/^Page\s+\d+/i.test(token)) return true;
  return false;
}

function shouldKeepEntry(term, translation) {
  if (!term || !translation) return false;
  if (!hasLatin(term) || !hasChinese(translation)) return false;
  if (term.length < 2 || term.length > 120) return false;
  if (/^[\W\d_]+$/.test(term)) return false;
  return true;
}

function createEntry(category, term, translation) {
  const cleanedTerm = cleanEnglish(term);
  const cleanedTranslation = cleanChinese(translation);
  if (!shouldKeepEntry(cleanedTerm, cleanedTranslation)) return;
  const duplicate = category.items.some((item) => item.term.toLowerCase() === cleanedTerm.toLowerCase());
  if (duplicate) return;
  category.items.push({
    number: category.items.length + 1,
    term: cleanedTerm,
    translation: cleanedTranslation,
    itemType: /[\s,;/()=.-]/.test(cleanedTerm) ? "Phrase" : "Word",
    starred: /[\s,;/()=.-]/.test(cleanedTerm),
    raw: `${cleanedTerm} ${cleanedTranslation}`,
  });
}

async function extractTokens(pdfPath) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(readFileSync(pdfPath));
  const document = await pdfjs.getDocument({ data, disableWorker: true }).promise;
  const tokens = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    for (const item of content.items) {
      const raw = normalizeSpaces(item.str ?? "");
      if (!raw) continue;
      for (const token of splitMixedToken(raw)) {
        const cleaned = normalizeSpaces(token);
        if (cleaned && !isMetadataToken(cleaned)) tokens.push(cleaned);
      }
    }
  }

  return tokens;
}

function buildFromTokens(tokens, sourcePath) {
  const categories = Object.entries(categoryTitles).map(([number, title]) => ({
    id: `ielts-writing-${number}`,
    categoryNumber: Number(number),
    slug: categorySlugs[Number(number)],
    title,
    sourcePdf: {
      relativePath: DISPLAY_SOURCE_PATH,
      size: statSync(sourcePath).size,
    },
    itemCount: 0,
    items: [],
  }));
  const categoryByNumber = new Map(categories.map((category) => [category.categoryNumber, category]));
  let currentCategory = null;
  let pendingTerm = "";
  let pendingTranslation = "";

  function flush() {
    if (!currentCategory) return;
    createEntry(currentCategory, pendingTerm, pendingTranslation);
    pendingTerm = "";
    pendingTranslation = "";
  }

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    const category = categoryFromToken(token, tokens[index + 1]);

    if (category) {
      flush();
      currentCategory = categoryByNumber.get(category.number) ?? null;
      if (category.consumedNext) index += 1;
      const rest = token.replace(/^\d{1,2}、.+$/, "").trim();
      if (rest) pendingTerm = rest;
      continue;
    }

    if (!currentCategory) continue;
    if (/^\d+$/.test(token) || token.startsWith("、")) continue;

    if (hasLatin(token) && hasChinese(token)) {
      const pieces = splitMixedToken(token);
      if (pieces.length === 2) {
        flush();
        pendingTerm = pieces[0];
        pendingTranslation = pieces[1];
        continue;
      }
    }

    if (hasLatin(token)) {
      flush();
      pendingTerm = token;
      pendingTranslation = "";
    } else if (hasChinese(token)) {
      pendingTranslation = `${pendingTranslation}${token}`;
    }
  }

  flush();

  for (const category of categories) {
    category.itemCount = category.items.length;
  }

  const wordCount = categories.reduce((total, category) => total + category.itemCount, 0);
  const createdAt = "2026-08-05T00:00:00.000Z";

  return {
    id: "ielts-writing-gujiabei-collocations",
    slug: "gujiabei-collocations",
    title: "雅思大作文词汇搭配",
    subtitle: "按城市化、犯罪、工作、环境、教育、科技、政府、全球化、生活方式和文化艺术整理的写作词伙。",
    exam: "IELTS",
    skill: "Writing",
    category: "Vocabulary",
    createdAt,
    updatedAt: createdAt,
    sourcePdf: DISPLAY_SOURCE_PATH,
    wordCount,
    categoryCount: categories.length,
    categories,
  };
}

const sourcePath = statSync(SOURCE_PDF, { throwIfNoEntry: false }) ? SOURCE_PDF : FALLBACK_PDF;
const tokens = await extractTokens(sourcePath);
const document = buildFromTokens(tokens, sourcePath);

mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, `${JSON.stringify(document, null, 2)}\n`, "utf8");

console.log(`Wrote ${OUTPUT_PATH}`);
console.log(`Categories: ${document.categoryCount}`);
console.log(`Items: ${document.wordCount}`);
for (const category of document.categories) console.log(`${category.categoryNumber}. ${category.title}: ${category.itemCount}`);
