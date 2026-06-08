"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  BookOpen,
  ChartNoAxesColumn,
  ChevronDown,
  FolderOpen,
  GraduationCap,
  Headphones,
  LayoutDashboard,
  Mic,
  PenTool,
  Settings,
  Video,
} from "lucide-react";

import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
};

const primaryItems: NavItem[] = [
  {
    href: "/dashboard-v2",
    label: "Dashboard",
    icon: <LayoutDashboard size={16} />,
  },
  {
    href: "/classroom",
    label: "Classroom",
    icon: <Video size={16} />,
    badge: "Live",
  },
  {
    href: "/study-plan",
    label: "Study Plan",
    icon: <GraduationCap size={16} />,
  },
];

const pteItems: NavItem[] = [
  {
    href: "/pte/speaking",
    label: "Speaking",
    icon: <Mic size={15} />,
  },
  {
    href: "/pte/writing",
    label: "Writing",
    icon: <PenTool size={15} />,
  },
  {
    href: "/pte/reading",
    label: "Reading",
    icon: <BookOpen size={15} />,
  },
  {
    href: "/pte/listening",
    label: "Listening",
    icon: <Headphones size={15} />,
  },
];

const ieltsItems: NavItem[] = [
  {
    href: "/ielts/speaking",
    label: "Speaking",
    icon: <Mic size={15} />,
  },
  {
    href: "/ielts/writing",
    label: "Writing",
    icon: <PenTool size={15} />,
  },
  {
    href: "/ielts/reading",
    label: "Reading",
    icon: <BookOpen size={15} />,
  },
  {
    href: "/ielts/listening",
    label: "Listening",
    icon: <Headphones size={15} />,
  },
];

const utilityItems: NavItem[] = [
  {
    href: "/practice",
    label: "My Practice",
    icon: <Mic size={16} />,
  },
  {
    href: "/mock-test",
    label: "Mock Test",
    icon: <BookOpen size={16} />,
  },
  {
    href: "/vocabulary",
    label: "Vocabulary",
    icon: <BookOpen size={16} />,
  },
  {
    href: "/grammar",
    label: "Grammar",
    icon: <PenTool size={16} />,
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: <ChartNoAxesColumn size={16} />,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: <Settings size={16} />,
  },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function TopbarItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item.href);

  return (
    <Link
      href={item.href}
      className={cn(
        "inline-flex h-10 flex-shrink-0 items-center gap-2 rounded-[var(--radius-md)] border px-3 text-[13px] font-medium transition-all duration-200",
        active
          ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
          : "border-[var(--border)] bg-[var(--card)] text-[var(--text-soft)] hover:bg-[var(--bg-soft)] hover:text-[var(--text)]",
      )}
    >
      <span className="flex h-4 w-4 items-center justify-center">
        {item.icon}
      </span>

      <span className="whitespace-nowrap">{item.label}</span>

      {item.badge ? (
        <span className="rounded-full bg-[var(--primary)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}

function BankToggle({
  label,
  open,
  onClick,
}: {
  label: string;
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-10 flex-shrink-0 items-center gap-2 rounded-[var(--radius-md)] border px-3 text-[13px] font-semibold transition-all duration-200",
        open
          ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
          : "border-[var(--border)] bg-[var(--card)] text-[var(--text-soft)] hover:bg-[var(--bg-soft)] hover:text-[var(--text)]",
      )}
    >
      <FolderOpen size={16} />
      <span>{label}</span>
      <ChevronDown
        size={15}
        className={cn("transition-transform duration-200", open && "rotate-180")}
      />
    </button>
  );
}

export function SidebarTopbar() {
  const pathname = usePathname();
  const [questionBankOpen, setQuestionBankOpen] = useState(() =>
    pathname.startsWith("/pte"),
  );
  const [questionBankOpen2, setQuestionBankOpen2] = useState(() =>
    pathname.startsWith("/ielts"),
  );

  return (
    <div className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--sidebar)]/95 px-3 py-3 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 text-base font-semibold tracking-tight text-[var(--text)]"
        >
          <Image
            src="/brand3.png"
            alt="LoftyPTE"
            width={34}
            height={34}
            className="h-9 w-9 flex-shrink-0"
          />
          <span className="truncate">LoftyPTE</span>
        </Link>
      </div>

      <div className="scrollbar-hide mt-3 flex gap-2 overflow-x-auto pb-1">
        {primaryItems.map((item) => (
          <TopbarItem key={item.href} item={item} pathname={pathname} />
        ))}

        <BankToggle
          label="PTE Bank"
          open={questionBankOpen}
          onClick={() => setQuestionBankOpen(!questionBankOpen)}
        />

        <BankToggle
          label="IELTS Bank"
          open={questionBankOpen2}
          onClick={() => setQuestionBankOpen2(!questionBankOpen2)}
        />

        {utilityItems.map((item) => (
          <TopbarItem key={item.href} item={item} pathname={pathname} />
        ))}
      </div>

      {questionBankOpen ? (
        <div className="scrollbar-hide mt-2 flex gap-2 overflow-x-auto pb-1">
          {pteItems.map((item) => (
            <TopbarItem key={item.href} item={item} pathname={pathname} />
          ))}
        </div>
      ) : null}

      {questionBankOpen2 ? (
        <div className="scrollbar-hide mt-2 flex gap-2 overflow-x-auto pb-1">
          {ieltsItems.map((item) => (
            <TopbarItem key={item.href} item={item} pathname={pathname} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
