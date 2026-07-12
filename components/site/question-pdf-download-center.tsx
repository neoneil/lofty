"use client";

import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-v2/card";

type DownloadItem = {
  key: string;
  label: string;
  description?: string;
  endpoint?: string;
  payload?: Record<string, unknown>;
};

type ExamType = "pte" | "ielts";

const PTE_DOWNLOAD_ITEMS: DownloadItem[] = [
  {
    key: "pte-wfd",
    label: "PTE WFD",
    description: "下载 WFD 全部题目",
  },
  {
    key: "pte-ra",
    label: "PTE RA",
    description: "下载 RA 全部题目",
  },
  {
    key: "pte-rs",
    label: "PTE RS",
    description: "下载 RS 全部题目",
  },
  {
    key: "pte-di",
    label: "PTE DI",
    description: "下载 DI 全部题目",
  },
  {
    key: "pte-rl",
    label: "PTE RL",
    description: "下载 RL 全部题目",
  },
  {
    key: "pte-asq",
    label: "PTE ASQ",
    description: "下载 ASQ 全部题目",
  },
  {
    key: "pte-sst",
    label: "PTE SST",
    description: "下载 SST 全部题目",
  },
  {
    key: "pte-fib-rw",
    label: "PTE FIB-RW",
    description: "下载 FIB-RW 全部题目",
  },
  {
    key: "pte-fib-r",
    label: "PTE FIB-R",
    description: "下载 FIB-R 全部题目",
  },
  {
    key: "pte-ro",
    label: "PTE RO",
    description: "下载 RO 全部题目",
  },
  {
    key: "pte-hiw",
    label: "PTE HIW",
    description: "下载 HIW 全部题目",
  },
  {
    key: "pte-smw",
    label: "PTE SMW",
    description: "下载 SMW 全部题目",
  },
];

const IELTS_DOWNLOAD_ITEMS: DownloadItem[] = [
  {
    key: "ielts-speaking",
    label: "雅思口语",
    description: "下载 Part 1、Part 2 和 Part 3 全部口语题",
    endpoint: "/api/ielts/speaking/export",
    payload: { part: "all" },
  },
  {
    key: "ielts-writing",
    label: "雅思写作",
    description: "下载全部 Writing Task 2 真题",
    endpoint: "/api/ielts/writing/export",
    payload: { category: "All", questionType: "All" },
  },
];

async function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;

  document.body.appendChild(a);
  a.click();
  a.remove();

  window.URL.revokeObjectURL(url);
}

export default function QuestionPdfDownloadCenter() {
  const [examType, setExamType] = useState<ExamType>("pte");
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const items = examType === "pte" ? PTE_DOWNLOAD_ITEMS : IELTS_DOWNLOAD_ITEMS;
  const title = examType === "pte" ? "PTE 题库 PDF" : "IELTS 题库 PDF";
  const subtitle = examType === "pte" ? "点击对应题型，直接下载数据库中的全部题目 PDF。" : "雅思下载第一版先开放口语与写作，后续可继续接入听力和阅读。";

  async function handleDownload(item: DownloadItem) {
    try {
      setLoadingKey(item.key);
      const endpoint = item.endpoint ?? "/api/export/questions";
      const payload = item.payload ?? { exportKey: item.key };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "PDF 导出失败");
      }

      const blob = await res.blob();
      await downloadBlob(blob, `${item.key}.pdf`);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "PDF 导出失败");
    } finally {
      setLoadingKey(null);
    }
  }

  return (
    <div className="space-y-8">
      <Card className="rounded-[var(--radius-lg)]">
        <CardHeader className="flex-col items-start gap-1">
          <Badge variant="secondary">Download Center</Badge>
          <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription className="mt-2">{subtitle}</CardDescription>
            </div>
            <div className="flex rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-1">
              {([
                { key: "pte", label: "PTE" },
                { key: "ielts", label: "IELTS" },
              ] as const).map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setExamType(option.key)}
                  className={`rounded-[var(--radius-sm)] px-4 py-2 text-sm font-semibold transition-colors ${examType === option.key ? "bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]" : "text-[var(--text-soft)] hover:bg-[var(--card)] hover:text-[var(--text)]"}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => handleDownload(item)}
              disabled={loadingKey === item.key}
              className="group cursor-pointer rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-soft)] p-5 text-left shadow-[var(--shadow-xs)] transition hover:-translate-y-0.5 hover:border-[var(--primary)]/45 hover:bg-[var(--card)] hover:shadow-[var(--shadow-md)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)] shadow-[var(--shadow-sm)] transition group-hover:scale-105">
                  {loadingKey === item.key ? (
                    <Loader2 size={19} className="animate-spin" />
                  ) : (
                    <FileText size={19} />
                  )}
                </div>

                <div className="rounded-full bg-[var(--card)] px-2.5 py-1 text-xs font-semibold text-[var(--text-soft)]">
                  PDF
                </div>
              </div>

              <div className="mt-5 text-lg font-semibold text-[var(--text)]">
                {item.label}
              </div>

              <div className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                {loadingKey === item.key
                  ? "Exporting..."
                  : item.description}
              </div>

              <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
                <Download size={15} />
                下载 PDF
              </div>
            </button>
          ))}
        </div>
        </CardContent>
      </Card>
    </div>
  );
}
