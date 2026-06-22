import { requireUser } from "@/lib/auth/require-user";

function getUsageWindows() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  return {
    todayStart: todayStart.toISOString(),
    monthStart: monthStart.toISOString(),
  };
}

export default async function AiUsageSettingsPage() {
  const { supabase, user } = await requireUser("/settings/ai-usage");
  const { todayStart, monthStart } = getUsageWindows();

  const [limitResult, todayResult, monthResult, logsResult] = await Promise.all([
    supabase
      .from("ai_user_limits")
      .select("daily_limit, monthly_limit, is_unlimited")
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
  ]);

  const limit = limitResult.data;
  const todayUsed = todayResult.count ?? 0;
  const monthUsed = monthResult.count ?? 0;
  const logs = logsResult.data ?? [];

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-6 text-[var(--text)] sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-5xl space-y-6">
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
          <p className="text-sm font-semibold text-[var(--text-soft)]">AI Usage</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--text)]">AI 使用额度</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">查看你的每日、本月 AI 使用次数和最近记录。</p>
        </div>

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
              <div className="mt-3 text-3xl font-bold text-[var(--text)]">{limit.is_unlimited ? "是" : "否"}</div>
            </div>
          </div>
        )}

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
