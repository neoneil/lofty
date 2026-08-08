import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export const MOCK_TEST_LIMIT_MESSAGE = "普通账号只有一次模考机会。内部学生或 AI 永久无限账号可无限模考。";

export type MockTestAccess = {
  canStartNewAttempt: boolean;
  isUnlimited: boolean;
  usedFreeAttempt: boolean;
  attemptCount: number;
  message: string | null;
};

export class MockTestQuotaError extends Error {
  code = "MOCK_TEST_LIMIT_REACHED";
  status = 403;

  constructor(message = MOCK_TEST_LIMIT_MESSAGE) {
    super(message);
    this.name = "MockTestQuotaError";
  }
}

export function isMockTestQuotaError(error: unknown): error is MockTestQuotaError {
  return error instanceof MockTestQuotaError || (typeof error === "object" && error !== null && (error as { code?: unknown }).code === "MOCK_TEST_LIMIT_REACHED");
}

export async function getMockTestAccess(userId: string): Promise<MockTestAccess> {
  const supabase = createAdminClient();

  const [profileResult, limitResult, attemptsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("is_my_student")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("ai_user_limits")
      .select("is_unlimited, unlimited_until")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .schema("mock_exam")
      .from("attempts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  if (profileResult.error) {
    console.error("Failed to check mock-test profile access:", profileResult.error.message);
  }

  if (limitResult.error) {
    console.error("Failed to check mock-test AI limit access:", limitResult.error.message);
  }

  if (attemptsResult.error) {
    throw attemptsResult.error;
  }

  const isInternalStudent = Boolean(profileResult.data?.is_my_student);
  const isPermanentAiUnlimited = Boolean(limitResult.data?.is_unlimited && !limitResult.data.unlimited_until);
  const isUnlimited = isInternalStudent || isPermanentAiUnlimited;
  const attemptCount = attemptsResult.count ?? 0;
  const usedFreeAttempt = attemptCount > 0;
  const canStartNewAttempt = isUnlimited || !usedFreeAttempt;

  return {
    canStartNewAttempt,
    isUnlimited,
    usedFreeAttempt,
    attemptCount,
    message: canStartNewAttempt ? null : MOCK_TEST_LIMIT_MESSAGE,
  };
}

export async function assertCanStartMockAttempt(userId: string) {
  const access = await getMockTestAccess(userId);
  if (!access.canStartNewAttempt) {
    throw new MockTestQuotaError(access.message ?? MOCK_TEST_LIMIT_MESSAGE);
  }
  return access;
}
