"use client";

import Link from "next/link";
import { ShieldCheck, Sparkles } from "lucide-react";

import { Breadcrumbs } from "./breadcrumbs";
import { NotificationDropdown } from "./notification-dropdown";
import { SearchCommand } from "./search-command";
import { ThemeToggle } from "./theme-toggle";
import { TopbarUser } from "./topbar-user";
import type { User } from "@supabase/supabase-js";

type Props = {
  user: User | null;
  canAccessAdmin: boolean;
};
export function Topbar({ user, canAccessAdmin }: Props) {
  const openAiCoach = () => {
    window.dispatchEvent(new Event("lofty:open-chat-widget"));
  };

  return (
    <header className="sticky top-0 z-40 flex h-[var(--topbar-height)] items-center justify-between border-b border-[var(--border)] bg-[color:var(--card)]/80 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-6">
        <Breadcrumbs />
      </div>

      <div className="flex items-center gap-3">
        <SearchCommand />

        <button type="button" onClick={openAiCoach} className="hidden h-11 items-center gap-2 rounded-full bg-[var(--primary)] px-4 text-sm font-medium text-white shadow-[var(--shadow-sm)] transition-all duration-300 hover:bg-[var(--primary-hover)] xl:flex">
          <Sparkles size={16} />
          小马哥AI
        </button>

        <NotificationDropdown />

        <ThemeToggle />

        <TopbarUser user={user} />

        {canAccessAdmin ? <Link href="/admin" aria-label="进入管理员后台" title="管理员" className="ml-1 flex h-11 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-3 text-sm font-semibold text-[var(--primary)] shadow-[var(--shadow-sm)] transition-colors hover:border-[var(--primary)]/40 hover:bg-[var(--primary-soft)]"><ShieldCheck size={17} /><span className="hidden xl:inline">管理员</span></Link> : null}
      </div>
    </header>
  );
}
