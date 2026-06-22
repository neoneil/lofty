"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui-v2/button";

type UsageSummary = {
  ok: boolean;
  allowed: boolean;
  code: string | null;
  message: string | null;
  is_unlimited: boolean;
  today_used: number;
  daily_limit: number | null;
  month_used: number;
  monthly_limit: number | null;
};

type Props = {
  feature: string;
  title?: string;
  description?: string;
  children: (openDialog: () => void) => React.ReactNode;
  onConfirm: () => void | Promise<void>;
};

function getRemaining(used: number, limit: number | null) {
  if (limit === null) {
    return 0;
  }

  return Math.max(0, limit - used);
}

export default function AiUsageConfirmDialog({
  feature,
  title = "确认使用 AI 评分反馈",
  description = "本次提交会消耗 1 次 AI 评分反馈机会。",
  children,
  onConfirm,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [usage, setUsage] = useState<UsageSummary | null>(null);

  async function openDialog() {
    setOpen(true);
    setLoadingUsage(true);

    try {
      const response = await fetch(`/api/ai/usage-limit?feature=${encodeURIComponent(feature)}`);
      const data = (await response.json()) as UsageSummary;
      setUsage(data);
    } catch {
      setUsage({
        ok: false,
        allowed: false,
        code: "AI_USAGE_LOAD_FAILED",
        message: "无法读取 AI 使用额度，请稍后再试。",
        is_unlimited: false,
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
  }

  const dailyRemaining = usage ? getRemaining(usage.today_used, usage.daily_limit) : 0;
  const monthlyRemaining = usage ? getRemaining(usage.month_used, usage.monthly_limit) : 0;
  const noDailyQuota = usage && !usage.is_unlimited && (usage.daily_limit === null || dailyRemaining <= 0);
  const noMonthlyQuota = usage && !usage.is_unlimited && (usage.monthly_limit === null || monthlyRemaining <= 0);
  const canContinue = Boolean(usage?.allowed && !noDailyQuota && !noMonthlyQuota);

  return (
    <>
      {children(openDialog)}

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 text-[var(--text)] shadow-[var(--shadow-lg)]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)]">AI Feedback</p>
              <h2 className="mt-2 text-xl font-bold tracking-tight text-[var(--text)]">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{description}</p>
            </div>

            <div className="mt-5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
              {loadingUsage ? (
                <p className="text-sm text-[var(--text-soft)]">正在读取剩余额度...</p>
              ) : usage ? (
                <div className="space-y-3">
                  {usage.is_unlimited ? (
                    <div className="rounded-[var(--radius-md)] bg-[var(--primary-soft)] px-3 py-2 text-sm font-semibold text-[var(--primary)]">你当前为无限 AI 评分额度。</div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-[var(--text-soft)]">今日剩余</span>
                        <span className="font-semibold text-[var(--text)]">{dailyRemaining} / {usage.daily_limit ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-[var(--text-soft)]">本月剩余</span>
                        <span className="font-semibold text-[var(--text)]">{monthlyRemaining} / {usage.monthly_limit ?? 0}</span>
                      </div>
                    </>
                  )}

                  {!canContinue ? (
                    <div className="rounded-[var(--radius-md)] border border-[color:var(--danger)]/30 bg-[var(--danger-soft)] p-3 text-sm leading-6 text-[var(--danger)]">
                      AI 评分反馈券已用完。如果想继续使用此功能，请联系老师。
                      <Link href="/contact" className="ml-1 font-semibold underline underline-offset-4">联系老师</Link>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-[var(--text-soft)]">无法读取 AI 使用额度。</p>
              )}
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>取消</Button>
              <Button type="button" onClick={handleConfirm} disabled={loadingUsage || !canContinue}>确认消耗 1 次机会</Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
