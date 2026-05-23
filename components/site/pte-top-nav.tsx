"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

import {
  PTESubTab,
  pteSubTabMap,
  MainTab,
} from "./pte-config";

import {
  Card,
  CardContent,
} from "@/components/ui-v2/card";

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
      className="block w-fit flex-shrink-0"
    >

      <Card
        className={`overflow-hidden border transition-all duration-200 ${active ? "border-[var(--primary)] bg-[var(--primary)] shadow-[0_10px_30px_rgba(0,0,0,0.08)]" : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)] hover:bg-[var(--bg-soft)]"}`}
      >

        <CardContent
          className={`flex min-h-[42px] items-center justify-center px-4 py-2 text-[12px] font-semibold whitespace-nowrap sm:min-h-[46px] sm:px-5 sm:py-2.5 sm:text-[13px] ${active ? "text-white" : "text-[var(--text-soft)]"}`}
        >

          {label}

        </CardContent>

      </Card>

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

    <div className="mb-4 sm:mb-6">

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide sm:gap-3">

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