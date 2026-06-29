"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, FileDown, FileText, LoaderCircle, Presentation, TriangleAlert } from "lucide-react";

import { ConfirmDialog } from "@/components/ui-v2/confirm-dialog";
import { useCoursePptxExport, type CourseExportFormat } from "./CoursePptxExportProvider";

export default function CoursePptxExportButton() {
  const { clearResult, error, isExporting, lastFormat, progress, startExport } = useCoursePptxExport();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [format, setFormat] = useState<CourseExportFormat>("pptx");
  const rootRef = useRef<HTMLDivElement>(null);
  const formatLabel = (lastFormat ?? format).toUpperCase();
  const status = isExporting ? progress ? `正在生成 ${formatLabel} ${progress.completed}/${progress.total}` : `正在准备 ${formatLabel}` : error ? error : progress ? `${formatLabel} 已导出` : null;

  const closeConfirm = useCallback(() => setConfirmOpen(false), []);

  useEffect(() => {
    if (isExporting || (!progress && !error)) return;

    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      clearResult();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [clearResult, error, isExporting, progress]);

  function confirmExport() {
    setConfirmOpen(false);
    void startExport(format);
  }

  return (
    <div ref={rootRef} className="relative">
      {status ? <div className={`absolute right-14 top-1/2 max-w-[220px] -translate-y-1/2 whitespace-nowrap rounded-[var(--radius-sm)] border bg-[var(--card)] px-3 py-2 text-xs font-semibold shadow-[var(--shadow-md)] ${error ? "border-[var(--danger)]/35 text-[var(--danger)]" : "border-[var(--border)] text-[var(--text-soft)]"}`}>{status}</div> : null}
      <button type="button" onClick={() => setConfirmOpen(true)} disabled={isExporting} className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] text-[var(--primary)] shadow-[var(--shadow-lg)] transition hover:bg-[var(--bg-soft)] disabled:cursor-wait disabled:opacity-70" aria-label="导出幻灯片" title="导出幻灯片">
        {isExporting ? <LoaderCircle size={19} className="animate-spin" /> : error ? <TriangleAlert size={19} /> : progress ? <Check size={19} /> : <FileDown size={19} />}
      </button>
      <ConfirmDialog open={confirmOpen} title="导出幻灯片" description="请选择导出格式。系统会保留当前背景与完整页面内容。" cancelLabel="取消" confirmLabel={`导出 ${format.toUpperCase()}`} onCancel={closeConfirm} onConfirm={confirmExport}>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => setFormat("pptx")} className={`rounded-[var(--radius-md)] border p-4 text-left transition ${format === "pptx" ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]" : "border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text-soft)] hover:border-[var(--primary)]"}`}><Presentation size={20} /><span className="mt-3 block text-sm font-semibold">PPTX</span><span className="mt-1 block text-xs leading-5 opacity-75">适合演示与分享</span></button>
          <button type="button" onClick={() => setFormat("pdf")} className={`rounded-[var(--radius-md)] border p-4 text-left transition ${format === "pdf" ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]" : "border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text-soft)] hover:border-[var(--primary)]"}`}><FileText size={20} /><span className="mt-3 block text-sm font-semibold">PDF</span><span className="mt-1 block text-xs leading-5 opacity-75">适合打印与归档</span></button>
        </div>
      </ConfirmDialog>
    </div>
  );
}
