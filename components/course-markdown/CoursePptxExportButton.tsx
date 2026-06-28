"use client";

import { Check, FileDown, LoaderCircle, TriangleAlert } from "lucide-react";

import { useCoursePptxExport } from "./CoursePptxExportProvider";

export default function CoursePptxExportButton() {
  const { error, isExporting, progress, startExport } = useCoursePptxExport();
  const status = isExporting ? progress ? `正在生成 ${progress.completed}/${progress.total}` : "正在准备幻灯片" : error ? error : progress ? "PPTX 已导出" : null;

  return (
    <div className="relative">
      {status ? <div className={`absolute right-14 top-1/2 max-w-[220px] -translate-y-1/2 whitespace-nowrap rounded-[var(--radius-sm)] border bg-[var(--card)] px-3 py-2 text-xs font-semibold shadow-[var(--shadow-md)] ${error ? "border-[var(--danger)]/35 text-[var(--danger)]" : "border-[var(--border)] text-[var(--text-soft)]"}`}>{status}</div> : null}
      <button type="button" onClick={() => void startExport()} disabled={isExporting} className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] text-[var(--primary)] shadow-[var(--shadow-lg)] transition hover:bg-[var(--bg-soft)] disabled:cursor-wait disabled:opacity-70" aria-label="一键导出 PPTX" title="导出 PPTX">
        {isExporting ? <LoaderCircle size={19} className="animate-spin" /> : error ? <TriangleAlert size={19} /> : progress ? <Check size={19} /> : <FileDown size={19} />}
      </button>
    </div>
  );
}
