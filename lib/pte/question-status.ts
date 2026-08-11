import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type PteQuestionStatus = {
  question_id: string;
  attempt_count: number;
  completed_count: number;
  correct_count: number;
  wrong_count: number;
  last_attempt_at: string | null;
  latest_score: number | null;
  best_score: number | null;
  is_practiced: boolean;
  is_wrong_question: boolean;
};

type PteQuestionStatusRow = {
  question_id: string;
  attempt_count: number | string | null;
  completed_count: number | string | null;
  correct_count: number | string | null;
  wrong_count: number | string | null;
  last_attempt_at: string | null;
  latest_score: number | string | null;
  best_score: number | string | null;
  is_practiced: boolean | null;
  is_wrong_question: boolean | null;
};

export const PTE_QUESTION_STATUS_SELECT = "question_id, attempt_count, completed_count, correct_count, wrong_count, last_attempt_at, latest_score, best_score, is_practiced, is_wrong_question";

function numberOrNull(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function integerOrZero(value: number | string | null | undefined) {
  return Math.trunc(numberOrNull(value) ?? 0);
}

function mapStatus(row: PteQuestionStatusRow): PteQuestionStatus {
  return {
    question_id: row.question_id,
    attempt_count: integerOrZero(row.attempt_count),
    completed_count: integerOrZero(row.completed_count),
    correct_count: integerOrZero(row.correct_count),
    wrong_count: integerOrZero(row.wrong_count),
    last_attempt_at: row.last_attempt_at,
    latest_score: numberOrNull(row.latest_score),
    best_score: numberOrNull(row.best_score),
    is_practiced: row.is_practiced ?? integerOrZero(row.attempt_count) > 0,
    is_wrong_question: row.is_wrong_question ?? false,
  };
}

export async function loadPteQuestionStatusMap({
  admin,
  userId,
  questionSource,
  questionIds,
}: {
  admin: SupabaseClient;
  userId: string;
  questionSource: string;
  questionIds?: string[];
}) {
  if (questionIds && questionIds.length === 0) return new Map<string, PteQuestionStatus>();

  let query = admin
    .from("lofty_pte_user_question_status_v1")
    .select(PTE_QUESTION_STATUS_SELECT)
    .eq("user_id", userId)
    .eq("question_source", questionSource);

  if (questionIds) {
    query = query.in("question_id", questionIds);
  }

  const { data, error } = await query;

  if (error) throw error;
  return new Map(((data ?? []) as PteQuestionStatusRow[]).map((row) => {
    const status = mapStatus(row);
    return [status.question_id, status];
  }));
}

export function applyPteQuestionStatus<T extends { id: string }>(question: T, status?: PteQuestionStatus): T & {
  is_practiced: boolean;
  attempt_count: number;
  correct_count: number;
  wrong_count: number;
  completed_count: number;
  last_attempt_at: string | null;
  latest_score: number | null;
  best_score: number | null;
  is_wrong_question: boolean;
} {
  return {
    ...question,
    is_practiced: status?.is_practiced ?? false,
    attempt_count: status?.attempt_count ?? 0,
    correct_count: status?.correct_count ?? 0,
    wrong_count: status?.wrong_count ?? 0,
    completed_count: status?.completed_count ?? 0,
    last_attempt_at: status?.last_attempt_at ?? null,
    latest_score: status?.latest_score ?? null,
    best_score: status?.best_score ?? null,
    is_wrong_question: status?.is_wrong_question ?? false,
  };
}
