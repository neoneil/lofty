"use client";

import { useActionState } from "react";
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
  todayUsed: number;
  monthUsed: number;
};

function SaveButton({ saved }: { saved: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className="h-10 rounded-[var(--radius-md)] bg-[var(--primary)] px-5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-65">{pending ? "保存中..." : saved ? "已保存" : "保存"}</button>
  );
}

export function AdminAiLimitForm({ action, initialState, userId, displayName, email, dailyLimit, monthlyLimit, isUnlimited, todayUsed, monthUsed }: AdminAiLimitFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
      <input type="hidden" name="user_id" value={userId} />
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
        <label className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-2 text-sm text-[var(--text-soft)]">
          <input name="is_unlimited" type="checkbox" defaultChecked={isUnlimited} className="h-4 w-4 accent-[var(--primary)]" />
          Unlimited
        </label>
        <SaveButton saved={state.status === "success"} />
      </div>
    </form>
  );
}
