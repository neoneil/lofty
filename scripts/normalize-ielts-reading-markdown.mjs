import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE_DIR = path.join(process.cwd(), "content", "ielts", "cambridge");
const BOOKS = [21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7];

const summary = {
  files: 0,
  changedFiles: 0,
  removedOptionGroups: 0,
  listHeadingsNormalized: 0,
};

for (const bookNumber of BOOKS) {
  await normalizeBook(bookNumber);
}

console.log(JSON.stringify(summary, null, 2));

async function normalizeBook(bookNumber) {
  const bookDir = path.join(BASE_DIR, `${bookNumber}`);
  const testDirs = await safeReadDir(bookDir);

  for (const testEntry of testDirs) {
    if (!testEntry.isDirectory() || !/^test\d+$/i.test(testEntry.name)) continue;
    const testNumber = Number(testEntry.name.replace(/\D/g, ""));
    const readingDir = path.join(bookDir, testEntry.name, "reading");
    const files = await safeReadDir(readingDir);
    const answerSections = [];

    for (const fileEntry of files) {
      if (!fileEntry.isFile() || !/^part\d+\.md$/i.test(fileEntry.name)) continue;
      const filePath = path.join(readingDir, fileEntry.name);
      const partNumber = Number(fileEntry.name.match(/\d+/)?.[0] ?? 0);
      const result = await normalizePartFile(filePath, partNumber);
      summary.files += 1;
      if (result.changed) summary.changedFiles += 1;
      answerSections.push(...result.answerSections);
    }

    if (answerSections.length > 0) {
      await appendAnswerSections({
        answersPath: path.join(readingDir, "answers.md"),
        bookNumber,
        testNumber,
        answerSections,
      });
    }
  }
}

async function normalizePartFile(filePath, partNumber) {
  const text = await readFile(filePath, "utf8");
  const block = readJsonBlock(text, "questions_json", "answers_json");
  if (!block) return { changed: false, answerSections: [] };

  const questions = JSON.parse(block.raw);
  let changed = false;
  const answerSections = [];

  for (const question of questions) {
    if (shouldMoveOptionsToAnswers(question)) {
      const answerWords = question.options.map((option) => option.title).filter(Boolean);
      if (answerWords.length > 0) {
        answerSections.push({
          partNumber,
          start: question.question_number_start,
          end: question.question_number_end ?? question.question_number_start,
          answers: answerWords,
        });
      }
      question.options = [];
      changed = true;
      summary.removedOptionGroups += 1;
    }

    if (normalizeListHeading(question)) {
      changed = true;
      summary.listHeadingsNormalized += 1;
    }
  }

  if (!changed) return { changed: false, answerSections };

  const replacement = indentJson(questions);
  await writeFile(filePath, text.slice(0, block.bodyStart) + replacement + text.slice(block.end), "utf8");
  return { changed: true, answerSections };
}

function shouldMoveOptionsToAnswers(question) {
  const options = Array.isArray(question.options) ? question.options : [];
  if (options.length === 0) return false;
  const labels = options.map((option) => cleanOptionText(option.title));
  if (labels.every(isSingleLetter)) return false;
  if (labels.some(hasOptionPrefix)) return false;
  if (isJudgementList(labels)) return false;

  const contentText = [
    question.question_type,
    question.prompt,
    question.instruction,
    question.content?.page_desc,
    question.content?.section_desc,
    question.content?.page_content,
    question.content?.part_content,
  ].filter(Boolean).join(" ");

  return hasBlankMarker(contentText) || /choose\s+one\s+word|complete\s+the\s+(?:summary|notes|table|sentences)|fill/i.test(stripHtml(contentText));
}

function normalizeListHeading(question) {
  const options = Array.isArray(question.options) ? question.options : [];
  const hasLetteredOptions = options.some((option) => hasOptionPrefix(cleanOptionText(option.title)));
  if (!hasLetteredOptions) return false;

  const pageContent = question.content?.page_content ?? "";
  const sectionDesc = question.content?.section_desc ?? "";
  const combined = stripHtml(`${sectionDesc} ${pageContent}`).toLowerCase();
  if (!/\blist of (?:people|persons|headings|paragraphs|options)\b/.test(combined)) return false;

  const label = titleCaseListHeading(combined);
  question.content = {
    ...question.content,
    section_desc: "",
    page_content: `<p style="text-align:center;"><strong>${label}</strong></p>`,
    part_content: "",
  };
  return true;
}

async function appendAnswerSections({ answersPath, bookNumber, testNumber, answerSections }) {
  let current = "";
  try {
    current = await readFile(answersPath, "utf8");
  } catch {
    current = [
      "---",
      `book_number: ${bookNumber}`,
      `test_number: ${testNumber}`,
      'module_type: "reading"',
      'status: "answer_reference_only"',
      "---",
      "",
      `# Cambridge IELTS ${bookNumber} Test ${testNumber} Reading Answers`,
      "",
    ].join("\n");
  }

  const additions = [];
  for (const section of answerSections) {
    const heading = `## Part ${section.partNumber} Questions ${section.start}-${section.end}`;
    if (current.includes(heading)) continue;
    additions.push([
      heading,
      "",
      ...section.answers.map((answer, index) => `${section.start + index}. ${answer}`),
      "",
    ].join("\n"));
  }

  if (additions.length > 0) {
    await writeFile(answersPath, `${current.trimEnd()}\n\n${additions.join("\n")}`.trimStart(), "utf8");
  }
}

function readJsonBlock(source, key, nextKey) {
  const marker = `${key}: |\n`;
  const start = source.indexOf(marker);
  if (start < 0) return null;
  const bodyStart = start + marker.length;
  const end = source.indexOf(`\n${nextKey}: |`, bodyStart);
  if (end < 0) return null;
  const raw = source.slice(bodyStart, end).split("\n").map((line) => line.startsWith("  ") ? line.slice(2) : line).join("\n");
  return { bodyStart, end, raw };
}

function indentJson(value) {
  return JSON.stringify(value, null, 2).split("\n").map((line) => `  ${line}`).join("\n");
}

function cleanOptionText(value) {
  return stripHtml(`${value ?? ""}`).trim();
}

function stripHtml(value) {
  return `${value}`.replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#160;|&#xA0;/gi, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ").trim();
}

function hasBlankMarker(value) {
  return /#####-\d{1,3}-#####|_{3,}\s*\d{1,3}\s*_{3,}|\[blank\]/i.test(value);
}

function hasOptionPrefix(value) {
  return /^[A-Z]\s*[.)]\s+\S/.test(value) || /^[A-Z]\s+\S/.test(value);
}

function isSingleLetter(value) {
  return /^[A-Z]$/i.test(value);
}

function isJudgementList(values) {
  const normalized = values.map((value) => value.replace(/^[A-Z]\s*[.)]\s*/i, "").toUpperCase());
  const hasNotGiven = normalized.includes("NOT GIVEN");
  const hasTrueFalse = normalized.includes("TRUE") && normalized.includes("FALSE");
  const hasYesNo = normalized.includes("YES") && normalized.includes("NO");
  return hasNotGiven && (hasTrueFalse || hasYesNo);
}

function titleCaseListHeading(value) {
  if (value.includes("list of headings")) return "List of Headings";
  if (value.includes("list of paragraphs")) return "List of Paragraphs";
  if (value.includes("list of options")) return "List of Options";
  if (value.includes("list of persons")) return "List of People";
  return "List of People";
}

async function safeReadDir(dir) {
  try {
    return await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}
