import { readFileSync, writeFileSync } from "node:fs";

import matter from "gray-matter";

const ROOT = "content/ielts/cambridge/9";
const TRUE_FILL_TYPES = [/简答/, /填空/, /流程图/, /图解标签/, /笔记/, /填词摘要/];
const NON_FILL_TYPES = [/判断/, /小标题/, /段落信息配对/, /属性配对/, /句尾配对/];
const SPECIAL_SORT_ORDERS = {
  "test1/reading/part3.md": new Map([
    ["27-30", 1],
    ["31-33", 2],
    ["34-39", 3],
    ["40-40", 4],
  ]),
};

function rangeKey(start, end) {
  return `${start}-${end || start}`;
}

function rangeFromTheme(value) {
  const match = String(value || "").match(/Questions?\s+(\d{1,2})(?:\s*[—–-]\s*(\d{1,2}))?/i);
  if (!match) return "";
  return rangeKey(Number(match[1]), Number(match[2] || match[1]));
}

function cleanOptionTitle(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/<br\s*\/?>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function makeOptions(values, baseId) {
  return values
    .map(cleanOptionTitle)
    .filter(Boolean)
    .map((title, index) => ({
      id: baseId + index,
      title,
      legend: 0,
      sortOrder: index,
    }));
}

function isTrueFillQuestion(question) {
  const type = String(question.question_type || "");
  return TRUE_FILL_TYPES.some((pattern) => pattern.test(type));
}

function shouldCleanQuestionBlank(question) {
  const type = String(question.question_type || "");
  if (isTrueFillQuestion(question)) return false;
  return NON_FILL_TYPES.some((pattern) => pattern.test(type));
}

function removeTrailingBlankMarker(value) {
  return String(value || "")
    .replace(/\s*<br\s*\/?>\s*\[blank\]\s*\[\/blank\]\s*$/gi, "")
    .replace(/\s*\[blank\]\s*\[\/blank\]\s*$/gi, "")
    .trim();
}

function replaceQuestionsJsonBlock(source, questions) {
  const json = JSON.stringify(questions, null, 2);
  const block = `questions_json: |\n${json.split("\n").map((line) => `  ${line}`).join("\n")}\n`;
  const next = source.replace(/questions_json: \|\n(?:  .*\n)*?(?=answers_json: \|\n)/, block);
  if (next === source) throw new Error("questions_json block replacement failed");
  return next;
}

let totalOptionsAdded = 0;
let totalBlankMarkersRemoved = 0;

for (let testNumber = 1; testNumber <= 4; testNumber += 1) {
  for (let partNumber = 1; partNumber <= 3; partNumber += 1) {
    const filePath = `${ROOT}/test${testNumber}/reading/part${partNumber}.md`;
    const relativePath = `test${testNumber}/reading/part${partNumber}.md`;
    const source = readFileSync(filePath, "utf8");
    const parsed = matter(source);
    const questions = JSON.parse(parsed.data.questions_json || "[]");
    const rawData = JSON.parse(parsed.data.section_raw_data_json || "{}");
    const domains = rawData.detail?.themeDomainList || [];
    const domainByRange = new Map(domains.map((domain) => [rangeFromTheme(domain.theme), domain]).filter(([key]) => key));
    let changed = false;

    for (const question of questions) {
      const key = rangeKey(question.question_number_start, question.question_number_end);
      const domain = domainByRange.get(key);
      const currentOptions = Array.isArray(question.options) ? question.options : [];
      const rawOptions = Array.isArray(domain?.matchValue) && domain.matchValue.length > 0 ? domain.matchValue : Array.isArray(domain?.trunkList?.[0]?.option) ? domain.trunkList[0].option : [];

      if (currentOptions.length === 0 && rawOptions.length > 0) {
        question.options = makeOptions(rawOptions, 900000 + testNumber * 10000 + partNumber * 1000 + question.question_number_start * 10);
        totalOptionsAdded += question.options.length;
        changed = true;
      }

      if (shouldCleanQuestionBlank(question) && Array.isArray(question.content?.questions)) {
        for (const sourceQuestion of question.content.questions) {
          if (typeof sourceQuestion.content !== "string") continue;
          const before = sourceQuestion.content;
          sourceQuestion.content = removeTrailingBlankMarker(sourceQuestion.content);
          if (sourceQuestion.content !== before) {
            totalBlankMarkersRemoved += 1;
            changed = true;
          }
        }
      }
    }

    const specialSort = SPECIAL_SORT_ORDERS[relativePath];
    if (specialSort) {
      for (const question of questions) {
        const key = rangeKey(question.question_number_start, question.question_number_end);
        const nextSortOrder = specialSort.get(key);
        if (nextSortOrder && question.sort_order !== nextSortOrder) {
          question.sort_order = nextSortOrder;
          changed = true;
        }
      }
      questions.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    }

    if (changed) {
      writeFileSync(filePath, replaceQuestionsJsonBlock(source, questions), "utf8");
      console.log(`Updated ${filePath}`);
    }
  }
}

console.log(`Options added: ${totalOptionsAdded}`);
console.log(`Non-fill blank markers removed: ${totalBlankMarkersRemoved}`);
