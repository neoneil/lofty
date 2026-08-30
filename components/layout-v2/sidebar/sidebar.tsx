"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  BookOpen,
  ChartNoAxesColumn,
  ChevronDown,
  Download,
  FolderOpen,
  GraduationCap,
  Headphones,
  LayoutDashboard,
  LibraryBig,
  Mic,
  NotebookPen,
  PenTool,
  Trophy,
  Video,
  Volume2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { SidebarCollapseButton } from "./sidebar-collapse-button";
import { SidebarGroup } from "./sidebar-group";
import { SidebarItem } from "./sidebar-item";
import { SidebarUser } from "./sidebar-user";
import { SidebarSettings } from "./sidebar-settings";
import { BrandLockup } from "@/components/site/brand-lockup";
import { BRAND_NAME_CN } from "@/lib/brand";
import { ConfirmDialog } from "@/components/ui-v2/confirm-dialog";
import { getProfileExamTypeLabel, type ProfileExamType } from "@/lib/profile/exam-type";

export function Sidebar({ userId, examType, canAccessAdmin }: { userId: string | null; examType: ProfileExamType | null; canAccessAdmin: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const showPte = canAccessAdmin || examType !== "ielts";
  const showIelts = canAccessAdmin || examType !== "pte";
  const shouldStartCollapsed = isIeltsExamRoute(pathname, searchParams);
  const [collapsed, setCollapsed] = useState(shouldStartCollapsed);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setCollapsed(shouldStartCollapsed), 0);
    return () => window.clearTimeout(timer);
  }, [shouldStartCollapsed]);

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
  const shouldConfirmLeave = isIeltsExamRoute(pathname, searchParams);

  function handleSidebarClickCapture(event: React.MouseEvent<HTMLElement>) {
    if (!shouldConfirmLeave || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const link = (event.target as Element).closest<HTMLAnchorElement>("a[href]");
    if (!link || link.getAttribute("aria-disabled") === "true") return;

    const href = link.getAttribute("href");
    if (!href || href.startsWith("#")) return;

    const targetUrl = new URL(href, window.location.origin);
    if (targetUrl.origin !== window.location.origin) return;

    const targetHref = `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
    const currentHref = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    if (targetHref === currentHref) return;

    event.preventDefault();
    setPendingHref(targetHref);
  }

  function confirmLeave() {
    if (!pendingHref) return;
    const href = pendingHref;
    setPendingHref(null);
    router.push(href);
  }

  return (
    <aside
      onClickCapture={handleSidebarClickCapture}
      className={cn(
        "sticky top-0 flex h-dvh flex-col overflow-hidden border-r border-[var(--border)] bg-[var(--sidebar)] p-4 transition-all duration-300",
        collapsed ? "w-[84px]" : "w-[230px]",
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center",
          collapsed ? "justify-center" : "gap-2 pl-2 pr-0",
        )}
      >
        {!collapsed && (
          <Link href="/" className="min-w-0 flex-1 rounded-[var(--radius-md)] px-1.5 py-1 transition-colors duration-200 hover:bg-[var(--bg-soft)]"><BrandLockup size="sm" label={brandLabel} /></Link>
        )}

        <SidebarCollapseButton
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />
      </div>

      <div className="scrollbar-hide mt-6 flex-1 space-y-6 overflow-y-auto pr-1">
        <SidebarGroup collapsed={collapsed}>
          <SidebarItem
            href="/dashboard-v2"
            label="总览"
            subtitle="Dashboard"
            icon={<LayoutDashboard size={18} />}
            iconTone="primary"
            collapsed={collapsed}
          />

          <SidebarItem
            href="/study-plan"
            label="学习计划"
            subtitle="Study Plan"
            icon={<GraduationCap size={18} />}
            iconTone="success"
            collapsed={collapsed}
          />

          <SidebarItem
            href="/classroom"
            label="直播课堂"
            subtitle="Classroom"
            icon={<Video size={18} />}
            iconTone="danger"
            collapsed={collapsed}
            badge="直播"
          />
        </SidebarGroup>

        {showPte ? <SidebarGroup title="PTE 题库" subtitle="PTE Question Bank" collapsed={collapsed}>
          <button
            onClick={() => setQuestionBankOverride({ pathname, value: questionBankOpen ? null : "pte" })}
            className={cn(
              "flex h-12 w-full items-center rounded-[var(--radius-xsm)] text-[var(--text-soft)] transition-all duration-300 hover:bg-[var(--bg-soft)] hover:text-[var(--text)]",
              collapsed ? "justify-center px-0" : "justify-between px-2.5 sm:px-3",
            )}
          >
            <div className={cn("flex items-center", collapsed ? "gap-0" : "gap-3")}>
              <span className="flex h-8 w-8 items-center justify-center rounded-[7px] bg-[var(--primary-soft)] text-[var(--primary)]"><FolderOpen size={17} /></span>

              {!collapsed && (
                <span className="flex flex-col text-left"><span className="text-[13px] font-semibold leading-4 text-[var(--text)]">PTE 题库</span><span className="mt-0.5 text-[10px] font-medium leading-3 text-[var(--text-faint)]">Question Bank</span></span>
              )}
            </div>

            {!collapsed && (
              <ChevronDown
                size={16}
                className={cn(
                  "transition-all duration-300",
                  questionBankOpen && "rotate-180",
                )}
              />
            )}
          </button>

          {questionBankOpen && (
            <div className="space-y-1">
              <SidebarItem
                href="/pte/speaking"
                label="口语"
                subtitle="Speaking"
                icon={<Mic size={16} />}
                iconTone="danger"
                collapsed={collapsed}
                nested
              />

              <SidebarItem
                href="/pte/writing"
                label="写作"
                subtitle="Writing"
                icon={<PenTool size={16} />}
                iconTone="primary"
                collapsed={collapsed}
                nested
              />

              <SidebarItem
                href="/pte/reading"
                label="阅读"
                subtitle="Reading"
                icon={<BookOpen size={16} />}
                iconTone="success"
                collapsed={collapsed}
                nested
              />

              <SidebarItem
                href="/pte/listening"
                label="听力"
                subtitle="Listening"
                icon={<Headphones size={16} />}
                iconTone="warning"
                collapsed={collapsed}
                nested
              />
            </div>
          )}
        </SidebarGroup> : null}
        {showIelts ? <SidebarGroup title="IELTS 题库" subtitle="IELTS Question Bank" collapsed={collapsed}>
          <button
            onClick={() => setQuestionBankOverride({ pathname, value: questionBankOpen2 ? null : "ielts" })}
            className={cn(
              "flex h-12 w-full items-center rounded-[var(--radius-xsm)] text-[var(--text-soft)] transition-all duration-300 hover:bg-[var(--bg-soft)] hover:text-[var(--text)]",
              collapsed ? "justify-center px-0" : "justify-between px-2.5 sm:px-3",
            )}
          >
            <div className={cn("flex items-center", collapsed ? "gap-0" : "gap-3")}>
              <span className="flex h-8 w-8 items-center justify-center rounded-[7px] bg-[var(--success-soft)] text-[var(--success)]"><FolderOpen size={17} /></span>

              {!collapsed && (
                <span className="flex flex-col text-left"><span className="text-[13px] font-semibold leading-4 text-[var(--text)]">IELTS 题库</span><span className="mt-0.5 text-[10px] font-medium leading-3 text-[var(--text-faint)]">Question Bank</span></span>
              )}
            </div>

            {!collapsed && (
              <ChevronDown
                size={16}
                className={cn(
                  "transition-all duration-300",
                  questionBankOpen2 && "rotate-180",
                )}
              />
            )}
          </button>

          {questionBankOpen2 && (
            <div className="space-y-1">
              <SidebarItem
                href="/ielts/speaking"
                label="口语"
                subtitle="Speaking"
                icon={<Mic size={16} />}
                iconTone="danger"
                collapsed={collapsed}
                nested
              />

              <SidebarItem
                href="/ielts/writing"
                label="写作"
                subtitle="Writing"
                icon={<PenTool size={16} />}
                iconTone="primary"
                collapsed={collapsed}
                nested
              />

              <SidebarItem
                href="/ielts/reading"
                label="阅读"
                subtitle="Reading"
                icon={<BookOpen size={16} />}
                iconTone="success"
                collapsed={collapsed}
                nested
              />

              <SidebarItem
                href="/ielts/listening"
                label="听力"
                subtitle="Listening"
                icon={<Headphones size={16} />}
                iconTone="warning"
                collapsed={collapsed}
                nested
              />

              <SidebarItem
                href="/ielts/practice"
                label="雅思练习题"
                subtitle="Practice Library"
                icon={<LibraryBig size={16} />}
                iconTone="success"
                collapsed={collapsed}
                nested
                disabled
              />

              <SidebarItem
                href="/ielts/cambridge-downloads"
                label="剑桥雅思下载"
                subtitle="Cambridge Downloads"
                icon={<Download size={16} />}
                iconTone="primary"
                collapsed={collapsed}
                nested
              />
            </div>
          )}
        </SidebarGroup> : null}
        <SidebarGroup collapsed={collapsed}>
          <SidebarItem
            href="/my-courses"
            label="我的课程"
            subtitle="My Courses"
            icon={<Mic size={18} />}
            iconTone="primary"
            collapsed={collapsed}
          />

          <SidebarItem
            href="/homework"
            label="我的作业"
            subtitle="Homework"
            icon={<NotebookPen size={18} />}
            iconTone="success"
            collapsed={collapsed}
          />

          <SidebarItem
            href="/mock-test"
            label="模拟考试"
            subtitle="Mock Test"
            icon={<BookOpen size={18} />}
            iconTone="warning"
            collapsed={collapsed}
          />

          <SidebarItem
            href="/pronunciation"
            label="发音"
            subtitle="Pronunciation"
            icon={<Volume2 size={18} />}
            iconTone="primary"
            collapsed={collapsed}
          />

          <SidebarItem
            href="/vocabulary"
            label="词汇"
            subtitle="Vocabulary"
            icon={<BookOpen size={18} />}
            iconTone="success"
            collapsed={collapsed}
          />

          <SidebarItem
            href="/grammar"
            label="语法"
            subtitle="Grammar"
            icon={<PenTool size={18} />}
            iconTone="primary"
            collapsed={collapsed}
          />

          <SidebarItem
            href="/analytics"
            label="学习分析"
            subtitle="Analytics"
            icon={<ChartNoAxesColumn size={18} />}
            iconTone="danger"
            collapsed={collapsed}
          />

          <SidebarItem
            href="/audio-collection"
            label="音频合集"
            subtitle="Audio Collection"
            icon={<Headphones size={18} />}
            iconTone="primary"
            collapsed={collapsed}
          />

          <SidebarItem
            href="/achievements"
            label="成就"
            subtitle="Achievements"
            icon={<Trophy size={18} />}
            iconTone="warning"
            collapsed={collapsed}
          />
        </SidebarGroup>

        <SidebarGroup collapsed={collapsed}>
          <SidebarSettings collapsed={collapsed} />
        </SidebarGroup>
      </div>

      <div className="border-t border-[var(--border)] pt-4">
        <SidebarUser collapsed={collapsed} userId={userId} />
      </div>

      <ConfirmDialog
        open={Boolean(pendingHref)}
        title="确认离开当前 Test？"
        description="你正在进行 IELTS 听力 / 阅读 Test。离开后，当前填写的信息不会保存。"
        cancelLabel="Cancel"
        confirmLabel="确认离开"
        onCancel={() => setPendingHref(null)}
        onConfirm={confirmLeave}
      />
    </aside>
  );
}

function isIeltsExamRoute(pathname: string, searchParams: URLSearchParams) {
  return (
    (pathname === "/ielts/listening" || pathname === "/ielts/reading") &&
    Boolean(searchParams.get("book")) &&
    Boolean(searchParams.get("test"))
  );
}
