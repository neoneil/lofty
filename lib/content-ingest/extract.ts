import "server-only";

import mammoth from "mammoth";
import JSZip from "jszip";

import type { GeneratedVocabularySourceFile } from "@/lib/content-ingest/types";

type ExtractedDocumentText = {
  text: string;
  source: GeneratedVocabularySourceFile;
};

const MAX_LOCAL_TEXT_LENGTH = 220_000;

function normalizeWhitespace(value: string) {
  return value.replace(/\u0000/g, " ").replace(/\r/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function decodeXmlText(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function getExtension(fileName: string) {
  const ext = fileName.toLowerCase().split(".").pop();
  return ext ? `.${ext}` : "";
}

async function extractPdfText(buffer: Buffer) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const document = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    disableFontFace: true,
    useSystemFonts: true,
  }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => "str" in item ? String(item.str) : "")
      .filter(Boolean)
      .join(" ");

    if (text.trim()) pages.push(`Page ${pageNumber}\n${text}`);
  }

  return normalizeWhitespace(pages.join("\n\n"));
}

async function extractDocxText(buffer: Buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return normalizeWhitespace(result.value);
}

async function extractPptxText(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const slideEntries = Object.values(zip.files)
    .filter((entry) => /^ppt\/slides\/slide\d+\.xml$/i.test(entry.name))
    .sort((a, b) => {
      const left = Number(a.name.match(/slide(\d+)\.xml/i)?.[1] ?? 0);
      const right = Number(b.name.match(/slide(\d+)\.xml/i)?.[1] ?? 0);
      return left - right;
    });

  const slides: string[] = [];
  for (const entry of slideEntries) {
    const xml = await entry.async("string");
    const textItems = [...xml.matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g)]
      .map((match) => decodeXmlText(match[1] ?? "").trim())
      .filter(Boolean);
    if (textItems.length > 0) {
      const slideNumber = entry.name.match(/slide(\d+)\.xml/i)?.[1] ?? String(slides.length + 1);
      slides.push(`Slide ${slideNumber}\n${textItems.join("\n")}`);
    }
  }

  return normalizeWhitespace(slides.join("\n\n"));
}

export function getSupportedFileHint() {
  return "支持 .pdf, .docx, .pptx, .txt, .md；图片 PDF 可勾选 AI OCR/词汇整理。";
}

export async function extractDocumentText(file: File): Promise<ExtractedDocumentText> {
  const fileName = file.name || "uploaded-document";
  const fileType = file.type || "application/octet-stream";
  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = getExtension(fileName);
  const warnings: string[] = [];
  let text = "";

  try {
    if (extension === ".pdf" || fileType === "application/pdf") {
      text = await extractPdfText(buffer);
      if (text.length < 80) warnings.push("本地 PDF 文字层很少，可能是图片 PDF，需要 AI OCR。");
    } else if (extension === ".docx" || fileType.includes("wordprocessingml")) {
      text = await extractDocxText(buffer);
    } else if (extension === ".pptx" || fileType.includes("presentationml")) {
      text = await extractPptxText(buffer);
    } else if ([".txt", ".md"].includes(extension) || fileType.startsWith("text/")) {
      text = normalizeWhitespace(buffer.toString("utf8"));
    } else {
      warnings.push(`暂不支持该文件类型：${fileType || extension || "unknown"}`);
    }
  } catch (error) {
    warnings.push(error instanceof Error ? error.message : "本地解析失败。");
  }

  if (text.length > MAX_LOCAL_TEXT_LENGTH) {
    warnings.push(`原文超过 ${MAX_LOCAL_TEXT_LENGTH} 字符，已截断用于词汇整理。`);
    text = text.slice(0, MAX_LOCAL_TEXT_LENGTH);
  }

  return {
    text,
    source: {
      fileName,
      fileType,
      size: file.size,
      extractionMethod: text ? "local" : "fallback",
      textLength: text.length,
      warnings,
    },
  };
}
