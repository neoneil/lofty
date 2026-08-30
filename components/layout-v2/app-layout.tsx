"use client";

import { ReactNode } from "react";
import { useSearchParams } from "next/navigation";

import { Sidebar } from "@/components/layout-v2/sidebar/sidebar";
import { SidebarTopbar } from "@/components/layout-v2/sidebar/topbar";
import type { User } from "@supabase/supabase-js";
import { Topbar } from "@/components/layout-v2/topbar/topbar";
import { AchievementUnlockNotifier } from "@/components/achievements/achievement-unlock-notifier";
import { AppActivityHeartbeat } from "@/components/activity/app-activity-heartbeat";
import type { ProfileExamType } from "@/lib/profile/exam-type";

type Props = {
  children: ReactNode;
  user: User | null;
  canAccessAdmin: boolean;
  examType: ProfileExamType | null;
};

export function AppLayout({
  children,
  user,
  canAccessAdmin,
  examType,
}: Props) {
  const searchParams = useSearchParams();
  const isCourseEmbed = searchParams.get("embed") === "course";

  if (isCourseEmbed) {
    return <div className="min-h-dvh bg-[var(--bg)] text-[var(--text)]"><main className="min-h-dvh p-1 sm:p-2">{children}</main></div>;
  }

  return (
    <div className="flex h-dvh min-h-0 flex-col bg-[var(--bg)] lg:flex-row">

      <div className="lg:hidden">
        <SidebarTopbar examType={examType} canAccessAdmin={canAccessAdmin} />
      </div>

      <div className="hidden lg:block">
        <Sidebar userId={user?.id ?? null} examType={examType} canAccessAdmin={canAccessAdmin} />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">

        <Topbar user={user} canAccessAdmin={canAccessAdmin} />

        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto p-1 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-1">

          {children}

        </main>

      </div>

      <AchievementUnlockNotifier userId={user?.id ?? null} />
      <AppActivityHeartbeat enabled={Boolean(user?.id)} />

    </div>
  );

}
