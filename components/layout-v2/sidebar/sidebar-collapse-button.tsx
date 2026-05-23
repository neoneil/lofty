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
      className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--text-soft)] shadow-[var(--shadow-sm)] transition-all duration-300 hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"
    >

      {collapsed ? (
        <PanelLeftOpen size={18} />
      ) : (
        <PanelLeftClose size={18} />
      )}

    </button>
  );

}