"use client";

import { useState } from "react";

type DownloadItem = {
  key: string;
  label: string;
  description?: string;
};

const DOWNLOAD_ITEMS: DownloadItem[] = [
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
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  async function handleDownload(item: DownloadItem) {
    try {
      setLoadingKey(item.key);

      const res = await fetch("/api/export/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          exportKey: item.key,
        }),
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
      <section className="rounded-[30px] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-(--theme)">
            PTE DOWNLOAD CENTER
          </p>

          <h2 className="text-2xl font-semibold text-(--theme)">
            PTE 题库 PDF 下载中心
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            点击对应题型，直接下载数据库中的全部题目 PDF
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DOWNLOAD_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => handleDownload(item)}
              disabled={loadingKey === item.key}
              className="cursor-pointer rounded-3xl border border-gray-200 bg-(--bg) p-5 text-left transition hover:shadow-md hover:border-(--theme) disabled:opacity-60"
            >
              <div className="mb-2 text-lg font-semibold text-(--theme)">
                {item.label}
              </div>

              <div className="text-sm leading-6 text-gray-600">
                {loadingKey === item.key
                  ? "Exporting..."
                  : item.description}
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}