import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

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
const serviceKey = env.SUPABASE_SECRET_KEY;

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

function getUrlsFromValue(value) {
  const urls = [];
  const walk = (node) => {
    if (!node) return;
    if (typeof node === "string") {
      for (const match of node.matchAll(/https?:\/\/[^"'<>\s)]+/g)) urls.push(match[0]);
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (typeof node === "object") {
      Object.values(node).forEach(walk);
    }
  };
  walk(value);
  return unique(urls);
}

function classifyAsset(url) {
  const clean = url.split("?")[0].toLowerCase();
  if (/\.(mp3|m4a|wav|aac|ogg|flac)$/.test(clean)) return "audio";
  if (/\.(png|jpe?g|webp|gif|svg)$/.test(clean)) return "image";
  if (/\.pdf$/.test(clean)) return "pdf";
  if (/\.json$/.test(clean)) return "json";
  return "other";
}

function extFromUrl(url, fallback) {
  const clean = url.split("?")[0];
  const ext = clean.includes(".") ? clean.slice(clean.lastIndexOf(".") + 1).toLowerCase() : "";
  return ext && ext.length <= 8 ? ext : fallback;
}

async function uploadRemoteAsset(url, storagePath) {
  const source = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(45000) });
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
    signal: AbortSignal.timeout(45000),
  });
  const uploadText = await upload.text();
  if (!upload.ok) throw new Error(`Upload failed ${upload.status}: ${storagePath} ${uploadText.slice(0, 200)}`);
  return { contentType, bytes: bytes.length };
}

function getQuestionRange(section, questions) {
  const nums = questions.map((q) => Number(q.questionNo || q.sort)).filter(Number.isFinite);
  if (!nums.length) return { start: 0, end: 0 };
  return { start: Math.min(...nums), end: Math.max(...nums) };
}

function getModuleType(classify) {
  if (classify === 1) return "listening";
  if (classify === 2) return "reading";
  return "writing";
}

async function fetchWinJson(url) {
  const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0", referer: "https://www.winielts.com/ielts-cbt" } });
  const json = await res.json();
  if (json.code !== 0) throw new Error(`WinIELTS API error ${url}: ${JSON.stringify(json).slice(0, 200)}`);
  return json.data;
}

