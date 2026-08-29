"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

import {
  BookOpen,
  ChartNoAxesColumn,
  ChevronDown,
  Download,
  FolderOpen,
  GraduationCap,
  Headphones,
  LayoutDashboard,
  Mic,
  PenTool,
  Settings,
  Trophy,
  Video,
  Volume2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { BrandLockup } from "@/components/site/brand-lockup";
import { BRAND_NAME_CN } from "@/lib/brand";
import { getProfileExamTypeLabel, type ProfileExamType } from "@/lib/profile/exam-type";

type NavItem = {
  href: string;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  iconTone: "primary" | "success" | "warning" | "danger";
  badge?: string;
};

const primaryItems: NavItem[] = [
  {
    href: "/dashboard-v2",
    label: "总览",
    subtitle: "Dashboard",
    icon: <LayoutDashboard size={16} />,
    iconTone: "primary",
  },
  {
    href: "/study-plan",
    label: "学习计划",
    subtitle: "Study Plan",
    icon: <GraduationCap size={16} />,
    iconTone: "success",
  },
  {
    href: "/classroom",
    label: "直播课堂",
    subtitle: "Classroom",
    icon: <Video size={16} />,
    iconTone: "danger",
    badge: "直播",
  },
];

const pteItems: NavItem[] = [
  {
    href: "/pte/speaking",
    label: "口语",
    subtitle: "Speaking",
    icon: <Mic size={15} />,
    iconTone: "danger",
  },
  {
    href: "/pte/writing",
    label: "写作",
    subtitle: "Writing",
    icon: <PenTool size={15} />,
    iconTone: "primary",
  },
  {
    href: "/pte/reading",
    label: "阅读",
    subtitle: "Reading",
    icon: <BookOpen size={15} />,
    iconTone: "success",
  },
  {
    href: "/pte/listening",
    label: "听力",
    subtitle: "Listening",
    icon: <Headphones size={15} />,
    iconTone: "warning",
  },
];

const ieltsItems: NavItem[] = [
  {
    href: "/ielts/speaking",
    label: "口语",
    subtitle: "Speaking",
    icon: <Mic size={15} />,
    iconTone: "danger",
  },
  {
    href: "/ielts/writing",
    label: "写作",
    subtitle: "Writing",
    icon: <PenTool size={15} />,
    iconTone: "primary",
  },
  {
    href: "/ielts/reading",
    label: "阅读",
    subtitle: "Reading",
    icon: <BookOpen size={15} />,
    iconTone: "success",
  },
  {
    href: "/ielts/listening",
    label: "听力",
    subtitle: "Listening",
    icon: <Headphones size={15} />,
    iconTone: "warning",
  },
  {
    href: "/ielts/cambridge-downloads",
    label: "剑桥雅思下载",
    subtitle: "Downloads",
    icon: <Download size={15} />,
    iconTone: "primary",
  },
];

const utilityItems: NavItem[] = [
  {
    href: "/practice",
    label: "我的练习",
    subtitle: "My Practice",
    icon: <Mic size={16} />,
    iconTone: "primary",
  },
  {
    href: "/mock-test",
    label: "模拟考试",
    subtitle: "Mock Test",
    icon: <BookOpen size={16} />,
    iconTone: "warning",
  },
  {
    href: "/pronunciation",
    label: "发音",
    subtitle: "Pronunciation",
    icon: <Volume2 size={16} />,
    iconTone: "primary",
  },
  {
    href: "/vocabulary",
    label: "词汇",
    subtitle: "Vocabulary",
    icon: <BookOpen size={16} />,
    iconTone: "success",
  },
  {
    href: "/grammar",
    label: "语法",
    subtitle: "Grammar",
    icon: <PenTool size={16} />,
    iconTone: "primary",
  },
  {
    href: "/analytics",
    label: "学习分析",
    subtitle: "Analytics",
    icon: <ChartNoAxesColumn size={16} />,
    iconTone: "danger",
  },
  {
    href: "/audio-collection",
    label: "音频合集",
    subtitle: "Audio Collection",
    icon: <Headphones size={16} />,
    iconTone: "primary",
  },
  {
    href: "/achievements",
    label: "成就",
    subtitle: "Achievements",
    icon: <Trophy size={16} />,
    iconTone: "warning",
  },
  {
    href: "/settings",
    label: "设置",
    subtitle: "Settings",
    icon: <Settings size={16} />,
    iconTone: "primary",
  },
];

const bottomNavItems: NavItem[] = [
  {
    href: "/dashboard-v2",
    label: "总览",
    subtitle: "Dashboard",
    icon: <LayoutDashboard size={18} />,
    iconTone: "primary",
  },
  {
    href: "/pte",
    label: "PTE",
    subtitle: "Question Bank",
    icon: <Mic size={18} />,
    iconTone: "danger",
  },
  {
    href: "/ielts",
    label: "IELTS",
    subtitle: "Question Bank",
    icon: <BookOpen size={18} />,
    iconTone: "success",
  },
  {
    href: "/audio-collection",
    label: "音频",
    subtitle: "Audio",
    icon: <Headphones size={18} />,
    iconTone: "primary",
  },
  {
    href: "/settings",
    label: "我的",
    subtitle: "Profile",
    icon: <Settings size={18} />,
    iconTone: "warning",
  },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function TopbarItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item.href);
  const iconToneClasses = {
    primary: "bg-[var(--primary-soft)] text-[var(--primary)]",
    success: "bg-[var(--success-soft)] text-[var(--success)]",
    warning: "bg-[var(--warning-soft)] text-[var(--warning)]",
    danger: "bg-[var(--danger-soft)] text-[var(--danger)]",
  };

  return (
    <Link
      href={item.href}
      className={cn(
        "inline-flex h-12 flex-shrink-0 items-center gap-2 rounded-[var(--radius-md)] border px-2.5 transition-all duration-200",
        active
          ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
          : "border-[var(--border)] bg-[var(--card)] text-[var(--text-soft)] hover:bg-[var(--bg-soft)] hover:text-[var(--text)]",
      )}
    >
      <span className={cn("flex h-8 w-8 items-center justify-center rounded-[7px]", iconToneClasses[item.iconTone])}>
        {item.icon}
      </span>

      <span className="flex flex-col whitespace-nowrap text-left"><span className="text-xs font-semibold leading-4 text-[var(--text)]">{item.label}</span><span className="text-[9px] font-medium leading-3 text-[var(--text-faint)]">{item.subtitle}</span></span>

      {item.badge ? (
        <span className="rounded-full bg-[var(--primary)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}

function BottomNavItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item.href);
  const iconToneClasses = {
    primary: "bg-[var(--primary-soft)] text-[var(--primary)]",
    success: "bg-[var(--success-soft)] text-[var(--success)]",
    warning: "bg-[var(--warning-soft)] text-[var(--warning)]",
    danger: "bg-[var(--danger-soft)] text-[var(--danger)]",
  };

  return (
    <Link href={item.href} className={cn("flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] px-1 py-1.5 text-[10px] font-semibold transition", active ? "bg-[var(--primary-soft)] text-[var(--primary)]" : "text-[var(--text-soft)]")}>
      <span className={cn("flex h-8 w-8 items-center justify-center rounded-[8px]", active ? "bg-[var(--primary)] text-white" : iconToneClasses[item.iconTone])}>{item.icon}</span>
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function BankToggle({
  label,
  subtitle,
  tone,
  open,
  onClick,
}: {
  label: string;
  subtitle: string;
  tone: "primary" | "success";
  open: boolean;
  onClick: () => void;
}) {
  const iconClassName = tone === "primary" ? "bg-[var(--primary-soft)] text-[var(--primary)]" : "bg-[var(--success-soft)] text-[var(--success)]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-12 flex-shrink-0 items-center gap-2 rounded-[var(--radius-md)] border px-2.5 transition-all duration-200",
        open
          ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
          : "border-[var(--border)] bg-[var(--card)] text-[var(--text-soft)] hover:bg-[var(--bg-soft)] hover:text-[var(--text)]",
      )}
    >
      <span className={cn("flex h-8 w-8 items-center justify-center rounded-[7px]", iconClassName)}><FolderOpen size={16} /></span>
      <span className="flex flex-col whitespace-nowrap text-left"><span className="text-xs font-semibold leading-4 text-[var(--text)]">{label}</span><span className="text-[9px] font-medium leading-3 text-[var(--text-faint)]">{subtitle}</span></span>
      <ChevronDown
        size={15}
        className={cn("transition-transform duration-200", open && "rotate-180")}
      />
    </button>
  );
}

export function SidebarTopbar({ examType, canAccessAdmin }: { examType: ProfileExamType | null; canAccessAdmin: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const showPte = canAccessAdmin || examType !== "ielts";
  const showIelts = canAccessAdmin || examType !== "pte";
  const routeQuestionBank = pathname.startsWith("/pte") && showPte ? "pte" : pathname.startsWith("/ielts") && showIelts ? "ielts" : null;
  const [questionBankOverride, setQuestionBankOverride] = useState<{ pathname: string; value: "pte" | "ielts" | null } | null>(null);
  const overrideValue =
    questionBankOverride?.value === "pte" && showPte ? "pte"
      : questionBankOverride?.value === "ielts" && showIelts ? "ielts"
        : null;
  const activeQuestionBank = questionBankOverride?.pathname === pathname ? overrideValue : routeQuestionBank;
  const questionBankOpen = activeQuestionBank === "pte";
  const questionBankOpen2 = activeQuestionBank === "ielts";
  const brandLabel = `${BRAND_NAME_CN}${questionBankOpen ? "PTE" : questionBankOpen2 ? "IELTS" : getProfileExamTypeLabel(examType)}`;
  const hideBottomNav = isIeltsExamRoute(pathname, searchParams);
  const visibleBottomNavItems = bottomNavItems.filter((item) => {
    if (item.href === "/pte") return showPte;
    if (item.href === "/ielts") return showIelts;
    return true;
  });

  return (
    <div className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--sidebar)]/95 px-3 py-3 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="min-w-0 rounded-[var(--radius-md)] px-1 py-0.5"><BrandLockup size="sm" label={brandLabel} /></Link>
      </div>

      <div className="scrollbar-hide mt-3 flex gap-2 overflow-x-auto pb-1">
        {primaryItems.map((item) => (
          <TopbarItem key={item.href} item={item} pathname={pathname} />
        ))}

        {showPte ? <BankToggle
          label="PTE 题库"
          subtitle="Question Bank"
          tone="primary"
          open={questionBankOpen}
          onClick={() => setQuestionBankOverride({ pathname, value: questionBankOpen ? null : "pte" })}
        /> : null}

        {showIelts ? <BankToggle
          label="IELTS 题库"
          subtitle="Question Bank"
          tone="success"
          open={questionBankOpen2}
          onClick={() => setQuestionBankOverride({ pathname, value: questionBankOpen2 ? null : "ielts" })}
        /> : null}

        {utilityItems.map((item) => (
          <TopbarItem key={item.href} item={item} pathname={pathname} />
        ))}
      </div>

      {questionBankOpen && showPte ? (
        <div className="scrollbar-hide mt-2 flex gap-2 overflow-x-auto pb-1">
          {pteItems.map((item) => (
            <TopbarItem key={item.href} item={item} pathname={pathname} />
          ))}
        </div>
      ) : null}

      {questionBankOpen2 && showIelts ? (
        <div className="scrollbar-hide mt-2 flex gap-2 overflow-x-auto pb-1">
          {ieltsItems.map((item) => (
            <TopbarItem key={item.href} item={item} pathname={pathname} />
          ))}
        </div>
      ) : null}

      {!hideBottomNav ? <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--border)] bg-[var(--sidebar)]/95 px-2 pb-[calc(0.35rem+env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-12px_30px_rgba(15,23,42,0.10)] backdrop-blur-xl lg:hidden" aria-label="移动端主导航">
        <div className="mx-auto flex max-w-xl gap-1">
          {visibleBottomNavItems.map((item) => <BottomNavItem key={item.href} item={item} pathname={pathname} />)}
        </div>
      </nav> : null}
    </div>
  );
}

function isIeltsExamRoute(pathname: string, searchParams: URLSearchParams) {
  return (
    (pathname === "/ielts/listening" || pathname === "/ielts/reading") &&
    Boolean(searchParams.get("book")) &&
    Boolean(searchParams.get("test"))
  );
}
