import { ReactNode } from "react";

import { Sidebar } from "@/components/layout-v2/sidebar/sidebar";
import { SidebarTopbar } from "@/components/layout-v2/sidebar/topbar";
import type { User } from "@supabase/supabase-js";
import { Topbar } from "@/components/layout-v2/topbar/topbar";

type Props = {
  children: ReactNode;
  user: User | null;
};

export function AppLayout({
  children,
  user,
}: Props) {

  return (
    <div className="flex h-screen min-h-0 flex-col bg-[var(--bg)] lg:flex-row">

      <div className="lg:hidden">
        <SidebarTopbar />
      </div>

      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">

        <Topbar user={user} /> 

        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto p-1">

          {children}

        </main>

      </div>

    </div>
  );

}
