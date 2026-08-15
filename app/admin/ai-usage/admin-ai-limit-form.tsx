"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { AiLimitActionState } from "./page";
import type { AiAccessProductScope } from "@/lib/billing/ai-access-packages";

type AdminAiLimitFormProps = {
  action: (state: AiLimitActionState, formData: FormData) => Promise<AiLimitActionState>;
  initialState: AiLimitActionState;
  displayIndex: number;
  userId: string;
  productScope: AiAccessProductScope;
  displayName: string;
  email: string;
  dailyLimit: number;
  monthlyLimit: number;
  unlimitedUntil: string | null;
  todayUsed: number;
  monthUsed: number;
};

function formatRemainingUntil(value: string | null) {
  if (!value) return null;
  const remainingMs = new Date(value).getTime() - Date.now();
  if (!Number.isFinite(remainingMs) || remainingMs <= 0) return "已到期";
  const totalMinutes = Math.ceil(remainingMs / 60_000);
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days} 天 ${hours} 小时后到期`;
  if (hours > 0) return `${hours} 小时 ${minutes} 分钟后到期`;
  return `${minutes} 分钟后到期`;
}

function formatExpiryDate(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("zh-CN", { timeZone: "Australia/Sydney", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
}

function getIndexBadgeClassName(hasAccess: boolean) {
  if (hasAccess) return "border-[color:var(--warning)]/35 bg-[var(--warning-soft)] text-[var(--warning)]";
  return "border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text-faint)]";
}

function getScopeLabel(scope: AiAccessProductScope) {
  return scope === "ielts" ? "IELTS AI" : "PTE AI";
}

function SaveButton({ saved }: { saved: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className="h-10 rounded-[var(--radius-md)] bg-[var(--primary)] px-5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-65">{pending ? "保存中..." : saved ? "已保存" : "保存"}</button>
  );
}

function AddDaysButton({ days }: { days: 30 | 60 | 90 | 180 }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" name="add_days" value={days} disabled={pending} className="h-10 cursor-pointer rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-semibold text-[var(--text-soft)] transition-colors hover:border-[var(--primary)]/40 hover:bg-[var(--primary-soft)] hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-65">
      +{days} 天
    </button>
  );
}

function ClearAccessButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" name="clear_access" value="true" disabled={pending} className="h-10 cursor-pointer rounded-[var(--radius-md)] border border-[var(--danger)]/25 bg-[var(--danger-soft)] px-4 text-sm font-semibold text-[var(--danger)] transition-colors hover:border-[var(--danger)]/45 disabled:cursor-not-allowed disabled:opacity-65">
      清除时间
    </button>
  );
}

export function AdminAiLimitForm({ action, initialState, displayIndex, userId, productScope, displayName, email, dailyLimit, monthlyLimit, unlimitedUntil, todayUsed, monthUsed }: AdminAiLimitFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const remainingLabel = formatRemainingUntil(unlimitedUntil);
  const expiryLabel = formatExpiryDate(unlimitedUntil);

  return (
    <form action={formAction} className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
      <input type="hidden" name="user_id" value={userId} />
      <input type="hidden" name="product_scope" value={productScope} />
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr_1fr_auto] lg:items-end">
        <div className="flex items-start gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border text-sm font-black tabular-nums shadow-[var(--shadow-sm)] ${getIndexBadgeClassName(Boolean(unlimitedUntil))}`}>{displayIndex}</span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-[var(--text)]">{displayName}</p>
              <span className="rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-2.5 py-1 text-xs font-bold text-[var(--primary)]">{getScopeLabel(productScope)}</span>
            </div>
            <p className="mt-1 break-all text-xs text-[var(--text-soft)]">{email}</p>
            {remainingLabel ? <div className="mt-3 inline-flex flex-wrap items-center gap-2 rounded-full border border-[var(--primary)]/25 bg-[var(--primary-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--primary)]"><span>AI 时间权限</span><span className="text-[var(--text)]">{remainingLabel}</span>{expiryLabel ? <span className="font-medium text-[var(--text-soft)]">有效至 {expiryLabel}</span> : null}</div> : <div className="mt-3 inline-flex rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--text-soft)]">当前无 AI 时间权限</div>}
            {state.message ? <p className={`mt-2 text-xs font-medium ${state.status === "error" ? "text-[var(--danger)]" : "text-[var(--primary)]"}`}>{state.message}</p> : null}
          </div>
        </div>
        <div>
          <label className="mb-2 block text-xs font-medium text-[var(--text-faint)]">今日 / Daily</label>
          <div className="mb-2 text-sm font-semibold text-[var(--primary)]">{todayUsed} / {dailyLimit}</div>
          <input name="daily_limit" type="number" min="0" defaultValue={dailyLimit} className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-3 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]" />
        </div>
        <div>
          <label className="mb-2 block text-xs font-medium text-[var(--text-faint)]">本月 / Monthly</label>
          <div className="mb-2 text-sm font-semibold text-[var(--primary)]">{monthUsed} / {monthlyLimit}</div>
          <input name="monthly_limit" type="number" min="0" defaultValue={monthlyLimit} className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-3 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]" />
        </div>
        <SaveButton saved={state.status === "success"} />
      </div>

      <div className="mt-5 border-t border-[var(--border)] pt-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-[var(--text-faint)]">手动追加 AI 时间</div>
            <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">和 Stripe 购买一致：从当前有效期继续往后加；没有有效期则从现在开始。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AddDaysButton days={30} />
            <AddDaysButton days={60} />
            <AddDaysButton days={90} />
            <AddDaysButton days={180} />
            {unlimitedUntil ? <ClearAccessButton /> : null}
          </div>
        </div>
      </div>
    </form>
  );
}
