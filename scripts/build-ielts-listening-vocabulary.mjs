import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const SOURCE_ROOT = "/mnt/c/BaiduNetdiskDownload/word版本";
const AUDIO_ROOT = "/mnt/c/BaiduNetdiskDownload/场景词汇-音频";
const OUTPUT_PATH = path.join(process.cwd(), "content", "ielts", "vocabulary", "listening", "scene-vocabulary.json");

const sceneSlugByTitle = new Map([
  ["房屋住宿", "accommodation"],
  ["旅游度假", "travel-holiday"],
  ["健康营养", "health-nutrition"],
  ["学生银行", "student-banking"],
  ["用餐饮食", "dining-food"],
  ["学术教育", "academic-education"],
  ["课程选择", "course-selection"],
  ["图书馆", "library"],
  ["电脑机房", "computer-lab"],
  ["课程研究调查", "course-research-survey"],
  ["具体授课", "lecture-teaching"],
  ["文艺演出", "arts-performance"],
  ["人物描述", "people-description"],
  ["交通工具", "transport"],
  ["气候 / 语言 / 机场", "climate-language-airport"],
  ["新闻", "news"],
  ["求职面试", "job-interview"],
  ["指路方向", "directions"],
  ["地名", "place-names"],
]);

const metadataLines = new Set([
  "Root Entry",
  "SummaryInformation",
  "DocumentSummaryInformation",
  "WordDocument",
  "CompObj",
  "MSWordDoc",
  "Word.Document.8",
  "Data",
  "0Table",
  "1Table",
  "Normal.dot",
  "Normal.wpt",
  "Microsoft Office Word",
  "Microsoft O",
  "KSOProductBuildVer",
  "Times New Roman",
  "Symbol",
  "Arial",
  "Courier New",
  "Wingdings",
  "SimSun",
  "Unknown",
  "gid",
  "gidne",
  "haz",
  "hazel",
]);

const replacements = new Map([
  ["The United States of Amercia", "The United States of America"],
  ["San Franciso", "San Francisco"],
  ["resentation", "presentation"],
  ["entrance hall (lobby, porch", "entrance hall / lobby / porch"],
]);

function normalizeSpaces(value) {
  return value.replace(/\u0000/g, "").replace(/[ \t]+/g, " ").trim();
}

function cleanTerm(value) {
  const trimmed = normalizeSpaces(value)
    .replace(/\s+\/\s+/g, " / ")
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s+\)/g, ")")
    .replace(/\(\s+/g, "(");
  return replacements.get(trimmed) ?? trimmed;
}

function isVocabularyTerm(value) {
  if (!value || value.length < 2) return false;
  if (!/[A-Za-z]/.test(value)) return false;
  if (value.replace(/[^A-Za-z]/g, "").length < 2) return false;
  if (/[\u4e00-\u9fff]/.test(value)) return false;
  if (metadataLines.has(value)) return false;
  if (/^2052-/.test(value)) return false;
  if (/^[\W\d_]+$/.test(value)) return false;
  if (/^[A-Z]&/.test(value)) return false;
  if (/Office Word|Word\.Document|KSOProductBuildVer|Normal\./.test(value)) return false;
  if (/^[A-Za-z]{1,3}$/.test(value) && metadataLines.has(value.toLowerCase())) return false;
  return true;
}

