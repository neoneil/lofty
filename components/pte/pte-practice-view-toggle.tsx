"use client";

import { Grid2X2, List } from "lucide-react";

export type PtePracticeViewMode = "grid" | "list";

export function getPtePracticeListLayoutClass(viewMode: PtePracticeViewMode) {
  return viewMode === "grid"
    ? "mx-auto grid w-[97.5%] gap-3 sm:grid-cols-2 xl:grid-cols-3"
    : "mx-auto w-[97.5%] space-y-1";
}

export function PtePracticeViewToggle({ value, onChange }: { value: PtePracticeViewMode; onChange: (value: PtePracticeViewMode) => void }) {
  return (
    <div className="flex w-fit rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-1 shadow-[var(--shadow-sm)]" aria-label="题目显示方式">
      <button type="button" onClick={() => onChange("grid")} aria-label="平铺视图" title="平铺视图" className={`flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] transition-colors ${value === "grid" ? "bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]" : "text-[var(--text-soft)] hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"}`}><Grid2X2 size={17} /></button>
      <button type="button" onClick={() => onChange("list")} aria-label="列表视图" title="列表视图" className={`flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] transition-colors ${value === "list" ? "bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]" : "text-[var(--text-soft)] hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"}`}><List size={18} /></button>
    </div>
  );
}
