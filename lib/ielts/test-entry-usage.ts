import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export const IELTS_TEST_ENTRY_FEATURE_BY_MODULE = {
  listening: "ielts_listening_test",
  reading: "ielts_reading_test",
} as const;

export type IeltsTestEntryModule = keyof typeof IELTS_TEST_ENTRY_FEATURE_BY_MODULE;

export function isIeltsTestEntryModule(value: string): value is IeltsTestEntryModule {
  return value === "listening" || value === "reading";
}

export function getIeltsTestEntryModel(moduleType: IeltsTestEntryModule, bookNumber: number, testNumber: number) {
  return `ielts_test_entry:${moduleType}:${bookNumber}:${testNumber}`;
}

export function getTodayStartIso() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}

export async function hasIeltsTestEntryUsage({ userId, moduleType, bookNumber, testNumber }: { userId: string; moduleType: IeltsTestEntryModule; bookNumber: number; testNumber: number }) {
  const adminSupabase = createAdminClient();
  const { data, error } = await adminSupabase
    .from("ai_usage_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("feature", IELTS_TEST_ENTRY_FEATURE_BY_MODULE[moduleType])
    .eq("model", getIeltsTestEntryModel(moduleType, bookNumber, testNumber))
    .in("status", ["success", "reserved"])
    .gte("created_at", getTodayStartIso())
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to check IELTS test entry usage:", error.message);
  }

  return Boolean(data);
}