function extractDocText(filePath) {
  const result = spawnSync("strings", ["-el", filePath], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 8,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`strings failed for ${filePath}: ${result.stderr}`);

  const seen = new Set();
  return result.stdout
    .split(/\r?\n/)
    .map(cleanTerm)
    .filter(isVocabularyTerm)
    .filter((term) => {
      const key = term.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function parseSection(directoryName) {
  const match = directoryName.match(/^(\d+)\s+(.+)$/);
  if (!match) throw new Error(`Unexpected section directory: ${directoryName}`);
  return {
    sectionNumber: Number(match[1]),
    sectionTitle: match[2].trim(),
  };
}

function parseScene(fileName, sectionNumber) {
  const baseName = fileName.replace(/\.doc$/i, "").trim();
  const combinedMatch = baseName.match(/^4\s+气候\s+5\s+语言\s+6\s+机场$/);
  if (combinedMatch && sectionNumber === 3) {
    return {
      sceneNumber: 4,
      sceneCode: "3-4-5-6",
      title: "气候 / 语言 / 机场",
    };
  }

  const match = baseName.match(/^(\d+)\s+(.+)$/);
  if (!match) throw new Error(`Unexpected scene file: ${fileName}`);
  return {
    sceneNumber: Number(match[1]),
    sceneCode: `${sectionNumber}-${Number(match[1])}`,
    title: match[2].trim(),
  };
}

function itemType(term) {
  return /[\s/-]/.test(term) ? "Phrase" : "Word";
}

function findAudioFiles() {
  const files = readdirSync(AUDIO_ROOT)
    .filter((fileName) => /\.mp3$/i.test(fileName))
    .map((fileName) => ({
      fileName,
      sourcePath: path.join(AUDIO_ROOT, fileName),
      size: statSync(path.join(AUDIO_ROOT, fileName)).size,
    }));

  return new Map(files.map((file) => {
    const code = file.fileName.match(/^(\d+-\d+(?:-\d+-\d+)?)/)?.[1];
    if (!code) throw new Error(`Unexpected audio filename: ${file.fileName}`);
    return [code, file];
  }));
}

function buildDocument() {
  const audioByCode = findAudioFiles();
  const existingTranslations = readExistingTranslations();
  const scenes = [];

  for (const sectionDirectoryName of readdirSync(SOURCE_ROOT).sort((a, b) => a.localeCompare(b, "zh-Hans-CN", { numeric: true }))) {
    const sectionPath = path.join(SOURCE_ROOT, sectionDirectoryName);
    if (!statSync(sectionPath).isDirectory()) continue;
    const section = parseSection(sectionDirectoryName);

    for (const fileName of readdirSync(sectionPath).filter((name) => /\.doc$/i.test(name)).sort((a, b) => a.localeCompare(b, "zh-Hans-CN", { numeric: true }))) {
      const sourcePath = path.join(sectionPath, fileName);
      const scene = parseScene(fileName, section.sectionNumber);
      const audio = audioByCode.get(scene.sceneCode);
      const slug = sceneSlugByTitle.get(scene.title);
      if (!slug) throw new Error(`Missing slug for scene title: ${scene.title}`);

      const terms = extractDocText(sourcePath);
      scenes.push({
        id: `ielts-listening-${scene.sceneCode}`,
        sceneCode: scene.sceneCode,
        sceneNumber: scene.sceneNumber,
        sectionNumber: section.sectionNumber,
        sectionTitle: section.sectionTitle,
        title: scene.title,
        subtitle: `${section.sectionTitle} · ${scene.sceneCode}`,
        sourceDoc: {
          fileName,
          relativePath: path.relative(SOURCE_ROOT, sourcePath).replace(/\\/g, "/"),
          size: statSync(sourcePath).size,
        },
        audio: audio ? {
          fileName: audio.fileName,
          sourcePath: audio.sourcePath,
          r2Key: `ielts/listening-vocabulary/audio/${scene.sceneCode}-${slug}.mp3`,
          size: audio.size,
          contentType: "audio/mpeg",
        } : null,
        itemCount: terms.length,
        items: terms.map((term, index) => ({
          number: index + 1,
          term,
          translation: existingTranslations.get(`${scene.sceneCode}::${term.toLowerCase()}`) ?? "",
          itemType: itemType(term),
          starred: itemType(term) === "Phrase",
          raw: term,
        })),
      });
    }
  }

  const wordCount = scenes.reduce((total, scene) => total + scene.itemCount, 0);
  const createdAt = "2026-08-05T00:00:00.000Z";

  return {
    id: "ielts-listening-scene-vocabulary",
    slug: "scene-vocabulary",
    title: "雅思听力场景词汇",
    subtitle: "按校外生活、校园生活和日常生活场景整理，配套音频用于跟读和听辨。",
    exam: "IELTS",
    skill: "Listening",
    category: "Vocabulary",
    createdAt,
    updatedAt: createdAt,
    wordCount,
    sceneCount: scenes.length,
    audioCount: scenes.filter((scene) => scene.audio).length,
    sections: Array.from(new Map(scenes.map((scene) => [scene.sectionNumber, {
      sectionNumber: scene.sectionNumber,
      title: scene.sectionTitle,
      sceneCount: scenes.filter((item) => item.sectionNumber === scene.sectionNumber).length,
    }])).values()),
    scenes,
  };
}

function readExistingTranslations() {
  const translations = new Map();
  if (!existsSync(OUTPUT_PATH)) return translations;

  try {
    const existingDocument = JSON.parse(readFileSync(OUTPUT_PATH, "utf8"));
    for (const scene of existingDocument.scenes ?? []) {
      for (const item of scene.items ?? []) {
        if (item.term && item.translation) translations.set(`${scene.sceneCode}::${String(item.term).toLowerCase()}`, item.translation);
      }
    }
  } catch {
    return translations;
  }

  return translations;
}

const document = buildDocument();
mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, `${JSON.stringify(document, null, 2)}\n`, "utf8");

console.log(`Wrote ${OUTPUT_PATH}`);
console.log(`Scenes: ${document.sceneCount}`);
console.log(`Words: ${document.wordCount}`);
console.log(`Audio links: ${document.audioCount}`);
