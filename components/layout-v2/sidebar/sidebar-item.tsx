"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type Props = {
  href: string;
  icon: ReactNode;
  label: string;
  collapsed?: boolean;
  badge?: string;
  nested?: boolean;
};

export function SidebarItem({
  href,
  icon,
  label,
  collapsed,
  badge,
  nested,
}: Props) {

  const pathname =
    usePathname();

  const active =
    href === "/"
      ? pathname === "/"
      : pathname.startsWith(href);

  return (

    <Link
      href={href}
      className={cn(
        "group flex h-10 items-center rounded-[var(--radius-xsm)] transition-all duration-300 sm:h-11",
        collapsed ? "justify-center px-0" : "justify-between px-2.5 sm:px-3",
        active
          ? "bg-[var(--primary-soft)] text-[var(--primary)]"
          : "text-[var(--text-soft)] hover:bg-[var(--bg-soft)] hover:text-[var(--text)]",
        nested && !collapsed && "ml-5 sm:ml-6",
      )}
    >

      <div className="inline-flex min-w-0 items-center gap-2.5 sm:gap-3">

        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center">

          {icon}

        </div>

        <span
          className={cn(
            "overflow-hidden whitespace-nowrap text-[13px] font-medium transition-all duration-300 sm:text-sm",
            collapsed
              ? "w-0 -translate-x-3 opacity-0"
              : "w-auto translate-x-0 opacity-100",
          )}
        >

          {label}

        </span>

      </div>

      {!collapsed && badge && (

        <div className="rounded-full bg-[var(--card)] px-2 py-0.5 text-[10px] text-[var(--text-soft)] shadow-[var(--shadow-sm)] sm:text-[11px]">

          {badge}

        </div>

      )}

    </Link>

  );

}