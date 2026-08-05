import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const SOURCE_DOC = "/mnt/c/BaiduNetdiskDownload/B0032-雅思口语分类词汇-87页-迷楼数据/雅思口语分类词汇超详细.doc";
const OUTPUT_PATH = path.join(process.cwd(), "content", "ielts", "vocabulary", "speaking", "classified-vocabulary.json");

const partTitles = {
  1: "Part 1 日常话题词汇",
  2: "Part 2 Cue Card 话题词汇",
  3: "Part 3 深度讨论词汇",
};

const fallbackTopicTitles = {
  "1.1": "家庭、教育与职业背景",
  "1.2": "饮食、手工艺、天气与景点",
  "1.3": "节日与婚礼",
  "1.4": "婚姻、亲子与价值观",
  "1.5": "性格与个人品质",
  "1.6": "休闲娱乐与兴趣",
  "1.7": "文化艺术与收藏",
  "1.8": "工作职业与职场",
  "1.9": "学习、学校与课程",
  "1.10": "城市交通与日常环境",
  "1.11": "餐饮、购物与服务",
  "1.12": "动物与自然",
  "2.1": "体育明星与人物品质",
  "2.2": "人物外貌与年龄描述",
  "2.3": "亲友、老师与重要人物",
  "2.4": "物品、礼物与收藏",
  "2.5": "书籍、电影与媒体",
  "2.6": "活动、聚会与经历",
  "2.7": "旅行地点与景点",
  "2.8": "建筑、房屋与空间",
  "2.9": "新闻、事件与社会话题",
  "2.10": "家庭、传统与纪念",
  "3.1": "城市生活与乡村生活",
  "3.2": "家庭关系与社会角色",
  "3.3": "科技、工作与现代生活",
  "3.4": "文化、娱乐与家庭活动",
  "3.5": "媒体、广告与公共沟通",
  "3.6": "健康、环保与公共意识",
  "3.7": "交通、城市规划与公共设施",
  "3.8": "教育体系与学习能力",
  "3.9": "历史、建筑与文化遗产",
  "3.10": "旅游、景点与地方文化",
  "3.11": "社会群体与公共生活",
  "3.12": "工作家庭平衡",
  "3.13": "家庭养老与社会保障",
  "3.14": "压力、劳动与生活方式",
  "3.15": "政策、家庭与社会制度",
  "3.16": "政府、公共事务与发展",
  "3.17": "体育、事件与社会影响",
  "3.18": "思维、科技与创造力",
  "3.19": "全球化、文化与交流",
  "3.20": "未来、变化与价值判断",
};

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
  "Norm",
  "WPS Office_7.3.1.8967_F1E327BC",
  "Times New Roman",
  "Symbol",
  "Arial",
  "Courier New",
  "Wingdings",
  "SimSun",
  "Unknown",
  "Default Paragraph Font",
  "Footer",
  "Char",
  "Header",
  "WpsCustomData",
]);

const replacements = new Map([
  ["master f business administration(MBA)", "master of business administration (MBA)"],
  ["in-serve training course", "in-service training course"],
  ["crewlwork", "crewelwork"],
  ["hndiwork,handwork", "handiwork, handwork"],
  ["istorical event", "historical event"],
  ["objectonable content", "objectionable content"],
  ["exteded family with several generations living under the same roof", "extended family with several generations living under the same roof"],
  ["nursig home,old folk's home,old people's home", "nursing home, old folk's home, old people's home"],
  ["to lay emphasis on the education of patriotism, to give prominence to the", "to lay emphasis on the education of patriotism, to give prominence to the education of patriotism"],
  ["tube, underground, (", "tube / underground / subway"],
  ["main artery]", "main artery"],
  ["crowede conditions", "crowded conditions"],
  [", coffeebar", "coffee bar"],
  ["giraffe]", "giraffe"],
  ["cleaner, dusst collector", "cleaner, dust collector"],
  ["to weigh 2 kilograms, a weight of 2 kilorgams", "to weigh 2 kilograms, a weight of 2 kilograms"],
  ["film, motion picture(", "film, motion picture, movie"],
  ["movie)", "movie"],
  ["colour film(", "colour film / color film"],
  ["color film)", "color film"],
  ["gunning for the Oscar(lining up cometiion for the Oscar)", "gunning for the Oscar (lining up competition for the Oscar)"],
  ["culturqal assimilation", "cultural assimilation"],
  ["live program)", "live program"],
  ["ornament, decoration]", "ornament, decoration"],
  ["improvement strategy]", "improvement strategy"],
  ["aceommodate", "accommodate"],
  ["relations of roduction", "relations of production"],
  ["means of llivelihood/subsistence", "means of livelihood / subsistence"],
  ["to safeguard national independence and the ntegrity of sovereignty", "to safeguard national independence and the integrity of sovereignty"],
  ["masteered", "mastered"],
  ["dimonstrate", "demonstrate"],
]);

function normalizeSpaces(value) {
  return value.replace(/\u0000/g, "").replace(/[ \t]+/g, " ").trim();
}

function cleanTerm(value) {
  const trimmed = normalizeSpaces(value)
    .replace(/^[)\]]+\s*/, "")
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s*;\s*/g, "; ")
    .replace(/\s+\/\s+/g, " / ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\s{2,}/g, " ");
  return replacements.get(trimmed) ?? trimmed;
}

function isTopicCode(value) {
  return /^[123]\.\d{1,2}$/.test(value);
}

function isSubcategory(value) {
  return /^\(\d{1,2}\)$/.test(value);
}

