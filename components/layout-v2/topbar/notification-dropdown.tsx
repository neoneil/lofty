"use client";

import { Bell } from "lucide-react";

export function NotificationDropdown() {

  return (
    <button
      className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--text-soft)] transition-all duration-300 hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"
    >

      <Bell size={18} />

    </button>
  );

}