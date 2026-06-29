"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { Button } from "@/components/ui-v2/button";

type ConfirmDialogProps = {
  cancelLabel?: string;
  children?: ReactNode;
  confirmLabel?: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  title: string;
};

export function ConfirmDialog({ cancelLabel = "取消", children, confirmLabel = "确定", description, onCancel, onConfirm, open, title }: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel, open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-description" className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 text-[var(--text)] shadow-[var(--shadow-lg)] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0"><h2 id="confirm-dialog-title" className="text-lg font-semibold text-[var(--text)]">{title}</h2><p id="confirm-dialog-description" className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{description}</p></div>
          <button type="button" onClick={onCancel} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-soft)] transition hover:bg-[var(--bg-soft)] hover:text-[var(--text)]" aria-label="关闭确认窗口"><X size={17} /></button>
        </div>
        {children ? <div className="mt-5">{children}</div> : null}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" size="sm" onClick={onCancel}>{cancelLabel}</Button>
          <Button ref={confirmRef} type="button" size="sm" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
