import type { SupabaseClient } from "@supabase/supabase-js";

export type AiFeature =
  | "essay"
  | "swt"
  | "ra"
  | "rs"
  | "di"
  | "rl"
  | "asq"
  | "rts"
  | "sgd"
  | "wfd"
  | "study_plan"
  | "chat";

type CheckAiAccessParams = {
  supabase: SupabaseClient;
  userId: string;
};

export async function checkAiAccess({
  supabase,
  userId,
}: CheckAiAccessParams) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (!profile) {
    return {
      allowed: false,
      reason: "Profile not found",
    };
  }

  if (profile.role === "admin" || profile.role === "subscribed") {
    return {
      allowed: true,
      unlimited: true,
    };
  }

  const { data: limit } = await supabase
    .from("ai_user_limits")
    .select("daily_limit, monthly_limit, is_unlimited")
    .eq("user_id", userId)
    .single();

  if (!limit) {
    return {
      allowed: false,
      reason: "AI limit record not found",
    };
  }

  if (limit.is_unlimited) {
    return {
      allowed: true,
      unlimited: true,
    };
  }

  const now = new Date();

  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).toISOString();

  const monthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).toISOString();

  const { count: todayUsed } = await supabase
    .from("ai_usage_logs")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("user_id", userId)
    .eq("status", "success")
    .gte("created_at", todayStart);

  const { count: monthUsed } = await supabase
    .from("ai_usage_logs")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("user_id", userId)
    .eq("status", "success")
    .gte("created_at", monthStart);

  const usedToday = todayUsed ?? 0;
  const usedMonth = monthUsed ?? 0;

  if (usedToday >= limit.daily_limit) {
    return {
      allowed: false,
      reason: "Daily AI limit reached",
      todayUsed: usedToday,
      dailyLimit: limit.daily_limit,
      monthUsed: usedMonth,
      monthlyLimit: limit.monthly_limit,
    };
  }

  if (usedMonth >= limit.monthly_limit) {
    return {
      allowed: false,
      reason: "Monthly AI limit reached",
      todayUsed: usedToday,
      dailyLimit: limit.daily_limit,
      monthUsed: usedMonth,
      monthlyLimit: limit.monthly_limit,
    };
  }

  return {
    allowed: true,
    unlimited: false,
    todayUsed: usedToday,
    dailyLimit: limit.daily_limit,
    monthUsed: usedMonth,
    monthlyLimit: limit.monthly_limit,
  };
}

type RecordAiUsageParams = {
  supabase: SupabaseClient;
  userId: string;
  feature: AiFeature;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimatedCost?: number;
  status?: "success" | "failed";
  errorMessage?: string | null;
};

export async function recordAiUsage({
  supabase,
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