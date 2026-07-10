import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const DEFAULT_BOOKS = [15, 14, 13, 12, 11, 10, 9, 8, 7];
const ALLOWED_BOOKS = new Set(DEFAULT_BOOKS);
const SOURCE_BASE_URL = "https://www.winielts.com";

const MODULE_SOURCES = [
  { moduleType: "listening", topicType: 1, pattern: 1 },
  { moduleType: "reading", topicType: 3, pattern: 3 },
];

function readEnv() {
  const envPath = path.join(root, ".env.local");
  const env = {};
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line.includes("=") || line.trim().startsWith("#")) continue;
    const index = line.indexOf("=");
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    env[key] = value;
  }
  return env;
}

const env = readEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY");
}

const restUrl = `${supabaseUrl}/rest/v1`;
const storageUrl = `${supabaseUrl}/storage/v1/object`;
const headers = {
  apikey: serviceKey,
  authorization: `Bearer ${serviceKey}`,
};

function restHeaders(schema = "ielts") {
  return {
    ...headers,
    "content-type": "application/json",
    "accept-profile": schema,
    "content-profile": schema,
  };
}

async function requestJson(url, init = {}) {
  const res = await fetch(url, init);
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  if (!res.ok) {
    throw new Error(`${init.method || "GET"} ${url} failed ${res.status}: ${text.slice(0, 300)}`);
  }
  return json;
}

async function select(table, query = "") {
  return requestJson(`${restUrl}/${table}${query}`, { headers: restHeaders() });
}

async function insert(table, rows, { upsert = false, onConflict = "" } = {}) {
  if (!rows.length) return [];
  const query = upsert && onConflict ? `?on_conflict=${encodeURIComponent(onConflict)}` : "";
  return requestJson(`${restUrl}/${table}${query}`, {
    method: "POST",
    headers: {
      ...restHeaders(),
      prefer: upsert ? "resolution=merge-duplicates,return=representation" : "return=representation",
    },
    body: JSON.stringify(rows),
  });
}

async function remove(table, query) {
  return requestJson(`${restUrl}/${table}${query}`, {
    method: "DELETE",
    headers: {
      ...restHeaders(),
      prefer: "return=minimal",
    },
  });
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function sourceUrl(pathname, params) {
  const url = new URL(pathname, SOURCE_BASE_URL);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  return url.toString();
}

function normalizeSourceUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("/")) return new URL(value, SOURCE_BASE_URL).toString();
  return value;
}

