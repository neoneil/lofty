import { requireUser } from "@/lib/auth/require-user";
import { canAccessAdmin } from "@/lib/auth/admin-access";
import { AiAccessCheckout } from "@/components/billing/ai-access-checkout";
import { FREE_AI_DAILY_LIMIT } from "@/lib/ai/usage-limit";
import { AI_ACCESS_PACKAGES, AI_ACCESS_PRODUCT_SCOPES, formatAudAmount, normalizeAiAccessProductScope } from "@/lib/billing/ai-access-packages";

function getUsageWindows() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return {
    nowMs: now.getTime(),
    todayStart: todayStart.toISOString(),
  };
}

function getPaymentMessage(value: string | string[] | undefined) {
  const payment = Array.isArray(value) ? value[0] : value;

  if (payment === "success") {
    return {
      tone: "success",
      title: "支付已完成",
      message: "Stripe 确认付款后会自动开通 AI 权限。如果页面还没更新，请稍等几秒后刷新。",
    };
  }

  if (payment === "cancelled") {
    return {
      tone: "warning",
      title: "支付已取消",
      message: "本次支付没有完成，你可以重新选择时间包开通。",
    };
  }

  return null;
}

function formatPurchaseDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Australia/Sydney",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function formatAccessDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Australia/Sydney",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function getStatusLabel(status: string) {
  if (status === "fulfilled") return "已付款";
  if (status === "paid") return "已付款";
  if (status === "pending") return "等待支付";
  if (status === "cancelled") return "已取消";
  if (status === "failed") return "支付失败";
  if (status === "refunded") return "已退款";
  return status;
}

