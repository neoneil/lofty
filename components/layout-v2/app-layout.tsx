"use client";

import { ReactNode } from "react";
import { useSearchParams } from "next/navigation";

import { Sidebar } from "@/components/layout-v2/sidebar/sidebar";
import { SidebarTopbar } from "@/components/layout-v2/sidebar/topbar";
import type { User } from "@supabase/supabase-js";
import { Topbar } from "@/components/layout-v2/topbar/topbar";
import { AchievementUnlockNotifier } from "@/components/achievements/achievement-unlock-notifier";

type Props = {
  children: ReactNode;
  user: User | null;
  canAccessAdmin: boolean;
};

export function AppLayout({
  children,
  user,
  canAccessAdmin,
}: Props) {
  const searchParams = useSearchParams();
  const isCourseEmbed = searchParams.get("embed") === "course";

  if (isCourseEmbed) {
    return <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]"><main className="min-h-screen p-1 sm:p-2">{children}</main></div>;
  }

  return (
    <div className="flex h-screen min-h-0 flex-col bg-[var(--bg)] lg:flex-row">

      <div className="lg:hidden">
        <SidebarTopbar />
      </div>

      <div className="hidden lg:block">
        <Sidebar userId={user?.id ?? null} />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">

        <Topbar user={user} canAccessAdmin={canAccessAdmin} />

        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto p-1">

          {children}

        </main>

      </div>

      <AchievementUnlockNotifier userId={user?.id ?? null} />

    </div>
  );

}
