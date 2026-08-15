"use client";

import { useState } from "react";
import { CreditCard, ShieldCheck, Sparkles } from "lucide-react";

import { AI_ACCESS_PRODUCT_SCOPES, formatAudAmount, type AiAccessPackageCode, type AiAccessProductScope } from "@/lib/billing/ai-access-packages";
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
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(productScope: AiAccessProductScope, packageCode: AiAccessPackageCode) {
    setError(null);
    setLoadingKey(`${productScope}:${packageCode}`);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ packageCode, productScope }),
      });
      const data = await response.json() as { ok?: boolean; url?: string; message?: string };

      if (!response.ok || !data.ok || !data.url) {
        throw new Error(data.message || "创建支付页面失败，请稍后再试。");
      }

      window.location.href = data.url;
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "创建支付页面失败，请稍后再试。");
      setLoadingKey(null);
    }
  }

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
            IELTS AI 和 PTE AI 分开计时，购买后只会给对应考试的 AI 功能增加有效期。到期后不会自动续费。
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-2 text-xs font-semibold text-[var(--text-soft)]">
          <ShieldCheck size={15} />
          Stripe 安全支付
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {AI_ACCESS_PRODUCT_SCOPES.map((scopeConfig) => (
          <div key={scopeConfig.scope} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
            <div>
              <div className="text-base font-bold text-[var(--text)]">{scopeConfig.title}</div>
              <p className="mt-1 min-h-10 text-sm leading-6 text-[var(--text-soft)]">{scopeConfig.description}</p>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {packages.map((item) => {
                const loading = loadingKey === `${scopeConfig.scope}:${item.code}`;

                return (
                  <div key={`${scopeConfig.scope}:${item.code}`} className="relative rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-3 shadow-[var(--shadow-xs)]">
                    {item.recommended ? (
                      <span className="absolute right-3 top-3 rounded-full bg-[var(--primary)] px-2 py-1 text-[11px] font-bold text-white">
                        推荐
                      </span>
                    ) : null}
                    <div className="text-sm font-bold text-[var(--text)]">{item.days} 天</div>
                    <div className="mt-3 text-2xl font-black text-[var(--primary)]">{formatAudAmount(item.amountAudCents)}</div>
                    <div className="mt-1 text-xs font-medium text-[var(--text-soft)]">
                      约 {formatAudAmount(Math.round(item.amountAudCents / Math.max(1, item.days / 30)))} / 月
                    </div>
                    <Button type="button" onClick={() => startCheckout(scopeConfig.scope, item.code)} disabled={Boolean(loadingKey)} className="mt-4 h-9 w-full text-sm">
                      {loading ? "正在打开..." : "立即开通"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
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
      </div>
    </section>
  );
}
