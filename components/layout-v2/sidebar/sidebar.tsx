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
            label="Dashboard"
            icon={<LayoutDashboard size={18} />}
            collapsed={collapsed}
          />

          <SidebarItem
            href="/achievements"
            label="Achievements"
            icon={<Trophy size={18} />}
            collapsed={collapsed}
          />

          <SidebarItem
            href="/classroom"
            label="Classroom"
            icon={<Video size={18} />}
            collapsed={collapsed}
            badge="Live"
          />

          <SidebarItem
            href="/study-plan"
            label="Study Plan"
            icon={<GraduationCap size={18} />}
            collapsed={collapsed}
          />
        </SidebarGroup>

        <SidebarGroup title="PTE Question Bank" collapsed={collapsed}>
          <button
            onClick={() => setQuestionBankOpen(!questionBankOpen)}
            className={cn(
              "flex h-11 w-full items-center rounded-[var(--radius-md)] px-3 text-[var(--text-soft)] transition-all duration-300 hover:bg-[var(--bg-soft)] hover:text-[var(--text)]",
              collapsed ? "justify-center" : "justify-between",
            )}
          >
            <div className="flex items-center gap-3">
              <FolderOpen size={18} />

              {!collapsed && (
                <span className="text-sm font-medium">Question Bank</span>
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
                label="Speaking"
                icon={<Mic size={16} />}
                collapsed={collapsed}
                nested
              />

              <SidebarItem
                href="/pte/writing"
                label="Writing"
                icon={<PenTool size={16} />}
                collapsed={collapsed}
                nested
              />

              <SidebarItem
                href="/pte/reading"
                label="Reading"
                icon={<BookOpen size={16} />}
                collapsed={collapsed}
                nested
              />

              <SidebarItem
                href="/pte/listening"
                label="Listening"
                icon={<Headphones size={16} />}
                collapsed={collapsed}
                nested
              />
            </div>
          )}
        </SidebarGroup>
        <SidebarGroup title="IELTS Question Bank" collapsed={collapsed}>
          <button
            onClick={() => setQuestionBankOpen2(!questionBankOpen2)}
            className={cn(
              "flex h-11 w-full items-center rounded-[var(--radius-md)] px-3 text-[var(--text-soft)] transition-all duration-300 hover:bg-[var(--bg-soft)] hover:text-[var(--text)]",
              collapsed ? "justify-center" : "justify-between",
            )}
          >
            <div className="flex items-center gap-3">
              <FolderOpen size={18} />

              {!collapsed && (
                <span className="text-sm font-medium">Question Bank</span>
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
                label="Speaking"
                icon={<Mic size={16} />}
                collapsed={collapsed}
                nested
              />

              <SidebarItem
                href="/ielts/writing"
                label="Writing"
                icon={<PenTool size={16} />}
                collapsed={collapsed}
                nested
              />

              <SidebarItem
                href="/ielts/reading"
                label="Reading"
                icon={<BookOpen size={16} />}
                collapsed={collapsed}
                nested
              />

              <SidebarItem
                href="/ielts/listening"
                label="Listening"
                icon={<Headphones size={16} />}
                collapsed={collapsed}
                nested
              />
            </div>
          )}
        </SidebarGroup>
        <SidebarGroup collapsed={collapsed}>
          <SidebarItem
            href="/my-courses"
            label="My Practice"
            icon={<Mic size={18} />}
            collapsed={collapsed}
          />

          <SidebarItem
            href="/mock-test"
            label="Mock Test"
            icon={<BookOpen size={18} />}
            collapsed={collapsed}
          />

          <SidebarItem
            href="/vocabulary"
            label="Vocabulary"
            icon={<BookOpen size={18} />}
            collapsed={collapsed}
          />

          <SidebarItem
            href="/grammar"
            label="Grammar"
            icon={<PenTool size={18} />}
            collapsed={collapsed}
          />

          <SidebarItem
            href="/analytics"
            label="Analytics"
            icon={<ChartNoAxesColumn size={18} />}
            collapsed={collapsed}
          />
        </SidebarGroup>

        <SidebarGroup collapsed={collapsed}>
          <SidebarItem
            href="/settings"
            label="Settings"
            icon={<Settings size={18} />}
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
