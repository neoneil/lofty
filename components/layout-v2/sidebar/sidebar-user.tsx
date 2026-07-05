"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, Crown, TicketCheck } from "lucide-react";

import { AI_USAGE_CHANGED_EVENT, formatRemainingTime, formatUnlimitedExpiry, getRemaining, type AiUsageSummary } from "@/lib/ai/usage-summary";
import { cn } from "@/lib/utils";

type Props = {
  collapsed?: boolean;
  userId: string | null;
};

export function SidebarUser({ collapsed, userId }: Props) {
  const [usage, setUsage] = useState<AiUsageSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let active = true;

    async function loadUsage() {
      try {
        const response = await fetch("/api/ai/usage-limit?feature=sidebar_status", { cache: "no-store" });
        const data = (await response.json()) as AiUsageSummary;
        if (active) setUsage(data);
      } catch {
        if (active) setUsage(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadUsage();
    window.addEventListener(AI_USAGE_CHANGED_EVENT, loadUsage);
    return () => {
      active = false;
      window.removeEventListener(AI_USAGE_CHANGED_EVENT, loadUsage);
    };
  }, [userId]);

  const dailyRemaining = usage ? getRemaining(usage.today_used, usage.daily_limit) : 0;
  const monthlyRemaining = usage ? getRemaining(usage.month_used, usage.monthly_limit) : 0;
  const temporaryUnlimited = Boolean(usage?.is_unlimited && usage.unlimited_until);
  const statusTitle = loading ? "AI 额度" : !usage ? "用户状态" : usage.is_unlimited ? "内部学生" : "普通用户";
  const statusDetail = loading ? "正在读取..." : usage?.is_unlimited ? temporaryUnlimited && usage.unlimited_until ? `剩余 ${formatRemainingTime(usage.unlimited_until, usage.server_time)}` : "永久无限" : usage ? `AI券 今日 ${dailyRemaining} · 本月 ${monthlyRemaining}` : "额度暂不可用";
  const expiryDetail = temporaryUnlimited && usage?.unlimited_until ? `有效至 ${formatUnlimitedExpiry(usage.unlimited_until)}` : null;
  const StatusIcon = usage?.is_unlimited ? Crown : TicketCheck;

  return (
    <Link href="/settings/ai-usage" title={collapsed ? `${statusTitle} · ${statusDetail}` : expiryDetail ?? statusDetail} className={cn("flex w-full cursor-pointer items-center rounded-[var(--radius-lg)] border border-transparent bg-[var(--bg-soft)] p-3 transition-all duration-300 hover:border-[var(--border)] hover:bg-[var(--border-soft)]", collapsed ? "justify-center" : "justify-between")}>
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]"><StatusIcon size={18} /></div>
        <div className={cn("min-w-0 overflow-hidden transition-all duration-300", collapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
          <div className="truncate text-sm font-bold text-[var(--text)]">{statusTitle}</div>
          <div className="mt-0.5 truncate text-[10px] font-medium text-[var(--text-soft)]">{statusDetail}</div>
          {expiryDetail ? <div className="mt-0.5 truncate text-[9px] text-[var(--text-faint)]">{expiryDetail}</div> : null}
        </div>
      </div>
      {!collapsed ? <ChevronRight size={16} className="shrink-0 text-[var(--text-faint)]" /> : null}
    </Link>
  );
}
