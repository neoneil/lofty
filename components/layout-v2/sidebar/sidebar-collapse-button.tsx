"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

type Props = {
  collapsed: boolean;
  onToggle: () => void;
};

export function SidebarCollapseButton({
  collapsed,
  onToggle,
}: Props) {

  return (
    <button
      onClick={onToggle}
      className="flex h-9 w-9 shrink-0 scale-90 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--text-soft)] opacity-25 shadow-none transition-all duration-300 hover:scale-100 hover:bg-[var(--bg-soft)] hover:text-[var(--text)] hover:opacity-100 hover:shadow-[var(--shadow-sm)] focus-visible:scale-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/25"
      aria-label={collapsed ? "展开侧边栏" : "收起侧边栏"}
    >

      {collapsed ? (
        <PanelLeftOpen size={18} />
      ) : (
        <PanelLeftClose size={18} />
      )}

    </button>
  );

}