function isVocabularyTerm(value) {
  if (!value || value.length < 2) return false;
  if (metadataLines.has(value)) return false;
  if (value === "Cue Cards" || value === "Gue Cards") return false;
  if (value === "......") return false;
  if (/^\d+$/.test(value)) return false;
  if (/^[123]\.\d{2}$/.test(value)) return false;
  if (/[\u4e00-\u9fff]/.test(value)) return false;
  if (!/[A-Za-z]/.test(value)) return false;
  if (value.replace(/[^A-Za-z]/g, "").length < 2) return false;
  if (/Office|WPS|Normal|Root Entry|Document/.test(value)) return false;
  if (/^PAGE\b/.test(value)) return false;
  if (/^OLE_LINK/.test(value)) return false;
  if (/^[A-F0-9_]{20,}$/.test(value)) return false;
  return true;
}

function extractDocLines() {
  const result = spawnSync("strings", ["-el", SOURCE_DOC], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 32,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`strings failed: ${result.stderr}`);

  const lines = result.stdout.split(/\r?\n/).map(cleanTerm);
  const firstContentIndex = lines.findIndex((line) => line === "1.1");
  if (firstContentIndex < 0) throw new Error("Could not find first vocabulary section 1.1.");
  return lines.slice(firstContentIndex);
}

function readExistingTranslations() {
  const translations = new Map();
  if (!existsSync(OUTPUT_PATH)) return translations;

  try {
    const document = JSON.parse(readFileSync(OUTPUT_PATH, "utf8"));
    for (const topic of document.topics ?? []) {
      for (const item of topic.items ?? []) {
        if (item.term && item.translation) translations.set(`${topic.topicCode}::${String(item.term).toLowerCase()}`, item.translation);
      }
    }
  } catch {
    return translations;
  }

  return translations;
}

function buildDocument() {
  const lines = extractDocLines();
  const translations = readExistingTranslations();
  const topics = [];
  let currentTopic = null;
  let currentSubcategory = null;

  for (const line of lines) {
    if (!line) continue;

    if (isTopicCode(line)) {
      const partNumber = Number(line.split(".")[0]);
      currentTopic = {
        id: `ielts-speaking-${line}`,
        topicCode: line,
        partNumber,
        partTitle: partTitles[partNumber] ?? `Part ${partNumber}`,
        title: fallbackTopicTitles[line] ?? `口语分类 ${line}`,
        sourceDoc: {
          fileName: path.basename(SOURCE_DOC),
          relativePath: "B0032-雅思口语分类词汇-87页-迷楼数据/雅思口语分类词汇超详细.doc",
          size: statSync(SOURCE_DOC).size,
        },
        subcategories: [],
        itemCount: 0,
        items: [],
      };
      topics.push(currentTopic);
      currentSubcategory = {
        id: `${line}-main-1`,
        label: "核心词汇",
        itemStart: 1,
        itemCount: 0,
      };
      currentTopic.subcategories.push(currentSubcategory);
      continue;
    }

    if (!currentTopic) continue;

    if (isSubcategory(line)) {
      const subcategoryIndex = currentTopic.subcategories.length + 1;
      currentSubcategory = {
        id: `${currentTopic.topicCode}-${line.replace(/[()]/g, "")}-${subcategoryIndex}`,
        label: `子类 ${line.replace(/[()]/g, "")}`,
        itemStart: currentTopic.items.length + 1,
        itemCount: 0,
      };
      currentTopic.subcategories.push(currentSubcategory);
      continue;
    }

    if (!isVocabularyTerm(line)) continue;

    const term = cleanTerm(line);
    const duplicate = currentTopic.items.some((item) => item.term.toLowerCase() === term.toLowerCase());
    if (duplicate) continue;

    const item = {
      number: currentTopic.items.length + 1,
      term,
      translation: translations.get(`${currentTopic.topicCode}::${term.toLowerCase()}`) ?? "",
      itemType: /[\s,;/()-]/.test(term) ? "Phrase" : "Word",
      starred: /[\s,;/()-]/.test(term),
      subcategoryId: currentSubcategory?.id ?? `${currentTopic.topicCode}-main-1`,
      raw: line,
    };

    currentTopic.items.push(item);
    currentTopic.itemCount = currentTopic.items.length;
    if (currentSubcategory) currentSubcategory.itemCount += 1;
  }

  for (const topic of topics) {
    topic.subcategories = topic.subcategories.filter((subcategory) => subcategory.itemCount > 0);
  }

  const wordCount = topics.reduce((total, topic) => total + topic.itemCount, 0);
  const createdAt = "2026-08-05T00:00:00.000Z";

  return {
    id: "ielts-speaking-classified-vocabulary",
    slug: "classified-vocabulary",
    title: "雅思口语分类词汇",
    subtitle: "按 Part 1、Part 2 Cue Card 和 Part 3 深度讨论分类整理的雅思口语词汇库。",
    exam: "IELTS",
    skill: "Speaking",
    category: "Vocabulary",
    createdAt,
    updatedAt: createdAt,
    wordCount,
    topicCount: topics.length,
    partCount: new Set(topics.map((topic) => topic.partNumber)).size,
    parts: Object.entries(partTitles).map(([partNumber, title]) => ({
      partNumber: Number(partNumber),
      title,
      topicCount: topics.filter((topic) => topic.partNumber === Number(partNumber)).length,
      wordCount: topics.filter((topic) => topic.partNumber === Number(partNumber)).reduce((total, topic) => total + topic.itemCount, 0),
    })),
    topics,
  };
}

const document = buildDocument();
mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, `${JSON.stringify(document, null, 2)}\n`, "utf8");

console.log(`Wrote ${OUTPUT_PATH}`);
console.log(`Topics: ${document.topicCount}`);
console.log(`Words: ${document.wordCount}`);
