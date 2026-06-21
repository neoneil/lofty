"use client";

import { useState } from "react";

type Props = {
  title: string;
  subtitle?: string;
  badge?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

export default function AccordionCard({
  title,
  subtitle,
  badge,
  children,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={`
        card-interactive group overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]
        hover:border-[var(--primary)]/45 hover:bg-[var(--card-hover)] hover:shadow-[var(--shadow-md)]
      `}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="
          btn-interactive flex w-full items-start justify-between gap-4 px-5 py-5 text-left
          hover:bg-[var(--bg-soft)]
          sm:px-6 
        "
      >
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {badge && (
              <span className="rounded-full bg-[var(--primary)] px-2.5 py-1 text-xs font-medium text-white shadow-[var(--shadow-sm)]">
                {badge}
              </span>
            )}

            {subtitle && (
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-faint)]">
                {subtitle}
              </span>
            )}
          </div>

          <h3 className="text-base font-semibold leading-7 text-[var(--text)] transition-colors duration-300 group-hover:text-[var(--primary)] sm:text-lg">
            {title}
          </h3>
        </div>

        <span
          className={`
            mt-1 shrink-0 rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-1 text-sm font-medium text-[var(--text-soft)]
            transition-all duration-300
            group-hover:border-[var(--primary)] group-hover:bg-[var(--primary)] group-hover:text-white
            ${open ? "rotate-180" : ""}
          `}
        >
          ˅
        </span>
      </button>

      {open && (
        <div
          className="border-t border-[var(--border)] px-5 pb-5 pt-5 text-[var(--text)] sm:px-6"
        >
          {children}
        </div>
      )}
    </div>
  );
}