async function main() {
  const stats = {
    sections: 0,
    questions: 0,
    answers: 0,
    assets: 0,
    uploadedAssets: 0,
    rawJsonAssets: 0,
  };

  const home = await fetchWinJson("https://www.winielts.com/api/exam/home");
  const book = home.bookList.find((item) => item.id === 21);
  if (!book) throw new Error("Cambridge IELTS 21 not found in source API");
  const papers = book.paperList.slice().sort((a, b) => Number(a.paperNumber.replace(/\D/g, "")) - Number(b.paperNumber.replace(/\D/g, "")));

  const [bookRow] = await select("cambridge_books", "?book_number=eq.21&select=id,book_number,title");
  if (!bookRow) throw new Error("ielts.cambridge_books book_number=21 not found");
  const tests = await select("tests", `?book_id=eq.${bookRow.id}&select=id,test_number,title`);
  const modules = await select("test_modules", `?select=id,test_id,module_type,title`);
  const testsByNumber = new Map(tests.map((test) => [test.test_number, test]));
  const modulesByTestAndType = new Map(modules.map((module) => [`${module.test_id}:${module.module_type}`, module]));

  const testIds = tests.map((test) => test.id);
  const moduleIds = modules.filter((module) => testIds.includes(module.test_id)).map((module) => module.id);
  if (moduleIds.length) {
    await remove("sections", `?module_id=in.(${moduleIds.join(",")})`);
    const existingSections = await select("sections", `?module_id=in.(${moduleIds.join(",")})&select=id`);
    const sectionIds = existingSections.map((section) => section.id);
    if (sectionIds.length) await remove("sections", `?id=in.(${sectionIds.join(",")})`);
    console.log(`Cleaned existing IELTS 21 sections: ${sectionIds.length}`);
  }
  await remove("assets", "?storage_path=like.21/*");

  const assetRows = [];

  for (const paper of papers) {
    const testNumber = Number(paper.paperNumber.replace(/\D/g, ""));
    if (!testNumber || testNumber < 1 || testNumber > 4) continue;
    const test = testsByNumber.get(testNumber);
    if (!test) throw new Error(`Missing local test row for Test ${testNumber}`);

    for (const classify of [1, 2, 3]) {
      const moduleType = getModuleType(classify);
      console.log(`Importing IELTS 21 Test ${testNumber} ${moduleType}...`);
      const module = modulesByTestAndType.get(`${test.id}:${moduleType}`);
      if (!module) throw new Error(`Missing local module row for Test ${testNumber} ${moduleType}`);
      const sourceUrl = `https://www.winielts.com/api/paper/exam/queryByIdAndClassify?id=${paper.id}&classify=${classify}&type=1`;
      const data = await fetchWinJson(sourceUrl);
      console.log(`  source sections: ${data.length}`);
      const basePath = `21/test-${testNumber}/${moduleType}`;

      const rawStoragePath = `${basePath}/raw.json`;
      await fetch(`${storageUrl}/ielts/${rawStoragePath}`, {
        method: "POST",
        headers: {
          ...headers,
          "content-type": "application/json",
          "x-upsert": "true",
        },
        body: JSON.stringify(data, null, 2),
      });
      assetRows.push({
        book_id: bookRow.id,
        test_id: test.id,
        module_id: module.id,
        asset_type: "json",
        bucket: "ielts",
        storage_path: rawStoragePath,
        public_url: `${supabaseUrl}/storage/v1/object/public/ielts/${rawStoragePath}`,
        mime_type: "application/json",
        metadata: { source_url: sourceUrl, source_paper_id: paper.id, classify },
      });
      stats.rawJsonAssets += 1;

      const sectionRows = data.map((part, index) => ({
        module_id: module.id,
        section_number: index + 1,
        title: part.title || `${moduleType} section ${index + 1}`,
        instruction: part.desc || null,
        passage_title: null,
        passage_text: moduleType === "reading" ? part.content || null : null,
        sort_order: index + 1,
        raw_data: part,
      }));
      const insertedSections = await insert("sections", sectionRows, { upsert: true, onConflict: "module_id,section_number" });
      stats.sections += insertedSections.length;
      console.log(`  inserted sections: ${insertedSections.length}`);
      const insertedSectionIds = insertedSections.map((section) => section.id);
      if (insertedSectionIds.length) await remove("questions", `?section_id=in.(${insertedSectionIds.join(",")})`);

      for (let partIndex = 0; partIndex < data.length; partIndex += 1) {
        const part = data[partIndex];
        const section = insertedSections[partIndex];
        const sectionQuestions = [];

        for (const page of part.pages || []) {
          for (const sourceSection of page.sections || []) {
            const questions = sourceSection.questions || [];
            const range = getQuestionRange(sourceSection, questions);
            sectionQuestions.push({
              section_id: section.id,
              question_number_start: range.start || (sectionQuestions.length + 1),
              question_number_end: range.end || null,
              question_type: `${sourceSection.realType || sourceSection.type || page.realType || page.type || "unknown"}`,
              prompt: page.title || sourceSection.title || part.title || null,
              instruction: page.desc || sourceSection.desc || part.desc || null,
              content: {
                part_title: part.title,
                part_content: part.content || null,
                page_title: page.title || null,
                page_desc: page.desc || null,
                page_content: page.content || null,
                section_title: sourceSection.title || null,
                section_desc: sourceSection.desc || null,
                writing_list: part.writingList || [],
                questions,
              },
              options: sourceSection.options || [],
              sort_order: sectionQuestions.length + 1,
              raw_data: { part, page, section: sourceSection },
            });
          }
        }

        if (!sectionQuestions.length) {
          sectionQuestions.push({
            section_id: section.id,
            question_number_start: partIndex + 1,
            question_number_end: null,
            question_type: moduleType === "writing" ? "writing_task" : "section",
            prompt: part.title || null,
            instruction: part.desc || null,
            content: {
              part_title: part.title,
              part_content: part.content || null,
              writing_list: part.writingList || [],
              pages: part.pages || [],
            },
            options: [],
            sort_order: 1,
            raw_data: part,
          });
        }

        const insertedQuestions = await insert("questions", sectionQuestions);
        stats.questions += insertedQuestions.length;

        const answerRows = insertedQuestions.map((question, index) => {
          const source = sectionQuestions[index].raw_data?.section || sectionQuestions[index].raw_data || {};
          const answers = (source.questions || []).map((item) => ({
            question_no: item.questionNo || item.sort || null,
            title: item.title || null,
            answer_id: item.answerId || null,
            answer_value: item.answerValue || null,
            option_ids: item.optionIds || null,
            answer_explain: item.answerExplain || null,
          }));
          return {
            question_id: question.id,
            answer_data: {
              answers,
              options: source.options || [],
            },
            explanation: answers.map((item) => item.answer_explain).filter(Boolean).join("\n\n") || null,
            raw_data: source,
          };
        });
        const insertedAnswers = await insert("answers", answerRows, { upsert: true, onConflict: "question_id" });
        stats.answers += insertedAnswers.length;
      }
      console.log(`  inserted question groups so far: ${stats.questions}`);

      const mediaUrls = unique([
        ...data.flatMap((part) => [part.audio, part.analysisAudio]),
        ...getUrlsFromValue(data),
      ]).filter((url) => /^https?:\/\//i.test(url));

      for (const url of mediaUrls) {
        const type = classifyAsset(url);
        if (!["audio", "image", "pdf", "other"].includes(type)) continue;
        const ext = extFromUrl(url, type === "audio" ? "mp3" : type === "image" ? "png" : "bin");
        const nameBase = url.split("?")[0].split("/").pop()?.replace(/[^a-zA-Z0-9_.-]/g, "-") || `asset.${ext}`;
        const storagePath = `${basePath}/${type}/${nameBase}`;
        let uploaded = null;
        try {
          console.log(`  uploading ${type}: ${storagePath}`);
          uploaded = await uploadRemoteAsset(url, storagePath);
          stats.uploadedAssets += 1;
        } catch (error) {
          console.warn(`  asset skipped: ${url} (${error.message || error})`);
          uploaded = { contentType: null, bytes: 0, error: String(error.message || error) };
        }
        assetRows.push({
          book_id: bookRow.id,
          test_id: test.id,
          module_id: module.id,
          asset_type: type,
          bucket: "ielts",
          storage_path: storagePath,
          public_url: `${supabaseUrl}/storage/v1/object/public/ielts/${storagePath}`,
          mime_type: uploaded.contentType,
          metadata: { source_url: url, source_paper_id: paper.id, classify, bytes: uploaded.bytes, error: uploaded.error || null },
        });
      }
    }
  }

  if (assetRows.length) {
    const insertedAssets = await insert("assets", assetRows, { upsert: true, onConflict: "bucket,storage_path" });
    stats.assets = insertedAssets.length;
  }

  console.log(JSON.stringify(stats, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
