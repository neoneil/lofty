import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { requireApiAdminOrEditor } from "@/lib/auth/require-api-auth";
import { extractFallbackVocabulary, extractTextWithAiFromFile, generateVocabularyWithAi } from "@/lib/content-ingest/ai";
import { extractDocumentText, getSupportedFileHint } from "@/lib/content-ingest/extract";
import { readGeneratedVocabularyIndex, slugifyTitle, writeGeneratedVocabularyDocument } from "@/lib/content-ingest/storage";
import type { GeneratedVocabularyDocument, GeneratedVocabularySourceFile } from "@/lib/content-ingest/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILES = 8;
const MIN_TEXT_FOR_LOCAL_SUCCESS = 120;

function clampMaxItems(value: FormDataEntryValue | null) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 60;
  return Math.max(10, Math.min(120, Math.round(parsed)));
}

function toBool(value: FormDataEntryValue | null) {
  return value === "true" || value === "on" || value === "1";
}

function cleanText(value: string) {
  return value.replace(/\r/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

export async function GET() {
  const auth = await requireApiAdminOrEditor();
  if (!auth.ok) return auth.response;

  const documents = await readGeneratedVocabularyIndex();
  return NextResponse.json({ ok: true, documents, supportedFileHint: getSupportedFileHint() });
}

export async function POST(req: Request) {
  const auth = await requireApiAdminOrEditor();
  if (!auth.ok) return auth.response;

  try {
    const formData = await req.formData();
    const files = formData.getAll("files").filter((value): value is File => value instanceof File && value.size > 0).slice(0, MAX_FILES);
    const title = String(formData.get("title") || files[0]?.name?.replace(/\.[^.]+$/, "") || "Generated Vocabulary").trim();
    const category = String(formData.get("category") || "General").trim();
    const slug = slugifyTitle(String(formData.get("slug") || title));
    const mode = String(formData.get("mode") || "ai-vocabulary");
    const useAi = toBool(formData.get("useAi"));
    const useAiFileOcr = toBool(formData.get("useAiFileOcr"));
    const maxItems = clampMaxItems(formData.get("maxItems"));
    const shouldGenerateVocabulary = mode !== "text-only";

    if (files.length === 0) {
      return NextResponse.json({ ok: false, message: "请至少上传一个文件。" }, { status: 400 });
    }

    const sources: GeneratedVocabularySourceFile[] = [];
    const extractedTexts: string[] = [];

    for (const file of files) {
      const extracted = await extractDocumentText(file);
      let text = extracted.text;
      const source = { ...extracted.source };

      if (useAiFileOcr && text.length < MIN_TEXT_FOR_LOCAL_SUCCESS) {
        const aiTextResult = await extractTextWithAiFromFile(file);
        if (aiTextResult.text.length >= MIN_TEXT_FOR_LOCAL_SUCCESS) {
          text = aiTextResult.text;
          source.extractionMethod = "ai-file";
          source.textLength = text.length;
          source.warnings = source.warnings.filter((warning) => !warning.includes("文字层很少"));
        } else if (aiTextResult.warning) {
          source.warnings.push(aiTextResult.warning);
        }
      }

      sources.push(source);
      if (text.trim()) extractedTexts.push(`## ${file.name}\n\n${cleanText(text)}`);
    }

    const rawText = cleanText(extractedTexts.join("\n\n"));
    if (!rawText) {
      return NextResponse.json({ ok: false, message: "没有提取到文字。图片 PDF 请勾选 AI OCR/词汇整理，并确认 OPENAI_API_KEY 已配置。", sources }, { status: 422 });
    }

    const aiResult = !shouldGenerateVocabulary
      ? {
          summary: "已完成图片/文档转文字，未生成词汇条目。",
          vocabulary: [],
          warning: null,
        }
      : useAi
      ? await generateVocabularyWithAi({
          title,
          category,
          sourceFileNames: sources.map((source) => source.fileName),
          rawText,
          maxItems,
        })
      : {
          summary: "已完成本地文字提取，词汇为本地频率候选词，建议后续开启 AI 精修。",
          vocabulary: extractFallbackVocabulary(rawText, maxItems),
          warning: null,
        };

    if (aiResult.warning) {
      sources[0]?.warnings.push(aiResult.warning);
    }

    const now = new Date().toISOString();
    const document: GeneratedVocabularyDocument = {
      id: randomUUID(),
      slug,
      title,
      category,
      summary: aiResult.summary,
      createdAt: now,
      updatedAt: now,
      sourceFiles: sources,
      rawText,
      vocabulary: aiResult.vocabulary,
    };

    const indexItem = await writeGeneratedVocabularyDocument(document);

    return NextResponse.json({
      ok: true,
      message: shouldGenerateVocabulary ? "文档已解析并生成词汇静态文件。" : "文档已解析并生成文字静态文件。",
      document: indexItem,
      filePath: `content/generated-vocabulary/${slug}.json`,
      detailHref: `/vocabulary/generated/${slug}`,
      sources,
    });
  } catch (error) {
    console.error("content ingest failed:", error);
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "文档解析失败。" }, { status: 500 });
  }
}
