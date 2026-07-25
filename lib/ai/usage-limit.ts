import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";

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
      unlimitedUntil: string | null;
      usageLogId?: number | null;
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
      unlimitedUntil: string | null;
    };

type ReserveAiUsageRpcResult = {
  allowed?: boolean;
  code?: AiUsageLimitCode;
  message?: string;
  userId?: string;
  feature?: string;
  isUnlimited?: boolean;
  todayUsed?: number;
  monthUsed?: number;
  dailyLimit?: number | null;
  monthlyLimit?: number | null;
  unlimitedUntil?: string | null;
  usageLogId?: number | string | null;
};

export type RecordAiUsageParams = {
  usageLogId?: number | null;
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

const aiUsageReservationStorage = new AsyncLocalStorage<{
  usageLogId: number;
  userId: string;
  feature: string;
}>();

function normalizeReserveResult(data: ReserveAiUsageRpcResult, fallbackUserId: string, fallbackFeature: string): AiUsageLimitResult {
  if (data.allowed) {
    return {
      allowed: true,
      userId: data.userId ?? fallbackUserId,
      feature: data.feature ?? fallbackFeature,
      isUnlimited: Boolean(data.isUnlimited),
      todayUsed: Number(data.todayUsed ?? 0),
      monthUsed: Number(data.monthUsed ?? 0),
      dailyLimit: Number(data.dailyLimit ?? 0),
      monthlyLimit: Number(data.monthlyLimit ?? 0),
      unlimitedUntil: data.unlimitedUntil ?? null,
      usageLogId: data.usageLogId == null ? null : Number(data.usageLogId),
    };
  }

  return {
    allowed: false,
    code: data.code ?? "AI_LIMIT_RECORD_NOT_FOUND",
    message: data.message ?? "AI usage limit record was not found for this user.",
    userId: data.userId ?? fallbackUserId,
    feature: data.feature ?? fallbackFeature,
    todayUsed: Number(data.todayUsed ?? 0),
    monthUsed: Number(data.monthUsed ?? 0),
    dailyLimit: data.dailyLimit ?? null,
    monthlyLimit: data.monthlyLimit ?? null,
    isUnlimited: Boolean(data.isUnlimited),
    unlimitedUntil: data.unlimitedUntil ?? null,
  };
}

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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_my_student")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    console.error("Failed to check profile AI access:", profileError.message);
  }

  if (profile?.is_my_student) {
    return {
      allowed: true,
      userId,
      feature,
      isUnlimited: true,
      todayUsed: 0,
      monthUsed: 0,
      dailyLimit: 0,
      monthlyLimit: 0,
      unlimitedUntil: null,
    };
  }

  const { data: limit, error } = await supabase
    .from("ai_user_limits")
    .select("daily_limit, monthly_limit, is_unlimited, unlimited_until")
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
      unlimitedUntil: null,
    };
  }

  const unlimitedUntil = limit.unlimited_until ? new Date(limit.unlimited_until) : null;
  const unlimitedExpired = Boolean(limit.is_unlimited && unlimitedUntil && unlimitedUntil.getTime() <= Date.now());
  const unlimitedActive = limit.is_unlimited && !unlimitedExpired;

  if (unlimitedExpired) {
    const { error: expiryError } = await supabase.from("ai_user_limits").update({ is_unlimited: false, unlimited_until: null }).eq("user_id", userId);
    if (expiryError) console.error("Failed to clear expired unlimited AI access:", expiryError.message);
  }

  if (unlimitedActive) {
    return {
      allowed: true,
      userId,
      feature,
      isUnlimited: true,
      todayUsed: 0,
      monthUsed: 0,
      dailyLimit: limit.daily_limit,
      monthlyLimit: limit.monthly_limit,
      unlimitedUntil: limit.unlimited_until,
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
      unlimitedUntil: null,
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
      unlimitedUntil: null,
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
    unlimitedUntil: null,
  };
}

export async function reserveAiUsage(userId: string, feature: string): Promise<AiUsageLimitResult> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("reserve_ai_usage", {
    p_user_id: userId,
    p_feature: feature,
    p_reservation_model: "reserved",
  });

  if (error) {
    console.error("Failed to reserve AI usage:", error.message);
    return checkAiUsageLimit(userId, feature);
  }

  const result = normalizeReserveResult((data ?? {}) as ReserveAiUsageRpcResult, userId, feature);

  if (result.allowed && result.usageLogId) {
    aiUsageReservationStorage.enterWith({
      usageLogId: result.usageLogId,
      userId: result.userId,
      feature: result.feature,
    });
  } else if (result.allowed) {
    aiUsageReservationStorage.enterWith({
      usageLogId: 0,
      userId: result.userId,
      feature: result.feature,
    });
  }

  return result;
}

export async function recordAiUsage({
  usageLogId,
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
  const reservation = aiUsageReservationStorage.getStore();
  const targetUsageLogId = usageLogId ?? (reservation?.userId === userId && reservation.feature === feature ? reservation.usageLogId : null);

  if (targetUsageLogId) {
    const { error } = await supabase
      .from("ai_usage_logs")
      .update({
        feature,
        model,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: totalTokens,
        estimated_cost: estimatedCost,
        status,
        error_message: errorMessage,
      })
      .eq("id", targetUsageLogId)
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to update reserved AI usage:", error.message);
    }

    return;
  }

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
