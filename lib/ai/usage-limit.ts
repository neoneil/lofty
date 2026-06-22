import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type AiUsageLimitCode =
  | "AI_LIMIT_RECORD_NOT_FOUND"
  | "AI_DAILY_LIMIT_REACHED"
  | "AI_MONTHLY_LIMIT_REACHED";

export type AiUsageLimitResult =
  | {
      allowed: true;
      userId: string;
      feature: string;
      isUnlimited: boolean;
      todayUsed: number;
      monthUsed: number;
      dailyLimit: number;
      monthlyLimit: number;
    }
  | {
      allowed: false;
      code: AiUsageLimitCode;
      message: string;
      userId: string;
      feature: string;
      todayUsed: number;
      monthUsed: number;
      dailyLimit: number | null;
      monthlyLimit: number | null;
      isUnlimited: boolean;
    };

export type RecordAiUsageParams = {
  userId: string;
  feature: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimatedCost?: number;
  status?: "success" | "error";
  errorMessage?: string | null;
};

function getUsageWindows() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  return {
    todayStart: todayStart.toISOString(),
    monthStart: monthStart.toISOString(),
  };
}

async function countSuccessfulUsage(userId: string) {
  const supabase = createAdminClient();
  const { todayStart, monthStart } = getUsageWindows();

  const [todayResult, monthResult] = await Promise.all([
    supabase
      .from("ai_usage_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", todayStart)
      .eq("status", "success"),
    supabase
      .from("ai_usage_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", monthStart)
      .eq("status", "success"),
  ]);

  return {
    todayUsed: todayResult.count ?? 0,
    monthUsed: monthResult.count ?? 0,
  };
}

export async function checkAiUsageLimit(userId: string, feature: string): Promise<AiUsageLimitResult> {
  const supabase = createAdminClient();

  const { data: limit, error } = await supabase
    .from("ai_user_limits")
    .select("daily_limit, monthly_limit, is_unlimited")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !limit) {
    return {
      allowed: false,
      code: "AI_LIMIT_RECORD_NOT_FOUND",
      message: "AI usage limit record was not found for this user.",
      userId,
      feature,
      todayUsed: 0,
      monthUsed: 0,
      dailyLimit: null,
      monthlyLimit: null,
      isUnlimited: false,
    };
  }

  if (limit.is_unlimited) {
    return {
      allowed: true,
      userId,
      feature,
      isUnlimited: true,
      todayUsed: 0,
      monthUsed: 0,
      dailyLimit: limit.daily_limit,
      monthlyLimit: limit.monthly_limit,
    };
  }

  const { todayUsed, monthUsed } = await countSuccessfulUsage(userId);

  if (todayUsed >= limit.daily_limit) {
    return {
      allowed: false,
      code: "AI_DAILY_LIMIT_REACHED",
      message: "Daily AI usage limit reached.",
      userId,
      feature,
      todayUsed,
      monthUsed,
      dailyLimit: limit.daily_limit,
      monthlyLimit: limit.monthly_limit,
      isUnlimited: false,
    };
  }

  if (monthUsed >= limit.monthly_limit) {
    return {
      allowed: false,
      code: "AI_MONTHLY_LIMIT_REACHED",
      message: "Monthly AI usage limit reached.",
      userId,
      feature,
      todayUsed,
      monthUsed,
      dailyLimit: limit.daily_limit,
      monthlyLimit: limit.monthly_limit,
      isUnlimited: false,
    };
  }

  return {
    allowed: true,
    userId,
    feature,
    isUnlimited: false,
    todayUsed,
    monthUsed,
    dailyLimit: limit.daily_limit,
    monthlyLimit: limit.monthly_limit,
  };
}

export async function recordAiUsage({
  userId,
  feature,
  model,
  promptTokens = 0,
  completionTokens = 0,
  totalTokens = 0,
  estimatedCost = 0,
  status = "success",
  errorMessage = null,
}: RecordAiUsageParams) {
  const supabase = createAdminClient();

  const { error } = await supabase.from("ai_usage_logs").insert({
    user_id: userId,
    feature,
    model,
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: totalTokens,
    estimated_cost: estimatedCost,
    status,
    error_message: errorMessage,
  });

  if (error) {
    console.error("Failed to record AI usage:", error.message);
  }
}

export function getAiLimitResponse(limit: Exclude<AiUsageLimitResult, { allowed: true }>) {
  return {
    ok: false,
    code: limit.code,
    message: limit.message,
  };
}
