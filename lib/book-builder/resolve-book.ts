import "server-only";

import { getAdminLessonContent } from "@/lib/admin/lesson-content";
import { getBookBuilderCatalog } from "@/lib/book-builder/catalog";
import type {
  BookBuilderPayload,
  BookBuilderStudent,
  BookContentBlock,
  BookDocumentChapter,
  BookDocumentSection,
  BookPreviewDocument,
  BookQuestionItem,
  SelectedBookContent,
} from "@/lib/book-builder/types";
import { getIeltsMarkdownBookPracticeData } from "@/lib/ielts/markdown-practice";
import { getIeltsWritingTask1Bank } from "@/lib/ielts/writing-task1-bank";
import { createAdminClient } from "@/lib/supabase/admin";

type UnknownRecord = Record<string, unknown>;

type PteBookConfig = {
  table: string;
  label: string;
  select: string;
  titleFields: string[];
  bodyFields: string[];
  imageFields?: string[];
  answerFields?: string[];
  structuredFields?: Array<{ field: string; label: string }>;
};

const PTE_BOOK_CONFIGS: Record<string, PteBookConfig> = {
  ra: { table: "ra", label: "Read Aloud", select: "id, question_body_text, created_at", titleFields: [], bodyFields: ["question_body_text"] },
  rs: { table: "rs", label: "Repeat Sentence", select: "id, question_text, created_at", titleFields: [], bodyFields: ["question_text"] },
  di: { table: "di", label: "Describe Image", select: "id, title, question_text, image_url, answer_info, created_at", titleFields: ["title"], bodyFields: ["question_text"], imageFields: ["image_url"], answerFields: ["answer_info"] },
  rl: { table: "rl", label: "Retell Lecture", select: "id, title, question_title, question_text, image_url, question_image_url, original_text, transcript, answer_info, created_at", titleFields: ["title", "question_title"], bodyFields: ["question_text", "original_text"], imageFields: ["image_url", "question_image_url"], answerFields: ["answer_info", "transcript"] },
  asq: { table: "asq", label: "Answer Short Question", select: "id, question_text, answer_text, created_at", titleFields: [], bodyFields: ["question_text"], answerFields: ["answer_text"] },
  rts: { table: "rts", label: "Respond to a Situation", select: "id, title, question_title, question_text, question_info, question_info_2, answer_info, created_at", titleFields: ["title", "question_title"], bodyFields: ["question_text", "question_info", "question_info_2"], answerFields: ["answer_info"] },
  sgd: { table: "sgd", label: "Summarize Group Discussion", select: "id, title, question_title, question_text, answer_info, answer_info_html, original_text, question_info, created_at", titleFields: ["title", "question_title"], bodyFields: ["question_text", "question_info", "original_text"], answerFields: ["answer_info_html", "answer_info"] },
  swt: { table: "swt", label: "Summarize Written Text", select: "id, question_title, question_text, answer, created_at", titleFields: ["question_title"], bodyFields: ["question_text"], answerFields: ["answer"] },
  we: { table: "we", label: "Write Essay", select: "id, question_text, created_at", titleFields: [], bodyFields: ["question_text"] },
  ro: { table: "ro", label: "Re-order Paragraphs", select: "id, question_title, question_body_text, created_at", titleFields: ["question_title"], bodyFields: ["question_body_text"] },
  fibr: { table: "fibr", label: "Reading Fill in the Blanks", select: "id, question_title, question_body_text, blanks_json, created_at", titleFields: ["question_title"], bodyFields: ["question_body_text"], structuredFields: [{ field: "blanks_json", label: "Blank options" }] },
  fibrw: { table: "fibrw", label: "Reading & Writing Fill in the Blanks", select: "id, question_title, question_body_text, blanks_json, created_at", titleFields: ["question_title"], bodyFields: ["question_body_text"], structuredFields: [{ field: "blanks_json", label: "Blank options" }] },
  sst: { table: "sst", label: "Summarize Spoken Text", select: "id, question_text, answer_text, transcript_text, created_at", titleFields: [], bodyFields: ["question_text"], answerFields: ["answer_text", "transcript_text"] },
  hiw: { table: "hiw", label: "Highlight Incorrect Words", select: "id, question_text, instruction_text, question_body_text, incorrect_words_json, created_at", titleFields: [], bodyFields: ["instruction_text", "question_text", "question_body_text"], structuredFields: [{ field: "incorrect_words_json", label: "Incorrect words" }] },
  wfd: { table: "wfd", label: "Write From Dictation", select: "id, question_text, created_at", titleFields: [], bodyFields: ["question_text"] },
};

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as UnknownRecord : {};
}

