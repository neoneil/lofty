import { revalidatePath } from "next/cache";

import { AdminAiLimitForm } from "./admin-ai-limit-form";
import { requireAdmin } from "@/lib/auth/require-admin";
import { normalizeAiAccessProductScope, type AiAccessProductScope } from "@/lib/billing/ai-access-packages";
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
  const productScope = normalizeAiAccessProductScope(formData.get("product_scope"));
  const dailyLimit = Number(formData.get("daily_limit"));
  const monthlyLimit = Number(formData.get("monthly_limit"));
  const addDays = Number(formData.get("add_days"));
  const clearAccess = String(formData.get("clear_access") ?? "") === "true";

  if (!userId || !productScope || !Number.isFinite(dailyLimit) || !Number.isFinite(monthlyLimit)) {
    return {
      status: "error",
      message: "保存失败：请检查用户、产品和额度数字。",
    };
  }

  const supabase = createAdminClient();
  const normalizedDailyLimit = Math.max(0, Math.floor(dailyLimit));
  const normalizedMonthlyLimit = Math.max(0, Math.floor(monthlyLimit));
  const now = new Date();

  if (Number.isFinite(addDays) && [30, 60, 90, 180].includes(addDays)) {
    const { data: currentLimit, error: currentLimitError } = await supabase
      .from("ai_user_product_limits")
      .select("unlimited_until")
      .eq("user_id", userId)
      .eq("product_scope", productScope)
      .maybeSingle();

    if (currentLimitError) {
      return {
        status: "error",
        message: `追加失败：${currentLimitError.message}`,
      };
    }

    const currentUntil = currentLimit?.unlimited_until ? new Date(currentLimit.unlimited_until) : null;
    const baseDate = currentUntil && !Number.isNaN(currentUntil.getTime()) && currentUntil.getTime() > now.getTime()
      ? currentUntil
      : now;
    const nextUntil = new Date(baseDate);
    nextUntil.setDate(nextUntil.getDate() + addDays);

    const { error } = await supabase
      .from("ai_user_product_limits")
      .update({
        daily_limit: normalizedDailyLimit,
        monthly_limit: normalizedMonthlyLimit,
        is_unlimited: true,
        unlimited_until: nextUntil.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("user_id", userId)
      .eq("product_scope", productScope);

    if (error) {
      return {
        status: "error",
        message: `追加失败：${error.message}`,
      };
    }

    revalidatePath("/admin/ai-usage");

    return {
      status: "success",
      message: `已为 ${getScopeLabel(productScope)} 追加 ${addDays} 天，有效至 ${nextUntil.toLocaleString("zh-CN", { timeZone: "Australia/Sydney" })}`,
      savedAt: Date.now(),
    };
  }

  if (clearAccess) {
    const { error } = await supabase
      .from("ai_user_product_limits")
      .update({
        daily_limit: normalizedDailyLimit,
        monthly_limit: normalizedMonthlyLimit,
        is_unlimited: false,
        unlimited_until: null,
        updated_at: now.toISOString(),
      })
      .eq("user_id", userId)
      .eq("product_scope", productScope);

    if (error) {
      return {
        status: "error",
        message: `清除失败：${error.message}`,
      };
    }

    revalidatePath("/admin/ai-usage");

    return {
      status: "success",
      message: `已清除 ${getScopeLabel(productScope)} 时间权限`,
      savedAt: Date.now(),
    };
  }

  const { error } = await supabase
    .from("ai_user_product_limits")
    .update({
      daily_limit: normalizedDailyLimit,
      monthly_limit: normalizedMonthlyLimit,
      updated_at: now.toISOString(),
    })
    .eq("user_id", userId)
    .eq("product_scope", productScope);

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

function getScopeLabel(scope: AiAccessProductScope) {
  return scope === "ielts" ? "IELTS AI" : "PTE AI";
}

export default async function AdminAiUsagePage() {
  await requireAdmin("/admin/ai-usage");

  const supabase = createAdminClient();
  const { nowMs, todayStart, monthStart } = getUsageWindows();

  const [limitsResult, todayLogsResult, monthLogsResult] = await Promise.all([
    supabase
      .from("ai_user_product_limits")
      .select("user_id, product_scope, daily_limit, monthly_limit, is_unlimited, unlimited_until, updated_at")
      .order("user_id", { ascending: true })
      .order("product_scope", { ascending: true }),
    supabase
      .from("ai_usage_logs")
      .select("user_id, product_scope")
      .gte("created_at", todayStart)
      .eq("status", "success")
      .in("product_scope", ["ielts", "pte"]),
    supabase
      .from("ai_usage_logs")
      .select("user_id, product_scope")
      .gte("created_at", monthStart)
      .eq("status", "success")
      .in("product_scope", ["ielts", "pte"]),
  ]);

  const limits = limitsResult.data ?? [];
  const userIds = limits.map((item) => item.user_id);
  const { data: profiles } = userIds.length > 0
    ? await supabase.from("profiles").select("id, email, full_name, exam_type").in("id", userIds)
    : { data: [] };
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  const todayCounts = new Map<string, number>();
  const monthCounts = new Map<string, number>();

  for (const log of todayLogsResult.data ?? []) {
    const scope = normalizeAiAccessProductScope(log.product_scope);
    if (scope) {
      const key = `${log.user_id}:${scope}`;
      todayCounts.set(key, (todayCounts.get(key) ?? 0) + 1);
    }
  }

  for (const log of monthLogsResult.data ?? []) {
    const scope = normalizeAiAccessProductScope(log.product_scope);
    if (scope) {
      const key = `${log.user_id}:${scope}`;
      monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-7xl space-y-6">
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
          <p className="text-sm font-semibold text-[var(--text-soft)]">Admin</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--text)]">AI Usage 管理</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">查看所有用户 AI 使用情况，调整 daily/monthly limits，并按 30/60/90/180 天追加 AI 时间权限。</p>
        </div>

        <div className="grid gap-4">
          {limits.map((limit, index) => {
            const productScope = normalizeAiAccessProductScope(limit.product_scope);
            if (!productScope) return null;
            const profile = profileMap.get(limit.user_id);
            const countKey = `${limit.user_id}:${productScope}`;
            const todayUsed = todayCounts.get(countKey) ?? 0;
            const monthUsed = monthCounts.get(countKey) ?? 0;

            const unlimitedActive = Boolean(limit.is_unlimited && limit.unlimited_until && new Date(limit.unlimited_until).getTime() > nowMs);

            return <AdminAiLimitForm key={`${limit.user_id}:${productScope}`} action={updateAiLimit} initialState={initialAiLimitActionState} displayIndex={index + 1} userId={limit.user_id} productScope={productScope} displayName={profile?.full_name || profile?.email || limit.user_id} email={profile?.email || limit.user_id} dailyLimit={limit.daily_limit} monthlyLimit={limit.monthly_limit} unlimitedUntil={unlimitedActive ? limit.unlimited_until : null} todayUsed={todayUsed} monthUsed={monthUsed} />;
          })}
        </div>
      </section>
    </main>
  );
}
