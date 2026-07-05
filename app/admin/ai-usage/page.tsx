import { revalidatePath } from "next/cache";

import { AdminAiLimitForm } from "./admin-ai-limit-form";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export type AiLimitActionState = {
  status: "idle" | "success" | "error";
  message: string;
  savedAt?: number;
};

function getUsageWindows() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  return {
    nowMs: now.getTime(),
    todayStart: todayStart.toISOString(),
    monthStart: monthStart.toISOString(),
  };
}

const initialAiLimitActionState: AiLimitActionState = {
  status: "idle",
  message: "",
};

async function updateAiLimit(_prevState: AiLimitActionState, formData: FormData): Promise<AiLimitActionState> {
  "use server";

  await requireAdmin("/admin/ai-usage");

  const userId = String(formData.get("user_id") ?? "");
  const dailyLimit = Number(formData.get("daily_limit"));
  const monthlyLimit = Number(formData.get("monthly_limit"));
  const accessMode = String(formData.get("access_mode") ?? "limited");
  const unlimitedUntilValue = String(formData.get("unlimited_until") ?? "").trim();

  if (!userId || !Number.isFinite(dailyLimit) || !Number.isFinite(monthlyLimit)) {
    return {
      status: "error",
      message: "保存失败：请检查用户和额度数字。",
    };
  }

  if (!(["limited", "permanent", "temporary"] as const).includes(accessMode as "limited" | "permanent" | "temporary")) {
    return { status: "error", message: "保存失败：请选择有效的额度模式。" };
  }

  const temporaryExpiry = accessMode === "temporary" ? new Date(unlimitedUntilValue) : null;
  if (accessMode === "temporary" && (!temporaryExpiry || Number.isNaN(temporaryExpiry.getTime()) || temporaryExpiry.getTime() <= Date.now())) {
    return { status: "error", message: "保存失败：临时无限的到期时间必须晚于当前时间。" };
  }

  const isUnlimited = accessMode !== "limited";
  const unlimitedUntil = accessMode === "temporary" ? temporaryExpiry!.toISOString() : null;

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("ai_user_limits")
    .update({
      daily_limit: Math.max(0, Math.floor(dailyLimit)),
      monthly_limit: Math.max(0, Math.floor(monthlyLimit)),
      is_unlimited: isUnlimited,
      unlimited_until: unlimitedUntil,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    return {
      status: "error",
      message: `保存失败：${error.message}`,
    };
  }

  revalidatePath("/admin/ai-usage");

  return {
    status: "success",
    message: "已保存",
    savedAt: Date.now(),
  };
}

export default async function AdminAiUsagePage() {
  await requireAdmin("/admin/ai-usage");

  const supabase = createAdminClient();
  const { nowMs, todayStart, monthStart } = getUsageWindows();

  const [limitsResult, todayLogsResult, monthLogsResult] = await Promise.all([
    supabase
      .from("ai_user_limits")
      .select("user_id, daily_limit, monthly_limit, is_unlimited, unlimited_until, updated_at")
      .order("updated_at", { ascending: false }),
    supabase
      .from("ai_usage_logs")
      .select("user_id")
      .gte("created_at", todayStart)
      .eq("status", "success"),
    supabase
      .from("ai_usage_logs")
      .select("user_id")
      .gte("created_at", monthStart)
      .eq("status", "success"),
  ]);

  const limits = limitsResult.data ?? [];
  const userIds = limits.map((item) => item.user_id);
  const { data: profiles } = userIds.length > 0
    ? await supabase.from("profiles").select("id, email, full_name").in("id", userIds)
    : { data: [] };
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  const todayCounts = new Map<string, number>();
  const monthCounts = new Map<string, number>();

  for (const log of todayLogsResult.data ?? []) {
    todayCounts.set(log.user_id, (todayCounts.get(log.user_id) ?? 0) + 1);
  }

  for (const log of monthLogsResult.data ?? []) {
    monthCounts.set(log.user_id, (monthCounts.get(log.user_id) ?? 0) + 1);
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-7xl space-y-6">
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
          <p className="text-sm font-semibold text-[var(--text-soft)]">Admin</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--text)]">AI Usage 管理</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">查看所有用户 AI 使用情况，并调整 daily/monthly limits 和无限额度。</p>
        </div>

        <div className="grid gap-4">
          {limits.map((limit) => {
            const profile = profileMap.get(limit.user_id);
            const todayUsed = todayCounts.get(limit.user_id) ?? 0;
            const monthUsed = monthCounts.get(limit.user_id) ?? 0;

            const unlimitedExpired = Boolean(limit.is_unlimited && limit.unlimited_until && new Date(limit.unlimited_until).getTime() <= nowMs);

            return <AdminAiLimitForm key={limit.user_id} action={updateAiLimit} initialState={initialAiLimitActionState} userId={limit.user_id} displayName={profile?.full_name || profile?.email || limit.user_id} email={profile?.email || limit.user_id} dailyLimit={limit.daily_limit} monthlyLimit={limit.monthly_limit} isUnlimited={limit.is_unlimited && !unlimitedExpired} unlimitedUntil={unlimitedExpired ? null : limit.unlimited_until} todayUsed={todayUsed} monthUsed={monthUsed} />;
          })}
        </div>
      </section>
    </main>
  );
}
