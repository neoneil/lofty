"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import type { AiLimitActionState } from "./page";

type AdminAiLimitFormProps = {
  action: (state: AiLimitActionState, formData: FormData) => Promise<AiLimitActionState>;
  initialState: AiLimitActionState;
  userId: string;
  displayName: string;
  email: string;
  dailyLimit: number;
  monthlyLimit: number;
  isUnlimited: boolean;
  unlimitedUntil: string | null;
  todayUsed: number;
  monthUsed: number;
};

type AccessMode = "limited" | "permanent" | "temporary";

function toLocalDateTimeValue(value: string | Date | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function toIsoValue(value: string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function SaveButton({ saved }: { saved: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className="h-10 rounded-[var(--radius-md)] bg-[var(--primary)] px-5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-65">{pending ? "保存中..." : saved ? "已保存" : "保存"}</button>
  );
}

export function AdminAiLimitForm({ action, initialState, userId, displayName, email, dailyLimit, monthlyLimit, isUnlimited, unlimitedUntil, todayUsed, monthUsed }: AdminAiLimitFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const initialMode: AccessMode = isUnlimited ? unlimitedUntil ? "temporary" : "permanent" : "limited";
  const [accessMode, setAccessMode] = useState<AccessMode>(initialMode);
  const [expiryValue, setExpiryValue] = useState(() => toLocalDateTimeValue(unlimitedUntil));

  function selectDuration(days: number) {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + days);
    setAccessMode("temporary");
    setExpiryValue(toLocalDateTimeValue(expiry));
  }

  return (
    <form action={formAction} className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
      <input type="hidden" name="user_id" value={userId} />
      <input type="hidden" name="unlimited_until" value={accessMode === "temporary" ? toIsoValue(expiryValue) : ""} />
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto] lg:items-end">
        <div>
          <p className="font-semibold text-[var(--text)]">{displayName}</p>
          <p className="mt-1 break-all text-xs text-[var(--text-soft)]">{email}</p>
          {state.message ? <p className={`mt-2 text-xs font-medium ${state.status === "error" ? "text-[var(--danger)]" : "text-[var(--primary)]"}`}>{state.message}</p> : null}
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
        <div>
          <label htmlFor={`access-mode-${userId}`} className="mb-2 block text-xs font-medium text-[var(--text-faint)]">额度模式</label>
          <select id={`access-mode-${userId}`} name="access_mode" value={accessMode} onChange={(event) => setAccessMode(event.target.value as AccessMode)} className="h-10 w-full cursor-pointer rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-3 text-sm font-semibold text-[var(--text)] outline-none focus:border-[var(--primary)]">
            <option value="limited">普通额度</option>
            <option value="permanent">永久无限</option>
            <option value="temporary">临时无限</option>
          </select>
        </div>
        <SaveButton saved={state.status === "success"} />
      </div>

      {accessMode === "temporary" ? <div className="mt-5 border-t border-[var(--border)] pt-5"><div className="grid gap-4 lg:grid-cols-[minmax(220px,1fr)_2fr] lg:items-end"><div><label htmlFor={`unlimited-until-${userId}`} className="mb-2 block text-xs font-medium text-[var(--text-faint)]">临时无限到期时间</label><input id={`unlimited-until-${userId}`} type="datetime-local" value={expiryValue} onChange={(event) => setExpiryValue(event.target.value)} required className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-3 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]" /></div><div><div className="mb-2 text-xs font-medium text-[var(--text-faint)]">快捷期限</div><div className="flex flex-wrap gap-2">{[1, 3, 7, 14, 30].map((days) => <button key={days} type="button" onClick={() => selectDuration(days)} className="h-10 cursor-pointer rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-semibold text-[var(--text-soft)] transition-colors hover:border-[var(--primary)]/40 hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]">{days} 天</button>)}</div></div></div><p className="mt-3 text-xs leading-5 text-[var(--text-soft)]">到期后系统会立即恢复为普通额度，并继续按照每日和每月上限计算。</p></div> : null}
    </form>
  );
}
