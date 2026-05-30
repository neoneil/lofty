import { ReactNode } from "react";

import { Sidebar } from "@/components/layout-v2/sidebar/sidebar";
import type { User } from "@supabase/supabase-js";
import { Topbar } from "@/components/layout-v2/topbar/topbar";

type Props = {
  children: ReactNode;
   user: User | null;
};

export function AppLayout({
  children, user,
}: Props) {

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">

      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">

        <Topbar user={user} /> 

        <main className="flex-1 overflow-y-auto p-1">

          {children}

        </main>

      </div>

    </div>
  );

}