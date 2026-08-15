"use client";

import { useState } from "react";
import { CreditCard, ShieldCheck, Sparkles } from "lucide-react";

import { formatAudAmount, type AiAccessPackageCode } from "@/lib/billing/ai-access-packages";
import { Button } from "@/components/ui-v2/button";

type CheckoutPackage = {
  code: AiAccessPackageCode;
  days: number;
  label: string;
  amountAudCents: number;
  recommended?: boolean;
};

type Props = {
  packages: CheckoutPackage[];
};

export function AiAccessCheckout({ packages }: Props) {
  const [selectedCode, setSelectedCode] = useState<AiAccessPackageCode>("ai_180_days");
  const [loadingCode, setLoadingCode] = useState<AiAccessPackageCode | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setError(null);
    setLoadingCode(selectedCode);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ packageCode: selectedCode }),
      });
      const data = await response.json() as { ok?: boolean; url?: string; message?: string };

      if (!response.ok || !data.ok || !data.url) {
        throw new Error(data.message || "创建支付页面失败，请稍后再试。");
      }

      window.location.href = data.url;
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "创建支付页面失败，请稍后再试。");
      setLoadingCode(null);
    }
  }

  const selectedPackage = packages.find((item) => item.code === selectedCode) ?? packages[0];

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
            <Sparkles size={16} />
            AI Access
          </p>
          <h2 className="mt-2 text-xl font-bold text-[var(--text)]">开通 AI 学习助手</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-soft)]">
            开通后可在有效期内使用平台内 AI 批改、AI 评分与 AI 学习反馈功能。到期后不会自动续费。
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-2 text-xs font-semibold text-[var(--text-soft)]">
          <ShieldCheck size={15} />
          Stripe 安全支付
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {packages.map((item) => {
          const active = item.code === selectedCode;

          return (
            <button
              key={item.code}
              type="button"
              onClick={() => setSelectedCode(item.code)}
              className={`relative rounded-[var(--radius-md)] border p-4 text-left shadow-[var(--shadow-xs)] transition-all ${
                active
                  ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                  : "border-[var(--border)] bg-[var(--bg-soft)] hover:border-[var(--primary)]/45 hover:bg-[var(--card-hover)]"
              }`}
            >
              {item.recommended ? (
                <span className="absolute right-3 top-3 rounded-full bg-[var(--primary)] px-2 py-1 text-[11px] font-bold text-white">
                  推荐
                </span>
              ) : null}
              <div className="text-sm font-bold text-[var(--text)]">{item.label}</div>
              <div className="mt-4 text-3xl font-black text-[var(--primary)]">{formatAudAmount(item.amountAudCents)}</div>
              <div className="mt-2 text-xs font-medium text-[var(--text-soft)]">
                约 {formatAudAmount(Math.round(item.amountAudCents / Math.max(1, item.days / 30)))} / 月
              </div>
            </button>
          );
        })}
      </div>

      {error ? (
        <div className="mt-4 rounded border border-[var(--danger)]/25 bg-[var(--danger-soft)] px-4 py-3 text-sm font-medium text-[var(--danger)]">
          {error}
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm leading-6 text-[var(--text-soft)]">
          <div className="inline-flex items-center gap-2 font-semibold text-[var(--text)]">
            <CreditCard size={16} />
            银行卡 / Alipay
          </div>
          <p className="mt-1">
            使用 Alipay 付款时，Stripe/Alipay 会根据实时汇率显示人民币金额，实际金额以支付页面为准。
          </p>
        </div>
        <Button type="button" onClick={startCheckout} disabled={Boolean(loadingCode)} className="min-w-40">
          {loadingCode ? "正在打开支付..." : `立即开通 ${selectedPackage.days} 天`}
        </Button>
      </div>
    </section>
  );
}
