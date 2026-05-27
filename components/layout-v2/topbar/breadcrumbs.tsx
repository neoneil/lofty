"use client";

import Link from "next/link";

import {
  ChevronRight,
  Home,
} from "lucide-react";

import { usePathname } from "next/navigation";

const labelMap: Record<string, string> = {
  pte: "PTE",

  speaking: "Speaking",
  writing: "Writing",
  reading: "Reading",
  listening: "Listening",

  ra: "RA",
  rs: "RS",
  di: "DI",
  rl: "RL",
  asq: "ASQ",
  rts: "RTS",
  sgd: "SGD",

  swt: "SWT",
  essay: "Essay",

  rfib: "RFIB",
  fibrw: "FIBRW",
  rmcsa: "RMCSA",
  rmcma: "RMCMA",
  ro: "RO",

  sst: "SST",
  mcsa: "MCSA",
  mcma: "MCMA",
  fib_l: "FIB-L",
  smw: "SMW",
  hiw: "HIW",
  hcs: "HCS",
  wfd: "WFD",
};

function isAbbreviation(text: string) {
  return /^[A-Z-_]+$/.test(text);
}

export function Breadcrumbs() {

  const pathname =
    usePathname();

  const segments =
    pathname
      .split("/")
      .filter(Boolean);

  const filteredSegments =
    segments.filter((segment, index) => {

      const isLast =
        index === segments.length - 1;

      if (!isLast) {
        return true;
      }

      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          segment
        );

      const isNumericId =
        /^\d+$/.test(segment);

      return !isUUID && !isNumericId;

    });

  const items =
    filteredSegments.map((segment, index) => {

      const href =
        "/" +
        filteredSegments
          .slice(0, index + 1)
          .join("/");

      const label =
        labelMap[segment] ??
        segment;

      return {
        label,
        href,
        isAbbr:
          isAbbreviation(label),
      };

    });

  return (

    <div className="flex flex-wrap items-center gap-1.5 text-sm font-medium tracking-tight text-[var(--text-soft)]">

      <Link
        href="/"
        className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-soft)] transition-all duration-200 hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"
      >

        <Home
          size={16}
          strokeWidth={2.2}
        />

      </Link>

      {items.map((item, index) => {

        const isLast =
          index === items.length - 1;

        return (

          <div
            key={item.href}
            className="flex items-center gap-1.5"
          >

            <ChevronRight
              size={14}
              strokeWidth={2.4}
              className="text-[var(--text-faint)] opacity-70"
            />

            {isLast ? (

              <span
                className={`text-[var(--text)] ${item.isAbbr ? "font-semibold tracking-[0.08em]" : "font-semibold tracking-tight"}`}
              >

                {item.label}

              </span>

            ) : (

              <Link
                href={item.href}
                className={`transition-all duration-200 hover:text-[var(--text)] ${item.isAbbr ? "tracking-[0.08em]" : "tracking-tight"}`}
              >

                {item.label}

              </Link>

            )}

          </div>

        );

      })}

    </div>

  );

}