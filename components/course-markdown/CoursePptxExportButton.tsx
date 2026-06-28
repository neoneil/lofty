"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, FileDown, LoaderCircle, TriangleAlert } from "lucide-react";

import { ConfirmDialog } from "@/components/ui-v2/confirm-dialog";
import { useCoursePptxExport } from "./CoursePptxExportProvider";

export default function CoursePptxExportButton() {
  const { clearResult, error, isExporting, progress, startExport } = useCoursePptxExport();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const status = isExporting ? progress ? `正在生成 ${progress.completed}/${progress.total}` : "正在准备幻灯片" : error ? error : progress ? "PPTX 已导出" : null;

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
    void startExport();
  }

  return (
    <div ref={rootRef} className="relative">
      {status ? <div className={`absolute right-14 top-1/2 max-w-[220px] -translate-y-1/2 whitespace-nowrap rounded-[var(--radius-sm)] border bg-[var(--card)] px-3 py-2 text-xs font-semibold shadow-[var(--shadow-md)] ${error ? "border-[var(--danger)]/35 text-[var(--danger)]" : "border-[var(--border)] text-[var(--text-soft)]"}`}>{status}</div> : null}
      <button type="button" onClick={() => setConfirmOpen(true)} disabled={isExporting} className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] text-[var(--primary)] shadow-[var(--shadow-lg)] transition hover:bg-[var(--bg-soft)] disabled:cursor-wait disabled:opacity-70" aria-label="一键导出 PPTX" title="导出 PPTX">
        {isExporting ? <LoaderCircle size={19} className="animate-spin" /> : error ? <TriangleAlert size={19} /> : progress ? <Check size={19} /> : <FileDown size={19} />}
      </button>
      <ConfirmDialog open={confirmOpen} title="确认导出 PPTX？" description="系统将按当前幻灯片样式生成完整 PPTX。内容较多时可能需要等待一段时间。" cancelLabel="取消" confirmLabel="确定导出" onCancel={closeConfirm} onConfirm={confirmExport} />
    </div>
  );
}
