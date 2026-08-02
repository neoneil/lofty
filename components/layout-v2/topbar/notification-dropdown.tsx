"use client";

import Link from "next/link";
import { Bell, CheckCircle2, NotebookPen } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui-v2/badge";
import type { StudentNotification } from "@/lib/homework/types";
import { cn } from "@/lib/utils";

type NotificationResponse = {
  ok?: boolean;
  notifications?: StudentNotification[];
  unreadCount?: number;
};

function formatRelativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60_000));
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
}

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<StudentNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const hasUnread = unreadCount > 0;
  const visibleNotifications = useMemo(() => notifications.slice(0, 8), [notifications]);

  async function loadNotifications() {
    setLoading(true);
    const response = await fetch("/api/notifications", { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as NotificationResponse;
    setNotifications(data.notifications ?? []);
    setUnreadCount(data.unreadCount ?? 0);
    setLoading(false);
  }

  async function markAllRead() {
    if (unreadCount <= 0) return;
    setUnreadCount(0);
    setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    }).catch(() => undefined);
  }

  useEffect(() => {
    const initialTimer = window.setTimeout(() => {
      void loadNotifications();
    }, 0);
    const timer = window.setInterval(() => {
      void loadNotifications();
    }, 60_000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, []);

  function toggleOpen() {
    setOpen((value) => {
      const nextOpen = !value;
      if (nextOpen) void markAllRead();
      return nextOpen;
    });
  }

  return (
    <div className="relative">
      <button type="button" onClick={toggleOpen} aria-label="通知" className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--text-soft)] transition-all duration-300 hover:bg-[var(--bg-soft)] hover:text-[var(--text)]">
        <Bell size={18} />
        {hasUnread ? <span className="absolute right-2.5 top-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[10px] font-black leading-none text-white">{unreadCount > 9 ? "9+" : unreadCount}</span> : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-lg)]">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
            <div>
              <div className="font-bold text-[var(--text)]">通知中心</div>
              <div className="mt-0.5 text-xs text-[var(--text-faint)]">作业和学习提醒</div>
            </div>
            <Badge variant={hasUnread ? "danger" : "secondary"}>{hasUnread ? `${unreadCount} 未读` : "已读"}</Badge>
          </div>

          <div className="max-h-[420px] overflow-y-auto p-2">
            {loading && notifications.length === 0 ? (
              <div className="p-5 text-center text-sm text-[var(--text-soft)]">加载中...</div>
            ) : visibleNotifications.length === 0 ? (
              <div className="p-6 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--bg-soft)] text-[var(--text-faint)]"><CheckCircle2 size={20} /></div>
                <p className="mt-3 text-sm font-semibold text-[var(--text)]">暂无通知</p>
                <p className="mt-1 text-xs text-[var(--text-soft)]">老师发送作业后会显示在这里。</p>
              </div>
            ) : visibleNotifications.map((notification) => (
              <Link key={notification.id} href={notification.href || "/homework"} onClick={() => setOpen(false)} className={cn("flex gap-3 rounded-[var(--radius-md)] px-3 py-3 transition hover:bg-[var(--bg-soft)]", !notification.isRead && "bg-[var(--primary-soft)]")}>
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary-soft)] text-[var(--primary)]"><NotebookPen size={16} /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3"><span className="truncate text-sm font-bold text-[var(--text)]">{notification.title}</span><span className="shrink-0 text-[10px] text-[var(--text-faint)]">{formatRelativeTime(notification.createdAt)}</span></span>
                  <span className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--text-soft)]">{notification.message}</span>
                </span>
              </Link>
            ))}
          </div>

          <div className="border-t border-[var(--border)] p-2">
            <Link href="/homework" onClick={() => setOpen(false)} className="flex h-10 items-center justify-center rounded-[var(--radius-md)] text-sm font-bold text-[var(--primary)] transition hover:bg-[var(--primary-soft)]">查看我的作业</Link>
          </div>
        </div>
      ) : null}
    </div>
  );

}
