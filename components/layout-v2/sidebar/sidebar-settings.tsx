"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Palette, Settings, SunMoon, X } from "lucide-react";

import { UiSkinPicker } from "@/components/settings/ui-skin-picker";
import { ThemeToggle } from "@/components/layout-v2/topbar/theme-toggle";
import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Card, CardContent } from "@/components/ui-v2/card";
import { cn } from "@/lib/utils";

type SidebarSettingsProps = {
  collapsed?: boolean;
};

export function SidebarSettings({ collapsed }: SidebarSettingsProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="打开设置" title={collapsed ? "设置" : undefined} className={cn("group flex h-12 w-full items-center rounded-[var(--radius-xsm)] text-[var(--text-soft)] transition-all duration-300 hover:bg-[var(--bg-soft)] hover:text-[var(--text)]", collapsed ? "justify-center px-0" : "justify-between px-2.5 sm:px-3")}>
        <span className="inline-flex min-w-0 items-center gap-2.5 sm:gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] bg-[var(--primary-soft)] text-[var(--primary)]"><Settings size={18} /></span>
          <span className={cn("flex min-w-0 flex-col overflow-hidden whitespace-nowrap text-left transition-all duration-300", collapsed ? "w-0 -translate-x-3 opacity-0" : "w-auto translate-x-0 opacity-100")}>
            <span className="truncate text-[13px] font-semibold leading-4 text-[var(--text)]">设置</span>
            <span className="mt-0.5 truncate text-[10px] font-medium leading-3 text-[var(--text-faint)]">Settings</span>
          </span>
        </span>
      </button>

      {open ? createPortal(<div role="dialog" aria-modal="true" aria-labelledby="sidebar-settings-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }} className="fixed inset-0 z-[120] flex items-end justify-center overflow-y-auto bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-4"><Card className="my-0 max-h-[92dvh] w-full overflow-hidden rounded-b-none rounded-t-[var(--radius-lg)] shadow-[var(--shadow-lg)] sm:my-auto sm:max-w-3xl sm:rounded-[var(--radius-lg)]"><CardContent className="p-0"><div className="flex items-start justify-between gap-4 border-b border-[var(--border)] p-5 sm:p-6"><div><Badge>Preferences</Badge><h2 id="sidebar-settings-title" className="mt-3 text-2xl font-semibold text-[var(--text)]">设置</h2><p className="mt-1 text-sm text-[var(--text-soft)]">管理当前设备的网站外观与使用偏好。</p></div><button type="button" onClick={() => setOpen(false)} aria-label="关闭设置" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-faint)] transition-colors hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"><X size={18} /></button></div>
            <div className="max-h-[calc(92dvh-148px)] overflow-y-auto p-5 sm:p-6">
              <div className="mb-6 flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
                <div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]"><SunMoon size={19} /></span><div className="min-w-0"><h3 className="font-semibold text-[var(--text)]">显示模式</h3><p className="text-xs leading-5 text-[var(--text-soft)]">切换浅色与深色主题。</p></div></div>
                <ThemeToggle />
              </div>
              <div className="mb-5 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]"><Palette size={19} /></span><div><h3 className="font-semibold text-[var(--text)]">一键换肤</h3><p className="text-xs text-[var(--text-soft)]">选择全站 Card、Button、背景与主题色。</p></div></div>
              <UiSkinPicker />
              <div className="mt-5 flex justify-end"><Button type="button" onClick={() => setOpen(false)}>完成</Button></div>
            </div>
          </CardContent></Card></div>, document.body) : null}
    </>
  );
}
