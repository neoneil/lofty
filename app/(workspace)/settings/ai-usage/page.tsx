import { requireUser } from "@/lib/auth/require-user";
import { AiAccessCheckout } from "@/components/billing/ai-access-checkout";
import { AI_ACCESS_PACKAGES, formatAudAmount } from "@/lib/billing/ai-access-packages";

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

function getStatusLabel(status: string) {
  if (status === "fulfilled") return "已到账";
  if (status === "paid") return "已支付";
  if (status === "pending") return "等待支付";
  if (status === "cancelled") return "已取消";
  if (status === "failed") return "支付失败";
  if (status === "refunded") return "已退款";
  return status;
}

export default async function AiUsageSettingsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase, user } = await requireUser("/settings/ai-usage");
  const { nowMs, todayStart, monthStart } = getUsageWindows();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const paymentMessage = getPaymentMessage(resolvedSearchParams.payment);

  const [limitResult, todayResult, monthResult, logsResult, purchasesResult] = await Promise.all([
    supabase
      .from("ai_user_limits")
      .select("daily_limit, monthly_limit, is_unlimited, unlimited_until")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("ai_usage_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", todayStart)
      .eq("status", "success"),
    supabase
      .from("ai_usage_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", monthStart)
      .eq("status", "success"),
    supabase
      .from("ai_usage_logs")
      .select("id, feature, model, total_tokens, estimated_cost, status, error_message, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("ai_access_purchases")
      .select("id, package_code, access_days, status, currency, amount_total, access_started_at, access_until, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const limit = limitResult.data;
  const unlimitedUntil = limit?.unlimited_until ? new Date(limit.unlimited_until) : null;
  const isUnlimitedActive = Boolean(limit?.is_unlimited && (!unlimitedUntil || unlimitedUntil.getTime() > nowMs));
  const todayUsed = todayResult.count ?? 0;
  const monthUsed = monthResult.count ?? 0;
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
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--text)]">AI 使用额度</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">查看你的每日、本月 AI 使用次数和最近记录。</p>
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

        {!limit ? (
          <div className="rounded-[var(--radius-md)] border border-[color:var(--danger)]/30 bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]">没有找到你的 AI 使用额度记录，请联系管理员。</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
              <p className="text-sm text-[var(--text-soft)]">今日已用</p>
              <div className="mt-3 text-3xl font-bold text-[var(--text)]">{todayUsed} / {limit.daily_limit}</div>
            </div>
            <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
              <p className="text-sm text-[var(--text-soft)]">本月已用</p>
              <div className="mt-3 text-3xl font-bold text-[var(--text)]">{monthUsed} / {limit.monthly_limit}</div>
            </div>
            <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
              <p className="text-sm text-[var(--text-soft)]">无限额度</p>
              <div className="mt-3 text-3xl font-bold text-[var(--text)]">{isUnlimitedActive ? "是" : "否"}</div>
              {isUnlimitedActive && unlimitedUntil ? <p className="mt-2 text-xs text-[var(--text-soft)]">有效至 {unlimitedUntil.toLocaleString("zh-CN")}</p> : null}
            </div>
          </div>
        )}

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
                    <p className="font-semibold text-[var(--text)]">{purchase.access_days} 天 AI 权限</p>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">购买时间 {formatPurchaseDate(purchase.created_at)}</p>
                  </div>
                  <p className="text-[var(--text-soft)]">{purchase.amount_total ? formatAudAmount(purchase.amount_total) : "-"}</p>
                  <p className="text-[var(--text-soft)]">有效至 {formatPurchaseDate(purchase.access_until)}</p>
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
                    <p className="font-semibold text-[var(--text)]">{log.feature}</p>
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
