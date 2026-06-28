"use client";

import { useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";

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
  Trophy,
  Video,
} from "lucide-react";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { SidebarCollapseButton } from "./sidebar-collapse-button";
import { SidebarGroup } from "./sidebar-group";
import { SidebarItem } from "./sidebar-item";
import { SidebarUser } from "./sidebar-user";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const [questionBankOpen, setQuestionBankOpen] = useState(() =>
    pathname.startsWith("/pte"),
  );
  const [questionBankOpen2, setQuestionBankOpen2] = useState(() =>
    pathname.startsWith("/ielts"),
  );

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen flex-col overflow-hidden border-r border-[var(--border)] bg-[var(--sidebar)] p-4 transition-all duration-300",
        collapsed ? "w-[84px]" : "w-[230px]",
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center",
          collapsed ? "justify-center" : "justify-between px-2",
        )}
      >
        {!collapsed && (
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold tracking-tight text-[var(--text)] transition-opacity duration-200 hover:opacity-70"
          >
            <Image
              src="/brand3.png"
              alt="LoftyPTE"
              width={28}
              height={28}
              className="h-12 w-12"
            />
            <span>LoftyPTE</span>
          </Link>
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
            href="/achievements"
            label="成就"
            subtitle="Achievements"
            icon={<Trophy size={18} />}
            iconTone="warning"
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

          <SidebarItem
            href="/study-plan"
            label="学习计划"
            subtitle="Study Plan"
            icon={<GraduationCap size={18} />}
            iconTone="success"
            collapsed={collapsed}
          />
        </SidebarGroup>

        <SidebarGroup title="PTE 题库" subtitle="PTE Question Bank" collapsed={collapsed}>
          <button
            onClick={() => setQuestionBankOpen(!questionBankOpen)}
            className={cn(
              "flex h-12 w-full items-center rounded-[var(--radius-md)] px-3 text-[var(--text-soft)] transition-all duration-300 hover:bg-[var(--bg-soft)] hover:text-[var(--text)]",
              collapsed ? "justify-center" : "justify-between",
            )}
          >
            <div className="flex items-center gap-3">
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
        </SidebarGroup>
        <SidebarGroup title="IELTS 题库" subtitle="IELTS Question Bank" collapsed={collapsed}>
          <button
            onClick={() => setQuestionBankOpen2(!questionBankOpen2)}
            className={cn(
              "flex h-12 w-full items-center rounded-[var(--radius-md)] px-3 text-[var(--text-soft)] transition-all duration-300 hover:bg-[var(--bg-soft)] hover:text-[var(--text)]",
              collapsed ? "justify-center" : "justify-between",
            )}
          >
            <div className="flex items-center gap-3">
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
            </div>
          )}
        </SidebarGroup>
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
            href="/mock-test"
            label="模拟考试"
            subtitle="Mock Test"
            icon={<BookOpen size={18} />}
            iconTone="warning"
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
        </SidebarGroup>

        <SidebarGroup collapsed={collapsed}>
          <SidebarItem
            href="/settings"
            label="设置"
            subtitle="Settings"
            icon={<Settings size={18} />}
            iconTone="primary"
            collapsed={collapsed}
          />
        </SidebarGroup>
      </div>

      <div className="border-t border-[var(--border)] pt-4">
        <SidebarUser collapsed={collapsed} />
      </div>
    </aside>
  );
}
