"use client";

import { ChevronDown } from "lucide-react";

export function TopbarUser() {

  return (
    <button
      className="flex items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--card)] px-2 py-2 transition-all duration-300 hover:bg-[var(--bg-soft)]"
    >

      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary-soft)] text-sm font-semibold text-[var(--primary)]">

        V

      </div>

      <div className="hidden text-left lg:block">

        <div className="text-sm font-medium text-[var(--text)]">

          Vivi

        </div>

        <div className="text-xs text-[var(--text-soft)]">

          Premium

        </div>

      </div>

      <ChevronDown
        size={16}
        className="hidden text-[var(--text-faint)] lg:block"
      />

    </button>
  );

}