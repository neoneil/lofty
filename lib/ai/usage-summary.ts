export const AI_USAGE_CHANGED_EVENT = "lofty:ai-usage-changed";

export type AiUsageSummary = {
  ok: boolean;
  allowed: boolean;
  code: string | null;
  message: string | null;
  is_unlimited: boolean;
  unlimited_until: string | null;
  server_time: string;
  today_used: number;
  daily_limit: number | null;
  month_used: number;
  monthly_limit: number | null;
};

export function getRemaining(used: number, limit: number | null) {
  return limit === null ? 0 : Math.max(0, limit - used);
}

export function formatRemainingTime(until: string, serverTime: string) {
  const remainingMs = Math.max(0, new Date(until).getTime() - new Date(serverTime).getTime());
  const totalMinutes = Math.max(1, Math.ceil(remainingMs / 60_000));
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}天 ${hours}小时`;
  if (hours > 0) return `${hours}小时 ${minutes}分钟`;
  return `${minutes}分钟`;
}

export function formatUnlimitedExpiry(until: string) {
  return new Intl.DateTimeFormat("zh-CN", { timeZone: "Australia/Sydney", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(until));
}
