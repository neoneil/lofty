import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";

import { normalizeProfileExamType, type ProfileExamType } from "@/lib/profile/exam-type";
import { createAdminClient } from "@/lib/supabase/admin";

export type AiProductScope = ProfileExamType;

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
      productScope?: AiProductScope | null;
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
      productScope?: AiProductScope | null;
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
  productScope?: string | null;
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
  productScope?: AiProductScope | null;
};

const aiUsageReservationStorage = new AsyncLocalStorage<{
  usageLogId: number;
  userId: string;
  feature: string;
  productScope: AiProductScope | null;
}>();

const IELTS_AI_FEATURES = new Set([
  "admin_analyze_answer",
  "admin_analyze_essay_sentence",
  "admin_generate_essay_answer",
  "admin_generate_writing_prompt",
  "selective_writing_review",
]);

export function resolveAiProductScope(feature: string, requestedScope?: unknown): AiProductScope | null {
  const normalizedRequestedScope = normalizeProfileExamType(requestedScope);
  if (normalizedRequestedScope) return normalizedRequestedScope;

  if (feature.startsWith("ielts_") || IELTS_AI_FEATURES.has(feature)) return "ielts";
  if (feature.startsWith("pte_") || feature.includes("_pte_")) return "pte";

  return null;
}

function normalizeReserveResult(data: ReserveAiUsageRpcResult, fallbackUserId: string, fallbackFeature: string, fallbackProductScope: AiProductScope | null): AiUsageLimitResult {
  const productScope = resolveAiProductScope(fallbackFeature, data.productScope ?? fallbackProductScope);

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
      productScope,
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
    productScope,
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

async function countSuccessfulUsage(userId: string, productScope: AiProductScope | null = null) {
  const supabase = createAdminClient();
  const { todayStart, monthStart } = getUsageWindows();
  const todayQuery = supabase
    .from("ai_usage_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", todayStart)
    .eq("status", "success");
  const monthQuery = supabase
    .from("ai_usage_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", monthStart)
    .eq("status", "success");

  if (productScope) {
    todayQuery.eq("product_scope", productScope);
    monthQuery.eq("product_scope", productScope);
  } else {
    todayQuery.is("product_scope", null);
    monthQuery.is("product_scope", null);
  }

  const [todayResult, monthResult] = await Promise.all([
    todayQuery,
    monthQuery,
  ]);

  return {
    todayUsed: todayResult.count ?? 0,
    monthUsed: monthResult.count ?? 0,
  };
}

export async function checkAiUsageLimit(userId: string, feature: string, productScope?: AiProductScope | null): Promise<AiUsageLimitResult> {
  const supabase = createAdminClient();
  const resolvedProductScope = resolveAiProductScope(feature, productScope);

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
      productScope: resolvedProductScope,
    };
  }

  const limitQuery = resolvedProductScope
    ? supabase
      .from("ai_user_product_limits")
      .select("daily_limit, monthly_limit, is_unlimited, unlimited_until")
      .eq("user_id", userId)
      .eq("product_scope", resolvedProductScope)
      .maybeSingle()
    : supabase
      .from("ai_user_limits")
      .select("daily_limit, monthly_limit, is_unlimited, unlimited_until")
      .eq("user_id", userId)
      .maybeSingle();
  const { data: limit, error } = await limitQuery;

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
      productScope: resolvedProductScope,
    };
  }

  const unlimitedUntil = limit.unlimited_until ? new Date(limit.unlimited_until) : null;
  const unlimitedExpired = Boolean(limit.is_unlimited && unlimitedUntil && unlimitedUntil.getTime() <= Date.now());
  const unlimitedActive = limit.is_unlimited && !unlimitedExpired;

  if (unlimitedExpired) {
    const expiryQuery = resolvedProductScope
      ? supabase.from("ai_user_product_limits").update({ is_unlimited: false, unlimited_until: null }).eq("user_id", userId).eq("product_scope", resolvedProductScope)
      : supabase.from("ai_user_limits").update({ is_unlimited: false, unlimited_until: null }).eq("user_id", userId);
    const { error: expiryError } = await expiryQuery;
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
      productScope: resolvedProductScope,
    };
  }

  const { todayUsed, monthUsed } = await countSuccessfulUsage(userId, resolvedProductScope);

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
      productScope: resolvedProductScope,
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
      productScope: resolvedProductScope,
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
    productScope: resolvedProductScope,
  };
}

export async function reserveAiUsage(userId: string, feature: string, productScope?: AiProductScope | null): Promise<AiUsageLimitResult> {
  const supabase = createAdminClient();
  const resolvedProductScope = resolveAiProductScope(feature, productScope);
  const rpcName = resolvedProductScope ? "reserve_ai_product_usage" : "reserve_ai_usage";
  const rpcParams = resolvedProductScope
    ? {
      p_user_id: userId,
      p_feature: feature,
      p_product_scope: resolvedProductScope,
      p_reservation_model: "reserved",
    }
    : {
      p_user_id: userId,
      p_feature: feature,
      p_reservation_model: "reserved",
    };
  const { data, error } = await supabase.rpc(rpcName, rpcParams);

  if (error) {
    console.error("Failed to reserve AI usage:", error.message);
    return checkAiUsageLimit(userId, feature, resolvedProductScope);
  }

  const result = normalizeReserveResult((data ?? {}) as ReserveAiUsageRpcResult, userId, feature, resolvedProductScope);

  if (result.allowed && result.usageLogId) {
    aiUsageReservationStorage.enterWith({
      usageLogId: result.usageLogId,
      userId: result.userId,
      feature: result.feature,
      productScope: result.productScope ?? null,
    });
  } else if (result.allowed) {
    aiUsageReservationStorage.enterWith({
      usageLogId: 0,
      userId: result.userId,
      feature: result.feature,
      productScope: result.productScope ?? null,
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
  productScope = null,
}: RecordAiUsageParams) {
  const supabase = createAdminClient();
  const reservation = aiUsageReservationStorage.getStore();
  const targetUsageLogId = usageLogId ?? (reservation?.userId === userId && reservation.feature === feature ? reservation.usageLogId : null);
  const resolvedProductScope = resolveAiProductScope(feature, productScope ?? reservation?.productScope ?? null);

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
        product_scope: resolvedProductScope,
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
    product_scope: resolvedProductScope,
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
