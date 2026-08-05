"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, FileText, Loader2, UploadCloud } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Card, CardContent } from "@/components/ui-v2/card";
import { Input } from "@/components/ui-v2/input";
import type { GeneratedVocabularyIndexItem, GeneratedVocabularySourceFile } from "@/lib/content-ingest/types";

type ProcessingMode = "ai-vocabulary" | "text-only" | "local-vocabulary";

type ApiListResponse = {
  ok: boolean;
  documents: GeneratedVocabularyIndexItem[];
  supportedFileHint: string;
};

type UploadResult = {
  ok: boolean;
  message: string;
  filePath?: string;
  detailHref?: string;
  sources?: GeneratedVocabularySourceFile[];
  document?: GeneratedVocabularyIndexItem;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export function ContentIngestClient() {
  const [documents, setDocuments] = useState<GeneratedVocabularyIndexItem[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("IELTS");
  const [maxItems, setMaxItems] = useState(60);
  const [processingMode, setProcessingMode] = useState<ProcessingMode>("ai-vocabulary");
  const [useAiFileOcr, setUseAiFileOcr] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isListLoading, setIsListLoading] = useState(true);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [supportedFileHint, setSupportedFileHint] = useState("支持 .pdf, .docx, .pptx, .txt, .md");

  const fileSummary = useMemo(() => files.map((file) => `${file.name} (${formatBytes(file.size)})`).join(" · "), [files]);

  const loadDocuments = async () => {
    setIsListLoading(true);
    try {
      const response = await fetch("/api/admin/content-ingest", { cache: "no-store" });
      const data = await response.json() as ApiListResponse;
      if (data.ok) {
        setDocuments(data.documents);
        setSupportedFileHint(data.supportedFileHint);
      }
    } finally {
      setIsListLoading(false);
    }
  };

  useEffect(() => {
    void loadDocuments();
  }, []);

  const handleFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    setFiles(selectedFiles);
    if (!title && selectedFiles[0]) setTitle(selectedFiles[0].name.replace(/\.[^.]+$/, ""));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (files.length === 0 || isLoading) return;

    setIsLoading(true);
    setResult(null);
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.set("title", title);
    formData.set("category", category);
    formData.set("maxItems", String(maxItems));
    formData.set("mode", processingMode);
    formData.set("useAi", String(processingMode === "ai-vocabulary"));
    formData.set("useAiFileOcr", String(useAiFileOcr));

    try {
      const response = await fetch("/api/admin/content-ingest", { method: "POST", body: formData });
      const data = await response.json() as UploadResult;
      setResult(data);
      if (data.ok) await loadDocuments();
    } catch (error) {
      setResult({ ok: false, message: error instanceof Error ? error.message : "上传失败。" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <Card className="rounded-[var(--radius-lg)]">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]"><UploadCloud size={20} /></span>
            <div>
              <Badge variant="secondary">Document Automation</Badge>
              <h2 className="mt-3 text-xl font-bold text-[var(--text)]">上传文档并生成词汇静态文件</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">{supportedFileHint} 生成结果会写入项目的 <span className="font-mono text-[var(--text)]">content/generated-vocabulary</span>。</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <label className="block rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] bg-[var(--bg-soft)] p-5 transition hover:border-[var(--primary)]/50 hover:bg-[var(--primary-soft)]">
              <input type="file" multiple accept=".pdf,.docx,.pptx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/markdown" onChange={handleFilesChange} className="sr-only" />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-[var(--text)]"><FileText size={17} />选择 PDF / Word / PPT / Text</div>
                  <p className="mt-1 text-xs leading-6 text-[var(--text-soft)]">{fileSummary || "最多一次处理 8 个文件，建议一本书或一组课件一批。"}</p>
                </div>
                <span className="inline-flex h-10 w-fit items-center justify-center rounded-[var(--radius-md)] bg-[var(--card)] px-4 text-sm font-semibold text-[var(--primary)] shadow-[var(--shadow-sm)]">选择文件</span>
              </div>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[var(--text)]">标题</span>
                <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="例如 Cambridge IELTS 21 Reading Vocabulary" required />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[var(--text)]">分类</span>
                <Input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="IELTS / PTE / Course" />
              </label>
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              <button type="button" onClick={() => setProcessingMode("ai-vocabulary")} className={`rounded-[var(--radius-md)] border p-4 text-left transition ${processingMode === "ai-vocabulary" ? "border-[var(--primary)] bg-[var(--primary-soft)] shadow-[var(--shadow-sm)]" : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/40"}`}>
                <span className="block text-sm font-bold text-[var(--text)]">提取文字 + AI词汇</span>
                <span className="mt-1 block text-xs leading-5 text-[var(--text-soft)]">生成中文释义、例句、搭配</span>
              </button>
              <button type="button" onClick={() => setProcessingMode("text-only")} className={`rounded-[var(--radius-md)] border p-4 text-left transition ${processingMode === "text-only" ? "border-[var(--primary)] bg-[var(--primary-soft)] shadow-[var(--shadow-sm)]" : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/40"}`}>
                <span className="block text-sm font-bold text-[var(--text)]">只提取文字</span>
                <span className="mt-1 block text-xs leading-5 text-[var(--text-soft)]">图片 PDF 变文字，不整理词汇</span>
              </button>
              <button type="button" onClick={() => setProcessingMode("local-vocabulary")} className={`rounded-[var(--radius-md)] border p-4 text-left transition ${processingMode === "local-vocabulary" ? "border-[var(--primary)] bg-[var(--primary-soft)] shadow-[var(--shadow-sm)]" : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/40"}`}>
                <span className="block text-sm font-bold text-[var(--text)]">本地候选词</span>
                <span className="mt-1 block text-xs leading-5 text-[var(--text-soft)]">不调用 AI，只按频率生成</span>
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className={`space-y-2 ${processingMode === "text-only" ? "opacity-50" : ""}`}>
                <span className="text-sm font-semibold text-[var(--text)]">词汇数量</span>
                <Input type="number" min={10} max={120} value={maxItems} onChange={(event) => setMaxItems(Number(event.target.value))} disabled={processingMode === "text-only"} />
              </label>
              <label className="flex min-h-20 cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-3">
                <input type="checkbox" checked={useAiFileOcr} onChange={(event) => setUseAiFileOcr(event.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
                <span><span className="block text-sm font-semibold text-[var(--text)]">图片 PDF OCR</span><span className="mt-1 block text-xs leading-5 text-[var(--text-soft)]">本地没文字时使用 AI 提取文字</span></span>
              </label>
            </div>

            <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 text-xs leading-6 text-[var(--text-soft)]">
              说明：本地开发环境可以直接写入项目文件夹；Vercel 生产环境的文件系统不会持久保存，批量资料建议在本地生成后提交到 git。
            </div>

            <Button type="submit" disabled={files.length === 0 || isLoading} className="min-w-44">
              {isLoading ? <><Loader2 size={16} className="mr-2 animate-spin" />正在生成</> : processingMode === "text-only" ? "生成文字静态文件" : "生成静态词汇文件"}
            </Button>
          </form>

          {result ? (
            <div className={`mt-5 rounded-[var(--radius-lg)] border p-4 ${result.ok ? "border-[var(--success)]/30 bg-[var(--success-soft)]" : "border-[var(--danger)]/30 bg-[var(--danger-soft)]"}`}>
              <div className="flex items-start gap-3">
                {result.ok ? <CheckCircle2 size={18} className="mt-0.5 text-[var(--success)]" /> : null}
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[var(--text)]">{result.message}</div>
                  {result.filePath ? <div className="mt-2 font-mono text-xs text-[var(--text-soft)]">{result.filePath}</div> : null}
                  {result.detailHref ? <Link href={result.detailHref} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--primary)]">查看前端页面 <ArrowRight size={14} /></Link> : null}
                  {result.sources?.length ? <div className="mt-3 space-y-1 text-xs text-[var(--text-soft)]">{result.sources.map((source) => <div key={source.fileName}>{source.fileName}: {source.textLength} chars · {source.extractionMethod}{source.warnings.length ? ` · ${source.warnings.join(" / ")}` : ""}</div>)}</div> : null}
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-[var(--radius-lg)]">
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[var(--text)]">最近生成</h2>
              <p className="mt-1 text-sm text-[var(--text-soft)]">静态文件列表</p>
            </div>
            <Badge variant="secondary">{documents.length}</Badge>
          </div>

          <div className="mt-5 space-y-3">
            {isListLoading ? <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 text-sm text-[var(--text-soft)]">正在加载...</div> : null}
            {!isListLoading && documents.length === 0 ? <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--bg-soft)] p-5 text-center text-sm text-[var(--text-soft)]">还没有生成过文档词汇。</div> : null}
            {documents.map((document) => (
              <Link key={document.slug} href={`/vocabulary/generated/${document.slug}`} className="block rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)] transition hover:border-[var(--primary)]/40 hover:bg-[var(--card-hover)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-[var(--text)]">{document.title}</div>
                    <div className="mt-1 text-xs text-[var(--text-soft)]">{formatDate(document.updatedAt)}</div>
                  </div>
                  <Badge>{document.wordCount} words</Badge>
                </div>
                <p className="mt-3 line-clamp-2 text-xs leading-5 text-[var(--text-soft)]">{document.summary || document.sourceFileNames.join(", ")}</p>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