function addDays(value: string | null, days: number | null) {
  if (!value || !days) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function formatPurchaseAccessUntil(value: string | null, createdAt: string | null, accessDays: number | null) {
  if (value) return formatPurchaseDate(value);
  const fallbackUntil = addDays(createdAt, accessDays);
  if (fallbackUntil) return formatPurchaseDate(fallbackUntil);
  return "-";
}

function getProductScopeLabel(value: unknown) {
  const scope = normalizeAiAccessProductScope(value);
  if (scope === "ielts") return "IELTS AI";
  if (scope === "pte") return "PTE AI";
  return "AI";
}

export default async function AiUsageSettingsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase, user } = await requireUser("/settings/ai-usage");
  const { nowMs, todayStart } = getUsageWindows();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const paymentMessage = getPaymentMessage(resolvedSearchParams.payment);

  const [profileResult, limitsResult, todayResult, logsResult, purchasesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("role, email, is_my_student")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("ai_user_product_limits")
      .select("product_scope, daily_limit, monthly_limit, is_unlimited, unlimited_until")
      .eq("user_id", user.id)
      .in("product_scope", ["ielts", "pte"]),
    supabase
      .from("ai_usage_logs")
      .select("product_scope")
      .eq("user_id", user.id)
      .gte("created_at", todayStart)
      .eq("status", "success")
      .in("product_scope", ["ielts", "pte"]),
    supabase
      .from("ai_usage_logs")
      .select("id, product_scope, feature, model, total_tokens, estimated_cost, status, error_message, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("ai_access_purchases")
      .select("id, product_scope, package_code, access_days, status, currency, amount_total, access_started_at, access_until, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const profile = profileResult.data;
  const isAdmin = canAccessAdmin(profile?.role, profile?.email ?? user.email);
  const isInternalStudent = Boolean(profile?.is_my_student);
  const limits = limitsResult.data ?? [];
  const limitMap = new Map(limits.map((limit) => [normalizeAiAccessProductScope(limit.product_scope), limit]));
  const todayCounts = new Map<string, number>();

  for (const log of todayResult.data ?? []) {
    const scope = normalizeAiAccessProductScope(log.product_scope);
    if (scope) todayCounts.set(scope, (todayCounts.get(scope) ?? 0) + 1);
  }

  const logs = logsResult.data ?? [];
  const purchases = purchasesResult.data ?? [];
  const checkoutPackages = AI_ACCESS_PACKAGES.map((item) => ({
    code: item.code,
    days: item.days,
    label: item.label,
    amountAudCents: item.amountAudCents,
    recommended: "recommended" in item ? item.recommended : false,
  }));

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-6 text-[var(--text)] sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-5xl space-y-6">
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
          <p className="text-sm font-semibold text-[var(--text-soft)]">AI Usage</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--text)]">AI 使用权限</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">查看你的 IELTS AI / PTE AI 权限、今日免费次数和开通记录。</p>
        </div>

        {paymentMessage ? (
          <div className={`rounded-[var(--radius-md)] border p-4 text-sm ${
            paymentMessage.tone === "success"
              ? "border-[var(--success)]/25 bg-[var(--success-soft)] text-[var(--success)]"
              : "border-[var(--warning)]/30 bg-[var(--warning-soft)] text-[var(--warning)]"
          }`}>
            <div className="font-bold">{paymentMessage.title}</div>
            <p className="mt-1 leading-6">{paymentMessage.message}</p>
          </div>
        ) : null}

        {isAdmin ? (
          <div className="rounded-[var(--radius-md)] border border-[var(--primary)]/25 bg-[var(--primary-soft)] p-4 text-sm leading-6 text-[var(--primary)]">
            <div className="font-bold">管理员 AI 权限</div>
            <p className="mt-1">管理员账号可以无限制使用 AI。下方付款时间权限仍会显示你通过 Stripe 购买的会员有效期，作为付款记录保留。</p>
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          {AI_ACCESS_PRODUCT_SCOPES.map((scopeConfig) => {
            const limit = limitMap.get(scopeConfig.scope);
            const unlimitedUntil = limit?.unlimited_until ? new Date(limit.unlimited_until) : null;
            const paidAccessActive = Boolean(limit?.is_unlimited && unlimitedUntil && unlimitedUntil.getTime() > nowMs);
            const unlimitedAccess = isAdmin || isInternalStudent || paidAccessActive;
            const statusLabel = isAdmin ? "管理员无限" : isInternalStudent ? "内部无限" : paidAccessActive ? "已开通" : "未开通";
            const todayUsed = todayCounts.get(scopeConfig.scope) ?? 0;
            const dailyLimitLabel = unlimitedAccess ? "∞" : String(FREE_AI_DAILY_LIMIT);
            const accessTitle = paidAccessActive && limit?.unlimited_until ? `有效至 ${formatAccessDate(limit.unlimited_until)}` : unlimitedAccess ? "无限制使用" : "未开通时间包";

            return (
              <div key={scopeConfig.scope} className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--primary)]">{scopeConfig.label}</p>
                    <h2 className="mt-1 text-lg font-bold text-[var(--text)]">{scopeConfig.title}</h2>
                  </div>
                  <span className="rounded-full border border-[var(--primary)]/25 bg-[var(--primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--primary)]">
                    {statusLabel}
                  </span>
                </div>
                {!limit && !unlimitedAccess ? (
                  <p className="mt-4 rounded border border-[var(--danger)]/25 bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">没有找到该 AI 权限记录，请联系管理员。</p>
                ) : (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
                      <p className="text-xs text-[var(--text-soft)]">今日已用</p>
                      <div className="mt-2 text-2xl font-black text-[var(--text)]">{todayUsed} / {dailyLimitLabel}</div>
                      {!unlimitedAccess ? <p className="mt-2 text-xs leading-5 text-[var(--text-soft)]">免费用户每日可使用 {FREE_AI_DAILY_LIMIT} 次。用完后可开通 AI 权限继续使用。</p> : <p className="mt-2 text-xs leading-5 text-[var(--text-soft)]">当前账号不受每日免费次数限制。</p>}
                    </div>
                    <div className="rounded-[var(--radius-md)] border border-[var(--primary)]/25 bg-[var(--primary-soft)] p-4">
                      <p className="text-xs font-semibold text-[var(--primary)]">时间权限</p>
                      <div className="mt-2 text-2xl font-black leading-tight text-[var(--primary)]">{accessTitle}</div>
                      {isAdmin ? <p className="mt-2 text-xs leading-5 text-[var(--primary)]/90">管理员可以无限制使用 AI；付款有效期仅代表已购买的时间包记录。</p> : null}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <AiAccessCheckout packages={checkoutPackages} />

        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
          <div className="border-b border-[var(--border)] p-5">
            <h2 className="text-lg font-semibold text-[var(--text)]">AI 开通记录</h2>
            <p className="mt-1 text-sm text-[var(--text-soft)]">Stripe 支付成功后，这里会显示自动到账记录。</p>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {purchases.length > 0 ? (
              purchases.map((purchase) => (
                <div key={purchase.id} className="grid gap-2 p-5 text-sm sm:grid-cols-[1.2fr_0.8fr_1fr_auto] sm:items-center">
                  <div>
                    <p className="font-semibold text-[var(--text)]">{getProductScopeLabel(purchase.product_scope)} · {purchase.access_days} 天权限</p>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">购买时间 {formatPurchaseDate(purchase.created_at)}</p>
                  </div>
                  <p className="text-[var(--text-soft)]">{purchase.amount_total ? formatAudAmount(purchase.amount_total) : "-"}</p>
                  <p className="text-[var(--text-soft)]">有效至 {formatPurchaseAccessUntil(purchase.access_until, purchase.created_at, purchase.access_days)}</p>
                  <span className="w-fit rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-1 text-xs font-medium text-[var(--text-soft)]">
                    {getStatusLabel(purchase.status)}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-5 text-sm text-[var(--text-soft)]">暂无 AI 开通记录。</div>
            )}
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
          <div className="border-b border-[var(--border)] p-5">
            <h2 className="text-lg font-semibold text-[var(--text)]">最近 AI 使用记录</h2>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {logs.length > 0 ? (
              logs.map((log) => (
                <div key={log.id} className="grid gap-2 p-5 text-sm sm:grid-cols-[1.2fr_1fr_1fr_auto] sm:items-center">
                  <div>
                    <p className="font-semibold text-[var(--text)]">{getProductScopeLabel(log.product_scope)} · {log.feature}</p>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">{new Date(log.created_at).toLocaleString()}</p>
                  </div>
                  <p className="text-[var(--text-soft)]">{log.model}</p>
                  <p className="text-[var(--text-soft)]">Tokens: {log.total_tokens ?? 0}</p>
                  <span className="w-fit rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-1 text-xs font-medium text-[var(--text-soft)]">{log.status}</span>
                </div>
              ))
            ) : (
              <div className="p-5 text-sm text-[var(--text-soft)]">暂无 AI 使用记录。</div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