function asRecords(value: unknown): UnknownRecord[] {
  return Array.isArray(value) ? value.filter((item): item is UnknownRecord => Boolean(item) && typeof item === "object" && !Array.isArray(item)) : [];
}

function asText(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function firstText(row: UnknownRecord, fields: string[]) {
  for (const field of fields) {
    const value = asText(row[field]);
    if (value) return value;
  }
  return "";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function plainTextToHtml(value: string) {
  return value
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br>")}</p>`)
    .join("");
}

function normalizeImageUrl(value: unknown) {
  const url = asText(value);
  if (!url) return null;
  if (url.startsWith("/") || url.startsWith("data:image/") || /^https:\/\//i.test(url)) return url;
  if (/^http:\/\//i.test(url)) return url.replace(/^http:/i, "https:");
  return null;
}

function stripTags(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
}

function sanitizeBookHtml(value: string, assetUrls: Map<string, string> = new Map()) {
  let html = value || "";
  for (const [fileName, url] of assetUrls) {
    html = html.replace(new RegExp(`(?:https?:)?[^\"']*${fileName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "gi"), url);
  }

  return html
    .replace(/<(script|style|iframe|object|embed|audio|video|source)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<(script|style|iframe|object|embed|audio|video|source)[^>]*\/?>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s+(src|href)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, "")
    .replace(/#####-(\d+)-#####/g, '<span class="book-answer-blank">$1 &nbsp;________________</span>')
    .replace(/<input[^>]*>/gi, '<span class="book-answer-blank">________________</span>');
}

function formatStructuredValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "string") {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function buildAssetUrlMap(assets: Array<{ public_url: string | null; storage_path: string }>) {
  const map = new Map<string, string>();
  for (const asset of assets) {
    if (!asset.public_url) continue;
    const fileName = asset.storage_path.split("/").at(-1);
    if (fileName) map.set(fileName, asset.public_url);
  }
  return map;
}

function buildQuestionPageHtml(page: UnknownRecord, assetUrls: Map<string, string>) {
  const chunks: string[] = [];
  const pageTitle = asText(page.title);
  const pageDesc = sanitizeBookHtml(asText(page.desc), assetUrls);
  const pageContent = sanitizeBookHtml(asText(page.content), assetUrls);
  if (pageTitle) chunks.push(`<h4>${escapeHtml(pageTitle)}</h4>`);
  if (stripTags(pageDesc)) chunks.push(`<div class="book-instruction">${pageDesc}</div>`);
  if (stripTags(pageContent) || /<img|<table/i.test(pageContent)) chunks.push(pageContent);

  const existingText = stripTags(`${pageContent} ${pageDesc}`).toLowerCase();
  for (const questionGroup of asRecords(page.sections)) {
    const groupTitle = asText(questionGroup.title);
    const groupType = asText(questionGroup.realType || questionGroup.type);
    const questions = asRecords(questionGroup.questions);
    const options = asRecords(questionGroup.options);
    const showChoiceOptions = options.length > 0 && groupType !== "11";

    if (groupTitle && !existingText.includes(stripTags(groupTitle).toLowerCase())) {
      chunks.push(`<h5>${escapeHtml(groupTitle)}</h5>`);
    }

    const distinctQuestions = questions.filter((question) => {
      const title = asText(question.title);
      return title && !/^\d+[.\-]?$/i.test(title) && !existingText.includes(stripTags(title).toLowerCase());
    });
    if (distinctQuestions.length > 0) {
      chunks.push(`<ol class="book-question-statements">${distinctQuestions.map((question) => {
        const number = Number(question.questionNo || question.sort || 0);
        const title = asText(question.title).replace(/^\d+[.\s-]*/, "");
        return `<li value="${Number.isFinite(number) && number > 0 ? number : 1}">${escapeHtml(title)}</li>`;
      }).join("")}</ol>`);
    }

    if (showChoiceOptions) {
      chunks.push(`<div class="book-options">${options.map((option) => `<div>${sanitizeBookHtml(asText(option.title), assetUrls)}</div>`).join("")}</div>`);
    }
  }

  return chunks.join("");
}

function buildAnswerHtml(rawData: UnknownRecord, assetUrls: Map<string, string>) {
  const answerRows: string[] = [];
  for (const page of asRecords(rawData.pages)) {
    for (const group of asRecords(page.sections)) {
      const optionMap = new Map(asRecords(group.options).map((option) => [asText(option.id), asText(option.title)]));
      for (const question of asRecords(group.questions)) {
        const number = asText(question.questionNo || question.sort || question.title);
        if (!number) continue;
        const ids = asText(question.optionIds).split("|").filter(Boolean);
        const answers = ids.map((id) => optionMap.get(id)).filter((item): item is string => Boolean(item));
        const explanation = sanitizeBookHtml(asText(question.answerExplain), assetUrls);
        answerRows.push(`<div class="book-answer-row"><strong>Q${escapeHtml(number)}</strong><span>${answers.length > 0 ? answers.map(escapeHtml).join(" / ") : "—"}</span>${explanation ? `<p>${explanation}</p>` : ""}</div>`);
      }
    }
  }
  return answerRows.length > 0 ? `<div class="book-answer-key">${answerRows.join("")}</div>` : "";
}

function buildWritingBlocks(rawData: UnknownRecord, assetUrls: Map<string, string>, includeAnswers: boolean): BookContentBlock[] {
  const blocks: BookContentBlock[] = [];
  const prompt = sanitizeBookHtml(asText(rawData.content), assetUrls);
  if (stripTags(prompt) || /<img/i.test(prompt)) blocks.push({ type: "html", html: prompt });

  if (includeAnswers) {
    const samples = asRecords(rawData.writingList).map((item) => asText(item.value)).filter(Boolean);
    for (const sample of samples) {
      blocks.push({ type: "notice", title: "High-scoring model answer", body: sample });
    }
  }
  return blocks;
}

async function resolveCambridgeChapter(selected: SelectedBookContent, includeAnswers: boolean): Promise<BookDocumentChapter> {
  const match = selected.id.match(/^ielts-cambridge:(\d+):(listening|reading|writing)$/);
  if (!match) throw new Error("Invalid Cambridge content selection");
  const bookNumber = Number(match[1]);
  const moduleType = match[2] as "listening" | "reading" | "writing";
  const first = await getIeltsMarkdownBookPracticeData(bookNumber);
  const sections: BookDocumentSection[] = [];

  for (const test of first.tests) {
    const data = await getIeltsMarkdownBookPracticeData(bookNumber, test.test_number);
    const testModule = data.modules.find((item) => item.module_type === moduleType);
    if (!testModule) continue;
    const moduleSections = data.sections.filter((item) => item.module_id === testModule.id);
    const assetUrls = buildAssetUrlMap(data.assets);

    for (const [sectionIndex, section] of moduleSections.entries()) {
      const rawData = asRecord(section.raw_data);
      const blocks: BookContentBlock[] = [];
      if (section.instruction) blocks.push({ type: "html", html: `<div class="book-instruction">${sanitizeBookHtml(section.instruction, assetUrls)}</div>` });
      if (section.passage_text) blocks.push({ type: "html", html: sanitizeBookHtml(section.passage_text, assetUrls) });

      if (moduleType === "writing") {
        blocks.push(...buildWritingBlocks(rawData, assetUrls, includeAnswers));
      } else {
        for (const page of asRecords(rawData.pages)) {
          const html = buildQuestionPageHtml(page, assetUrls);
          if (stripTags(html) || /<img|<table/i.test(html)) blocks.push({ type: "html", html });
        }
        if (includeAnswers) {
          const answerHtml = buildAnswerHtml(rawData, assetUrls);
          if (answerHtml) blocks.push({ type: "html", html: `<h3>Answers & explanations</h3>${answerHtml}` });
        }
      }

      if (blocks.length === 0) continue;
      sections.push({
        id: `${selected.id}:test${test.test_number}:section${section.section_number}`,
        title: `Test ${test.test_number} · ${section.title || `${testModule.title} ${section.section_number}`}`,
        eyebrow: `Cambridge IELTS ${bookNumber} · ${testModule.title}`,
        pageBreakBefore: sectionIndex === 0,
        blocks,
      });
    }
  }

  return { id: selected.id, title: selected.title, sourceLabel: `Cambridge IELTS ${bookNumber}`, sections };
}

async function resolveTask1Chapter(selected: SelectedBookContent, includeAnswers: boolean): Promise<BookDocumentChapter> {
  const match = selected.id.match(/^ielts-task1-bank:(\d+)$/);
  if (!match) throw new Error("Invalid Task 1 selection");
  const bookNumber = Number(match[1]);
  const bank = await getIeltsWritingTask1Bank();
  const items = bank.items.filter((item) => item.bookNumber === bookNumber).sort((a, b) => a.testNumber - b.testNumber);
  const sections: BookDocumentSection[] = items.map((item) => {
    const blocks: BookContentBlock[] = [{ type: "image", src: item.image, alt: item.title, caption: `Source page ${item.sourcePage}` }];
    if (includeAnswers && item.modelAnswer) blocks.push({ type: "notice", title: "Band 9 model answer", body: item.modelAnswer });
    return {
      id: item.id,
      title: `Test ${item.testNumber} · Writing Task 1`,
      eyebrow: `Cambridge IELTS ${bookNumber}`,
      pageBreakBefore: true,
      blocks,
    };
  });
  return { id: selected.id, title: selected.title, sourceLabel: "IELTS Writing Task 1 Bank", sections };
}

async function resolveLessonChapter(selected: SelectedBookContent): Promise<BookDocumentChapter> {
  const match = selected.id.match(/^lesson:(ielts|pte):(.+)$/);
  if (!match) throw new Error("Invalid lesson selection");
  const lessonPath = match[2].split("/").filter(Boolean);
  const lesson = await getAdminLessonContent(match[1], lessonPath);
  if (!lesson) throw new Error(`Lesson not found: ${selected.title}`);
  return {
    id: selected.id,
    title: selected.title,
    sourceLabel: `${match[1].toUpperCase()} Teaching Notes`,
    sections: [{
      id: `${selected.id}:lesson`,
      title: lesson.metadata.title,
      eyebrow: lesson.metadata.subtitle,
      pageBreakBefore: true,
      blocks: [{ type: "markdown", markdown: lesson.content }],
    }],
  };
}

function pteRowToQuestion(row: UnknownRecord, config: PteBookConfig, index: number, includeAnswers: boolean): BookQuestionItem {
  const title = firstText(row, config.titleFields);
  const bodyParts = config.bodyFields.map((field) => asText(row[field])).filter((value, partIndex, values) => value && values.indexOf(value) === partIndex && value !== title);
  const structuredParts = (config.structuredFields ?? []).flatMap(({ field, label }) => {
    const value = formatStructuredValue(row[field]);
    return value ? [`<details class="book-structured"><summary>${escapeHtml(label)}</summary><pre>${escapeHtml(value)}</pre></details>`] : [];
  });
  const rawBody = bodyParts.join("\n\n");
  const bodyHtml = `${/<[a-z][\s\S]*>/i.test(rawBody) ? sanitizeBookHtml(rawBody) : plainTextToHtml(rawBody)}${structuredParts.join("")}`;
  const answerParts = includeAnswers ? (config.answerFields ?? []).map((field) => asText(row[field])).filter((value, partIndex, values) => value && values.indexOf(value) === partIndex) : [];
  const answerRaw = answerParts.join("\n\n");

  return {
    id: asText(row.id) || `${config.table}-${index + 1}`,
    number: index + 1,
    title: title || null,
    bodyHtml,
    imageUrl: normalizeImageUrl(firstText(row, config.imageFields ?? [])),
    answerHtml: answerRaw ? (/<[a-z][\s\S]*>/i.test(answerRaw) ? sanitizeBookHtml(answerRaw) : plainTextToHtml(answerRaw)) : null,
  };
}

async function resolvePteChapter(selected: SelectedBookContent, includeAnswers: boolean): Promise<BookDocumentChapter> {
  const match = selected.id.match(/^pte-question-bank:([a-z0-9-]+)$/);
  const config = match ? PTE_BOOK_CONFIGS[match[1]] : null;
  if (!config) throw new Error("Invalid PTE question bank selection");
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .schema("pte")
    .from(config.table)
    .select(config.select)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(`读取 PTE ${config.label} 失败：${error.message}`);

  const questions = ((data ?? []) as unknown as UnknownRecord[]).map((row, index) => pteRowToQuestion(row, config, index, includeAnswers));
  return {
    id: selected.id,
    title: selected.title,
    sourceLabel: `PTE ${config.label}`,
    sections: [{
      id: `${selected.id}:questions`,
      title: `${config.label} · ${questions.length} Questions`,
      eyebrow: "PTE Question Bank",
      pageBreakBefore: true,
      blocks: questions.length > 0 ? [{ type: "questions", items: questions }] : [{ type: "notice", title: "暂无题目", body: "当前题型还没有可加入书籍的题目。" }],
    }],
  };
}

function validatePayload(payload: BookBuilderPayload) {
  if (payload.exam !== "ielts" && payload.exam !== "pte") throw new Error("Invalid exam type");
  if (!payload.title.trim() || payload.title.trim().length > 120) throw new Error("书名不能为空，且不能超过 120 个字符");
  if (payload.subtitle.length > 180) throw new Error("副标题不能超过 180 个字符");
  if (!Array.isArray(payload.contents) || payload.contents.length === 0) throw new Error("请至少选择一项内容");
  if (payload.contents.length > 40) throw new Error("一次最多选择 40 项内容");
  if (payload.coverDataUrl && (!payload.coverDataUrl.startsWith("data:image/") || payload.coverDataUrl.length > 3_000_000)) {
    throw new Error("封面图片格式不正确或文件过大");
  }
}

async function loadStudent(studentId: string | null): Promise<BookBuilderStudent | null> {
  if (!studentId) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("profiles").select("id, full_name, email").eq("id", studentId).maybeSingle();
  if (error) throw new Error(`读取学生账户失败：${error.message}`);
  if (!data) return null;
  return { id: data.id, name: data.full_name?.trim() || data.email || "Student", email: data.email };
}

export async function resolveBookPreview(payload: BookBuilderPayload): Promise<BookPreviewDocument> {
  validatePayload(payload);
  const catalog = await getBookBuilderCatalog();
  const catalogMap = new Map(catalog.map((item) => [item.id, item]));
  const contents = payload.contents.map((item) => ({ id: item.id, title: item.title.trim().slice(0, 140) }));
  for (const item of contents) {
    const catalogItem = catalogMap.get(item.id);
    if (!catalogItem || catalogItem.exam !== payload.exam) throw new Error(`无效或不匹配的目录内容：${item.id}`);
  }

  const chapters: BookDocumentChapter[] = [];
  for (const selected of contents) {
    if (selected.id.startsWith("ielts-cambridge:")) chapters.push(await resolveCambridgeChapter(selected, payload.includeAnswers));
    else if (selected.id.startsWith("ielts-task1-bank:")) chapters.push(await resolveTask1Chapter(selected, payload.includeAnswers));
    else if (selected.id.startsWith("lesson:")) chapters.push(await resolveLessonChapter(selected));
    else if (selected.id.startsWith("pte-question-bank:")) chapters.push(await resolvePteChapter(selected, payload.includeAnswers));
  }

  const student = await loadStudent(payload.studentId);
  const itemCount = chapters.reduce((total, chapter) => total + chapter.sections.reduce((sectionTotal, section) => sectionTotal + section.blocks.reduce((blockTotal, block) => blockTotal + (block.type === "questions" ? block.items.length : 1), 0), 0), 0);
  return {
    exam: payload.exam,
    title: payload.title.trim(),
    subtitle: payload.subtitle.trim(),
    student,
    coverDataUrl: payload.coverDataUrl,
    includeAnswers: payload.includeAnswers,
    generatedAt: new Date().toISOString(),
    chapters,
    itemCount,
  };
}