async function fetchWinJson(url) {
  const res = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0",
      referer: `${SOURCE_BASE_URL}/question/category`,
    },
    signal: AbortSignal.timeout(45000),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Source API returned non-JSON ${url}: ${text.slice(0, 200)}`);
  }
  if (json.code !== 0) throw new Error(`WinIELTS API error ${url}: ${JSON.stringify(json).slice(0, 300)}`);
  return json.data;
}

function listFromData(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.list)) return data.list;
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(data?.rows)) return data.rows;
  return [];
}

function extFromUrl(url, fallback) {
  const clean = url.split("?")[0];
  const ext = clean.includes(".") ? clean.slice(clean.lastIndexOf(".") + 1).toLowerCase() : "";
  return ext && ext.length <= 8 ? ext : fallback;
}

function classifyAsset(url) {
  const clean = url.split("?")[0].toLowerCase();
  if (/\.(mp3|m4a|wav|aac|ogg|flac)$/.test(clean)) return "audio";
  if (/\.(png|jpe?g|webp|gif|svg)$/.test(clean)) return "image";
  if (/\.pdf$/.test(clean)) return "pdf";
  if (/\.json$/.test(clean)) return "json";
  return "other";
}

function assetFileName(url, fallbackName) {
  const parsed = new URL(url);
  const fromUrl = parsed.pathname.split("/").pop() || fallbackName;
  return fromUrl.replace(/[^a-zA-Z0-9_.-]/g, "-") || fallbackName;
}

async function uploadJson(storagePath, data) {
  const body = JSON.stringify(data, null, 2);
  const upload = await fetch(`${storageUrl}/ielts/${storagePath}`, {
    method: "POST",
    headers: {
      ...headers,
      "content-type": "application/json",
      "x-upsert": "true",
    },
    body,
    signal: AbortSignal.timeout(60000),
  });
  const uploadText = await upload.text();
  if (!upload.ok) throw new Error(`Upload JSON failed ${upload.status}: ${storagePath} ${uploadText.slice(0, 200)}`);
  return { contentType: "application/json", bytes: Buffer.byteLength(body) };
}

async function uploadRemoteAsset(url, storagePath) {
  const source = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(180000) });
  if (!source.ok) throw new Error(`Download asset failed ${source.status}: ${url}`);
  const contentType = source.headers.get("content-type") || "application/octet-stream";
  const bytes = Buffer.from(await source.arrayBuffer());
  const upload = await fetch(`${storageUrl}/ielts/${storagePath}`, {
    method: "POST",
    headers: {
      ...headers,
      "content-type": contentType,
      "x-upsert": "true",
    },
    body: bytes,
    signal: AbortSignal.timeout(180000),
  });
  const uploadText = await upload.text();
  if (!upload.ok) throw new Error(`Upload failed ${upload.status}: ${storagePath} ${uploadText.slice(0, 200)}`);
  return { contentType, bytes: bytes.length };
}

function getQuestionRange(theme) {
  const nums = asArray(theme.trunkList).map((item) => Number(item.serial)).filter(Number.isFinite);
  if (!nums.length) return { start: 0, end: 0 };
  return { start: Math.min(...nums), end: Math.max(...nums) };
}

function answerValue(answer) {
  if (Array.isArray(answer)) return answer.map((item) => String(item)).filter(Boolean).join(" / ");
  if (answer === null || answer === undefined) return "";
  return String(answer);
}

function normalizeSectionNumber(section, index) {
  const fromSection = Number(section.sectionNum || section.section || section.part || section.partNum);
  if (Number.isFinite(fromSection) && fromSection > 0) return fromSection;
  const title = `${section.offerTitle || section.title || section.serialNumber || ""}`;
  const fromTitle = title.match(/(?:section|part|passage)\s*(\d+)/i)?.[1];
  return Number(fromTitle) || index + 1;
}

function normalizeTestNumber(section) {
  const fromField = Number(section.testNum || section.paperNum);
  if (Number.isFinite(fromField) && fromField > 0) return fromField;
  const title = `${section.offerTitle || section.title || section.serialNumber || ""}`;
  const fromTitle = title.match(/\btest\s*(\d+)/i)?.[1] || title.match(/\bt\s*(\d+)/i)?.[1];
  return Number(fromTitle) || null;
}

function collectSectionAssetUrls(detail) {
  const urls = [];
  if (typeof detail.audioUrl === "string") urls.push({ url: normalizeSourceUrl(detail.audioUrl), field: "audioUrl" });
  if (typeof detail.listenAudio === "string") urls.push({ url: normalizeSourceUrl(detail.listenAudio), field: "listenAudio" });
  for (const [themeIndex, theme] of asArray(detail.themeDomainList).entries()) {
    if (typeof theme.imageUrl === "string") urls.push({ url: normalizeSourceUrl(theme.imageUrl), field: `themeDomainList.${themeIndex}.imageUrl` });
  }
  return unique(urls.map((item) => item.url)).map((url) => urls.find((item) => item.url === url));
}

async function fetchSectionList(bookNumber, source) {
  const rowsById = new Map();
  const urls = [];
  for (let page = 1; page <= 5; page += 1) {
    const url = sourceUrl("/api/ieltsCategory/sectionList", { page, topicType: source.topicType, camNum: bookNumber });
    const data = await fetchWinJson(url);
    const rows = listFromData(data);
    urls.push(url);
    for (const row of rows) {
      rowsById.set(row.id || `${page}-${rowsById.size}`, row);
    }
    if (!rows.length || rows.length < 20) break;
  }
  return { rows: [...rowsById.values()], urls };
}

function buildQuestionRow(sectionId, theme, detail, sortOrder) {
  const range = getQuestionRange(theme);
  const questions = asArray(theme.trunkList);
  const imageUrl = normalizeSourceUrl(theme.imageUrl);
  const options = questions.flatMap((question) => asArray(question.option).map((option, optionIndex) => ({
    question_no: question.serial || null,
    value: String.fromCharCode(65 + optionIndex),
    title: option,
  })));
  return {
    section_id: sectionId,
    question_number_start: range.start || sortOrder,
    question_number_end: range.end || null,
    question_type: `${theme.questionsType || theme.type || "unknown"}`,
    prompt: theme.theme || detail.serialNumber || null,
    instruction: theme.describe || null,
    content: {
      part_title: detail.serialNumber || null,
      page_title: theme.theme || null,
      page_desc: theme.describe || null,
      page_content: theme.tableValue || (imageUrl ? `<img src="${imageUrl}" alt="${theme.theme || detail.serialNumber || "IELTS question image"}" />` : null),
      section_title: theme.questionsType || null,
      source_category_section_id: detail.id || null,
      image_url: imageUrl || null,
      questions,
    },
    options,
    sort_order: sortOrder,
    raw_data: { detail, theme },
  };
}

function buildAnswerRow(questionId, theme) {
  const answers = asArray(theme.trunkList).map((item) => ({
    question_no: item.serial || null,
    title: item.content || null,
    answer_value: answerValue(item.answer),
    answer_values: Array.isArray(item.answer) ? item.answer : item.answer === null || item.answer === undefined ? [] : [item.answer],
    answer_explain: item.answerExplain || null,
    answer_mark_time: item.answerMarkTime || [],
  }));
  return {
    question_id: questionId,
    answer_data: {
      answers,
      options: [],
    },
    explanation: answers.map((item) => item.answer_explain).filter(Boolean).join("\n\n") || null,
    raw_data: theme,
  };
}

async function main() {
  const targetBooks = process.argv.slice(2).length ? process.argv.slice(2).map(Number) : DEFAULT_BOOKS;
  const invalid = targetBooks.filter((bookNumber) => !ALLOWED_BOOKS.has(bookNumber));
  if (invalid.length) throw new Error(`Unsupported IELTS category book number(s): ${invalid.join(", ")}`);

  const stats = {
    books: targetBooks,
    sourceSections: 0,
    sections: 0,
    questions: 0,
    answers: 0,
    assets: 0,
    uploadedAssets: 0,
    skippedAssets: 0,
    rawJsonAssets: 0,
  };

  const books = await select("cambridge_books", `?book_number=in.(${targetBooks.join(",")})&select=id,book_number,title`);
  const bookByNumber = new Map(books.map((book) => [book.book_number, book]));
  for (const bookNumber of targetBooks) {
    if (!bookByNumber.has(bookNumber)) throw new Error(`ielts.cambridge_books book_number=${bookNumber} not found. Run the seed migration first.`);
  }

  const tests = await select("tests", `?book_id=in.(${books.map((book) => book.id).join(",")})&select=id,book_id,test_number,title`);
  const modules = await select("test_modules", `?test_id=in.(${tests.map((test) => test.id).join(",")})&select=id,test_id,module_type,title`);
  const testsByBookAndNumber = new Map(tests.map((test) => [`${test.book_id}:${test.test_number}`, test]));
  const modulesByTestAndType = new Map(modules.map((module) => [`${module.test_id}:${module.module_type}`, module]));

  const targetModuleIds = modules.filter((module) => MODULE_SOURCES.some((source) => source.moduleType === module.module_type)).map((module) => module.id);
  if (targetModuleIds.length) {
    await remove("sections", `?module_id=in.(${targetModuleIds.join(",")})`);
    console.log(`Cleaned existing category sections for modules: ${targetModuleIds.length}`);
  }
  for (const bookNumber of targetBooks) {
    await remove("assets", `?storage_path=like.${bookNumber}/*`);
  }

  for (const bookNumber of targetBooks) {
    const book = bookByNumber.get(bookNumber);
    console.log(`Importing Cambridge IELTS ${bookNumber} category library...`);

    for (const source of MODULE_SOURCES) {
      const { rows: sourceSections, urls: sectionListUrls } = await fetchSectionList(bookNumber, source);
      stats.sourceSections += sourceSections.length;
      console.log(`  ${source.moduleType}: ${sourceSections.length} source sections`);

      for (const [sectionIndex, sourceSection] of sourceSections.entries()) {
        const testNumber = normalizeTestNumber(sourceSection);
        if (!testNumber || testNumber < 1 || testNumber > 4) {
          console.warn(`  skipped ${source.moduleType} section without test number: ${JSON.stringify(sourceSection).slice(0, 180)}`);
          continue;
        }

        const test = testsByBookAndNumber.get(`${book.id}:${testNumber}`);
        if (!test) throw new Error(`Missing local test row for book ${bookNumber} test ${testNumber}`);
        const testModule = modulesByTestAndType.get(`${test.id}:${source.moduleType}`);
        if (!testModule) throw new Error(`Missing local module row for book ${bookNumber} test ${testNumber} ${source.moduleType}`);

        const sectionNumber = normalizeSectionNumber(sourceSection, sectionIndex);
        const detailUrl = sourceUrl("/api/ieltsCategory/termPreview", { id: sourceSection.id, pattern: source.pattern });
        const detail = await fetchWinJson(detailUrl);
        const basePath = `${bookNumber}/test-${testNumber}/${source.moduleType}/section-${sectionNumber}`;

        const rawStoragePath = `${basePath}/raw.json`;
        const rawUploaded = await uploadJson(rawStoragePath, { sectionListItem: sourceSection, detail, sectionListUrls, detailUrl });
        const assetRows = [{
          book_id: book.id,
          test_id: test.id,
          module_id: testModule.id,
          section_id: null,
          question_id: null,
          asset_type: "json",
          bucket: "ielts",
          storage_path: rawStoragePath,
          public_url: `${supabaseUrl}/storage/v1/object/public/ielts/${rawStoragePath}`,
          mime_type: rawUploaded.contentType,
          metadata: { source_url: detailUrl, source_section_urls: sectionListUrls, source_section_id: sourceSection.id, bytes: rawUploaded.bytes, field: "rawJson", topic_type: source.topicType, pattern: source.pattern },
        }];
        stats.rawJsonAssets += 1;

        const sectionTitle = sourceSection.offerTitle || sourceSection.title || detail.serialNumber || `${source.moduleType} section ${sectionNumber}`;
        const [section] = await insert("sections", [{
          module_id: testModule.id,
          section_number: sectionNumber,
          title: sectionTitle,
          instruction: asArray(detail.themeDomainList)[0]?.describe || null,
          passage_title: detail.serialNumber || sectionTitle,
          passage_text: source.moduleType === "reading" ? null : null,
          sort_order: sectionNumber,
          raw_data: {
            source: "ieltsCategory",
            source_section: sourceSection,
            detail,
            topic_type: source.topicType,
            pattern: source.pattern,
            detail_url: detailUrl,
          },
        }], { upsert: true, onConflict: "module_id,section_number" });
        stats.sections += 1;
        assetRows[0].section_id = section.id;

        const themes = asArray(detail.themeDomainList);
        const questionRows = themes.length ? themes.map((theme, index) => buildQuestionRow(section.id, theme, detail, index + 1)) : [{
          section_id: section.id,
          question_number_start: sectionNumber,
          question_number_end: null,
          question_type: "section",
          prompt: sectionTitle,
          instruction: null,
          content: { source_category_section_id: detail.id || null, questions: [] },
          options: [],
          sort_order: 1,
          raw_data: { detail },
        }];
        const insertedQuestions = await insert("questions", questionRows);
        stats.questions += insertedQuestions.length;

        const answerRows = insertedQuestions.map((question, index) => buildAnswerRow(question.id, themes[index] || {}));
        const insertedAnswers = await insert("answers", answerRows, { upsert: true, onConflict: "question_id" });
        stats.answers += insertedAnswers.length;

        for (const item of collectSectionAssetUrls(detail)) {
          if (!item?.url || !/^https?:\/\//i.test(item.url)) continue;
          const type = classifyAsset(item.url);
          if (!["audio", "image", "pdf", "other"].includes(type)) continue;
          const ext = extFromUrl(item.url, type === "audio" ? "mp3" : type === "image" ? "png" : "bin");
          const storagePath = `${basePath}/${type}/${assetFileName(item.url, `${item.field}.${ext}`)}`;
          let uploaded = null;
          try {
            console.log(`    uploading ${type}: ${storagePath}`);
            uploaded = await uploadRemoteAsset(item.url, storagePath);
            stats.uploadedAssets += 1;
          } catch (error) {
            console.warn(`    asset skipped: ${item.url} (${error.message || error})`);
            uploaded = { contentType: null, bytes: 0, error: String(error.message || error) };
            stats.skippedAssets += 1;
          }
          assetRows.push({
            book_id: book.id,
            test_id: test.id,
            module_id: testModule.id,
            section_id: section.id,
            question_id: null,
            asset_type: type,
            bucket: "ielts",
            storage_path: storagePath,
            public_url: `${supabaseUrl}/storage/v1/object/public/ielts/${storagePath}`,
            mime_type: uploaded.contentType,
            metadata: { source_url: item.url, source_section_id: sourceSection.id, field: item.field, topic_type: source.topicType, pattern: source.pattern, bytes: uploaded.bytes, error: uploaded.error || null },
          });
        }

        const insertedAssets = await insert("assets", assetRows, { upsert: true, onConflict: "bucket,storage_path" });
        stats.assets += insertedAssets.length;
        console.log(`    ${source.moduleType} Test ${testNumber} Section ${sectionNumber}: ${insertedQuestions.length} groups, ${insertedAssets.length} assets`);
      }
    }
  }

  console.log(JSON.stringify(stats, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
