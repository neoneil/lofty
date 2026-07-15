"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type Props = {
  href: string;
  icon: ReactNode;
  label: string;
  subtitle?: string;
  iconTone?: "primary" | "success" | "warning" | "danger";
  collapsed?: boolean;
  badge?: string;
  nested?: boolean;
  disabled?: boolean;
};

export function SidebarItem({
  href,
  icon,
  label,
  subtitle,
  iconTone = "primary",
  collapsed,
  badge,
  nested,
  disabled = false,
}: Props) {

  const iconToneClasses = {
    primary: "bg-[var(--primary-soft)] text-[var(--primary)]",
    success: "bg-[var(--success-soft)] text-[var(--success)]",
    warning: "bg-[var(--warning-soft)] text-[var(--warning)]",
    danger: "bg-[var(--danger-soft)] text-[var(--danger)]",
  };

  const pathname =
    usePathname();

  const active =
    disabled
      ? false
      : href === "/"
      ? pathname === "/"
      : pathname.startsWith(href);

  return (

    <Link
      href={disabled ? "#" : href}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : undefined}
      onClick={disabled ? (event) => event.preventDefault() : undefined}
      className={cn(
        "group flex h-12 items-center rounded-[var(--radius-xsm)] transition-all duration-300",
        collapsed ? "justify-center px-0" : "justify-between px-2.5 sm:px-3",
        disabled
          ? "cursor-not-allowed text-[var(--text-faint)] opacity-55"
          : active
          ? "bg-[var(--primary-soft)] text-[var(--primary)]"
          : "text-[var(--text-soft)] hover:bg-[var(--bg-soft)] hover:text-[var(--text)]",
        nested && !collapsed && "ml-5 w-[calc(100%-1.25rem)] sm:ml-6 sm:w-[calc(100%-1.5rem)]",
      )}
    >

      <div className={cn("inline-flex min-w-0 items-center", collapsed ? "gap-0" : "gap-2.5 sm:gap-3")}>

        <div className={cn("flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[7px]", disabled ? "bg-[var(--bg-soft)] text-[var(--text-faint)]" : iconToneClasses[iconTone])}>

          {icon}

        </div>

        <span
          className={cn(
            "flex min-w-0 flex-col overflow-hidden whitespace-nowrap transition-all duration-300",
            collapsed
              ? "w-0 -translate-x-3 opacity-0"
              : "w-auto translate-x-0 opacity-100",
          )}
        >

          <span className="truncate text-[13px] font-semibold leading-4 text-[var(--text)]">{label}</span>
          {subtitle ? <span className="mt-0.5 truncate text-[10px] font-medium leading-3 text-[var(--text-faint)]">{subtitle}</span> : null}

        </span>

      </div>

      {!collapsed && badge && (

        <div className="rounded-full bg-[var(--card)] px-2 py-0.5 text-[10px] text-[var(--text-soft)] shadow-[var(--shadow-sm)]">

          {badge}

        </div>

      )}

    </Link>

  );

}
