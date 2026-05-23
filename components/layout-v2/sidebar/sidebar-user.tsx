"use client";

import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  collapsed?: boolean;
};

export function SidebarUser({
  collapsed,
}: Props) {

  return (
    <button
      className={cn(
        "flex w-full items-center rounded-[var(--radius-lg)] bg-[var(--bg-soft)] p-3 transition-all duration-300 hover:bg-[var(--border-soft)]",
        collapsed
          ? "justify-center"
          : "justify-between"
      )}
    >

      <div className="flex min-w-0 items-center gap-3">

        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-sm font-semibold text-[var(--primary)]">

          V

        </div>

        <div
          className={cn(
            "overflow-hidden transition-all duration-300",
            collapsed
              ? "w-0 opacity-0"
              : "w-auto opacity-100"
          )}
        >

          <div className="truncate text-sm font-medium text-[var(--text)]">

            Vivi

          </div>

          <div className="truncate text-xs text-[var(--text-soft)]">

            Premium Student

          </div>

        </div>

      </div>

      {!collapsed && (

        <ChevronRight
          size={16}
          className="text-[var(--text-faint)]"
        />

      )}

    </button>
  );

}