"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, CalendarClock, Crown, Sparkles, TicketCheck } from "lucide-react";

import { Button } from "@/components/ui-v2/button";
import { AI_USAGE_CHANGED_EVENT, formatRemainingTime, formatUnlimitedExpiry, getRemaining, type AiUsageSummary } from "@/lib/ai/usage-summary";

type Props = {
  feature: string;
  title?: string;
  description?: string;
  children: (openDialog: () => void) => React.ReactNode;
  onConfirm: () => void | Promise<void>;
};

export default function AiUsageConfirmDialog({
  feature,
  title = "确认使用 AI 评分反馈",
  description = "本次提交会消耗 1 次 AI 评分反馈机会。",
  children,
  onConfirm,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [usage, setUsage] = useState<AiUsageSummary | null>(null);

  async function openDialog() {
    setOpen(true);
    setLoadingUsage(true);

    try {
      const response = await fetch(`/api/ai/usage-limit?feature=${encodeURIComponent(feature)}`);
      const data = (await response.json()) as AiUsageSummary;
      setUsage(data);
    } catch {
      setUsage({
        ok: false,
        allowed: false,
        code: "AI_USAGE_LOAD_FAILED",
        message: "无法读取 AI 使用额度，请稍后再试。",
        is_unlimited: false,
        unlimited_until: null,
        server_time: new Date().toISOString(),
        today_used: 0,
        daily_limit: null,
        month_used: 0,
        monthly_limit: null,
      });
    } finally {
      setLoadingUsage(false);
    }
  }

  async function handleConfirm() {
    if (!usage?.allowed) {
      return;
    }

    setOpen(false);
    await onConfirm();
    window.dispatchEvent(new Event(AI_USAGE_CHANGED_EVENT));
  }

  const dailyRemaining = usage ? getRemaining(usage.today_used, usage.daily_limit) : 0;
  const monthlyRemaining = usage ? getRemaining(usage.month_used, usage.monthly_limit) : 0;
  const noDailyQuota = usage && !usage.is_unlimited && (usage.daily_limit === null || dailyRemaining <= 0);
  const noMonthlyQuota = usage && !usage.is_unlimited && (usage.monthly_limit === null || monthlyRemaining <= 0);
  const canContinue = Boolean(usage?.allowed && !noDailyQuota && !noMonthlyQuota);
  const temporaryUnlimited = Boolean(usage?.is_unlimited && usage.unlimited_until);
  const unlimitedRemaining = usage?.unlimited_until ? formatRemainingTime(usage.unlimited_until, usage.server_time) : null;
  const unlimitedExpiry = usage?.unlimited_until ? formatUnlimitedExpiry(usage.unlimited_until) : null;

  return (
    <>
      {children(openDialog)}

      {open ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-strong)] bg-[var(--card)] text-[var(--text)] shadow-[var(--shadow-lg)]">
            <div className="border-b border-[var(--border)] bg-[linear-gradient(135deg,var(--primary-soft),var(--card))] px-5 py-5 sm:px-6">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]"><Sparkles size={20} /></span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--primary)]">AI Feedback Access</p>
                  <h2 className="mt-2 text-xl font-bold tracking-tight text-[var(--text)]">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{usage?.is_unlimited ? "本次提交将使用你的无限 AI 评分权限。" : description}</p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              {loadingUsage ? (
                <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 text-sm text-[var(--text-soft)]">正在读取用户状态与剩余额度...</div>
              ) : usage ? (
                <div className="space-y-3">
                  {usage.is_unlimited ? (
                    <div className="rounded-[var(--radius-lg)] border border-[var(--primary)]/25 bg-[var(--primary-soft)] p-4">
                      <div className="grid gap-4 sm:grid-cols-[44px_minmax(0,1fr)]">
                        <span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]"><Crown size={19} /></span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--primary)]">用户状态</p>
                              <h3 className="mt-1 text-base font-bold text-[var(--text)]">内部学生</h3>
                            </div>
                            <span className="rounded-full border border-[var(--primary)]/20 bg-[var(--card)] px-3 py-1 text-xs font-bold text-[var(--primary)]">{temporaryUnlimited ? "临时无限" : "永久无限"}</span>
                          </div>
                          {temporaryUnlimited ? (
                            <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--primary)]/15 bg-[var(--card)] px-3 py-2">
                              <p className="text-sm font-semibold text-[var(--text)]">剩余 {unlimitedRemaining}</p>
                              <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--text-soft)]"><CalendarClock size={13} />有效至 {unlimitedExpiry}</p>
                            </div>
                          ) : (
                            <p className="mx-auto mt-3 flex min-h-11 max-w-xs items-center justify-center rounded-[var(--radius-md)] border border-[var(--primary)]/15 bg-[var(--card)] px-3 py-2 text-center text-sm font-semibold text-[var(--primary)]">永久使用 AI 评分功能</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
                      <div className="grid gap-4 sm:grid-cols-[44px_minmax(0,1fr)]">
                        <span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--card)] text-[var(--primary)] shadow-[var(--shadow-sm)]"><TicketCheck size={19} /></span>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-faint)]">用户状态</p>
                          <h3 className="mt-1 text-base font-bold text-[var(--text)]">普通学生</h3>
                          <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-3">
                              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-faint)]">今日剩余</p>
                              <p className="mt-1 text-2xl font-bold text-[var(--text)]">{dailyRemaining}<span className="ml-1 text-xs font-medium text-[var(--text-soft)]">/ {usage.daily_limit ?? 0} 券</span></p>
                            </div>
                            <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-3">
                              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-faint)]">本月剩余</p>
                              <p className="mt-1 text-2xl font-bold text-[var(--text)]">{monthlyRemaining}<span className="ml-1 text-xs font-medium text-[var(--text-soft)]">/ {usage.monthly_limit ?? 0} 券</span></p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {!canContinue ? (
                    <div className="rounded-[var(--radius-lg)] border border-[color:var(--danger)]/30 bg-[var(--danger-soft)] p-4 text-sm leading-6 text-[var(--danger)]">
                      <div className="flex items-start gap-3">
                        <AlertCircle size={18} className="mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold">AI 评分次数不足</p>
                          <p className="mt-1">当前额度已用完。如果想继续使用此功能，请联系老师开通或增加 AI 评分次数。</p>
                          <Link href="/contact" className="mt-2 inline-flex font-semibold underline underline-offset-4">联系老师</Link>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-[var(--radius-lg)] border border-[var(--danger)]/25 bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]">无法读取 AI 使用额度。</div>
              )}

              <div className="mt-5 flex flex-col-reverse gap-2 border-t border-[var(--border)] pt-5 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)} className="sm:min-w-24">取消</Button>
                <Button type="button" onClick={handleConfirm} disabled={loadingUsage || !canContinue} className="sm:min-w-40">{usage?.is_unlimited ? "确认使用" : "确认消耗 1 张 AI 券"}</Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
