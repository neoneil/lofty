"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, FileText } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
};

export function CollapsibleAnswer({ children }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)]">
      <button type="button" onClick={() => setOpen((current) => !current)} className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-[var(--text)]">
        <span className="flex items-center gap-2"><FileText size={16} className="text-[var(--primary)]" />查看答案与解析</span>
        <ChevronDown size={16} className={cn("text-[var(--text-soft)] transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && <div className="space-y-2 border-t border-[var(--border)] p-4">{children}</div>}
    </div>
  );
}
