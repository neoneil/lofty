"use client";

import { Sparkles } from "lucide-react";

import { Breadcrumbs } from "./breadcrumbs";
import { NotificationDropdown } from "./notification-dropdown";
import { SearchCommand } from "./search-command";
import { ThemeToggle } from "./theme-toggle";
import { TopbarUser } from "./topbar-user";

export function Topbar() {
  return (
    <header className="sticky top-0 z-40 flex h-[var(--topbar-height)] items-center justify-between border-b border-[var(--border)] bg-white/80 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-6">
        <Breadcrumbs />
      </div>

      <div className="flex items-center gap-3">
        <SearchCommand />

        <button className="hidden h-11 items-center gap-2 rounded-full bg-[var(--primary)] px-4 text-sm font-medium text-white shadow-[var(--shadow-sm)] transition-all duration-300 hover:bg-[var(--primary-hover)] xl:flex">
          <Sparkles size={16} />
          AI Coach
        </button>

        <NotificationDropdown />

        <ThemeToggle />

        <TopbarUser />
      </div>
    </header>
  );
}
