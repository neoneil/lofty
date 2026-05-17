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
        card-interactive group overflow-hidden rounded-3xl border bg-(--bg) shadow-sm
        hover:shadow-xl
      `}
      style={{
        borderColor: "var(--border)",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="
          btn-interactive  flex w-full items-start justify-between gap-4 px-5 py-5 text-left
          hover:bg-black/2
          sm:px-6 
        "
      >
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {badge && (
              <span className="rounded bg-(--theme) px-2.5 py-1 text-xs font-medium text-white">
                {badge}
              </span>
            )}

            {subtitle && (
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-(--theme)">
                {subtitle}
              </span>
            )}
          </div>

          <h3 className="text-base font-medium leading-7 text-(--theme) transition-colors duration-300 group-hover:text-gray-800 sm:text-lg">
            {title}
          </h3>
        </div>

        <span
          className={`
            mt-1 shrink-0 rounded border px-3 py-1 text-sm font-medium text-(--theme)
            transition-all duration-300
            group-hover:bg-(--theme) group-hover:text-white
            ${open ? "rotate-180" : ""}
          `}
          style={{ borderColor: "var(--border)" }}
        >
          ˅
        </span>
      </button>

      {open && (
        <div
          className="border-t px-5 pb-5 pt-5 sm:px-6 text-(--theme)"
          style={{ borderColor: "var(--border)" }}
        >
          {children}
        </div>
      )}
    </div>
  );
}