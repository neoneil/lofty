"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

import {
  PTESubTab,
  pteSubTabMap,
  MainTab,
} from "./pte-config";

type Props = {
  currentMain: MainTab;
  currentSub?: PTESubTab;
};

function SubTabItem({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {

  return (

    <Link
      href={href}
      className={`group relative flex h-8 flex-shrink-0 items-center justify-center rounded-[var(--radius-sm)] px-3 text-[12px] font-semibold tracking-[0.02em] transition-all duration-200 sm:h-9 sm:px-3.5 sm:text-[13px] ${
        active
          ? "bg-[var(--primary-soft)] text-[var(--primary)]"
          : "bg-transparent text-[var(--text-soft)] hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"
      }`}
    >
      <span className="whitespace-nowrap">{label}</span>
      <span
        className={`absolute inset-x-2 -bottom-px h-0.5 rounded-full transition ${
          active
            ? "bg-[var(--primary)] opacity-100"
            : "bg-[var(--primary)] opacity-0 group-hover:opacity-35"
        }`}
      />

    </Link>

  );

}

export default function PTETopNav({
  currentMain,
  currentSub,
}: Props) {

  const pathname =
    usePathname();

  const pathnameSub =
    pathname.split("/")[3] as PTESubTab | undefined;

  const activeSub =
    currentSub ?? pathnameSub;

  const subTabs =
    pteSubTabMap[currentMain];

  return (

    <div className="mb-1 mt-3 sm:mb-2 sm:mt-4">

      <div className="flex w-fit max-w-full gap-1.5 overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-1 shadow-[var(--shadow-sm)] scrollbar-hide sm:gap-2">

        {subTabs.map((tab) => (

          <SubTabItem
            key={tab.href}
            label={tab.label}
            href={tab.href}
            active={activeSub === tab.key}
          />

        ))}

      </div>

    </div>

  );

}
