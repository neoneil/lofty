import { ReactNode } from "react";

import { Sidebar } from "@/components/layout-v2/sidebar/sidebar";

import { Topbar } from "@/components/layout-v2/topbar/topbar";

type Props = {
  children: ReactNode;
};

export function AppLayout({
  children,
}: Props) {

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">

      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">

        <Topbar />

        <main className="flex-1 overflow-y-auto p-6">

          {children}

        </main>

      </div>

    </div>
  );

}