"use client";

import { Moon } from "lucide-react";

export function ThemeToggle() {

  return (
    <button
      className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--text-soft)] transition-all duration-300 hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"
    >

      <Moon size={18} />

    </button>
  );

}