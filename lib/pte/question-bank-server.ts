import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getPteQuestionBankRange,
  getPteQuestionBankTotalPages,
  PTE_QUESTION_BANK_PAGE_SIZE,
  type PteQuestionBankFilters,
} from "@/lib/pte/question-bank-pagination";
import { applyPteQuestionStatus, loadPteQuestionStatusMap } from "@/lib/pte/question-status";

export type QuestionRow = Record<string, unknown> & {
  id: string;
  created_at?: string | null;
};

type QuestionQuery<T> = {
  eq(column: string, value: unknown): T;
  gt(column: string, value: unknown): T;
  gte(column: string, value: unknown): T;
  ilike(column: string, pattern: string): T;
  order(column: string, options: { ascending: boolean }): T;
};

export type QuestionBankConfig<T extends QuestionRow> = {
  table: string;
  questionSource: string;
  questionType?: string;
  select: string;
  searchColumn: string;
  supportsUsageCount?: boolean;
  applyExtraFilters?: <TQuery extends QuestionQuery<TQuery>>(
    query: TQuery,
    filters: PteQuestionBankFilters,
  ) => TQuery;
  normalizeQuestion: (row: QuestionRow) => T;
};

function likePattern(value: string) {
  return `%${value.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
}

function applyQuestionFilters<T extends QuestionQuery<T>>(
  query: T,
  filters: PteQuestionBankFilters,
  config: QuestionBankConfig<QuestionRow>,
) {
  let nextQuery = config.questionType
    ? query.eq("question_type", config.questionType)
    : query;

  if (filters.searchTerm) {
    nextQuery = nextQuery.ilike(config.searchColumn, likePattern(filters.searchTerm));
  }

  if (filters.questionStatus === "is_prediction") {
    nextQuery = nextQuery.eq("is_prediction", true);
  }

  if (filters.questionStatus === "new") {
    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    nextQuery = nextQuery.gte("created_at", since);
  }

  if (filters.questionStatus === "re_is_prediction") {
    nextQuery = nextQuery.eq("is_prediction", true);

    if (config.supportsUsageCount) {
      nextQuery = nextQuery.gt("usage_count", 30);
    }
  }

  return config.applyExtraFilters
    ? config.applyExtraFilters(nextQuery, filters)
    : nextQuery;
}

function orderQuestionQuery<T extends QuestionQuery<T>>(query: T, filters: PteQuestionBankFilters) {
  if (filters.questionStatus === "newest") {
    return query.order("created_at", { ascending: false });
  }

  return query.order("created_at", { ascending: false });
}

function needsStatusDrivenPagination(filters: PteQuestionBankFilters) {
  return filters.practiceStatus !== "all" || filters.activityStatus !== "all";
}

function matchesPracticeStatus(
  status: ReturnType<typeof applyPteQuestionStatus<{ id: string }>>,
  practiceStatus: string,
) {
  if (practiceStatus === "practiced") return status.is_practiced;
  if (practiceStatus === "unpracticed") return !status.is_practiced;
  if (practiceStatus === "wrong") return status.is_wrong_question;
  if (practiceStatus === "mastered") return (status.correct_count ?? 0) >= 1;
  if (practiceStatus === "weak") {
    return (
      (status.wrong_count ?? 0) >= (status.correct_count ?? 0) &&
      (status.attempt_count ?? 0) > 0
    );
  }

  return true;
}

function sortIdsByActivity(
  ids: string[],
  statusMap: Awaited<ReturnType<typeof loadPteQuestionStatusMap>>,
  activityStatus: string,
) {
  if (activityStatus === "all") return ids;

  return [...ids].sort((a, b) => {
    const left = applyPteQuestionStatus({ id: a }, statusMap.get(a));
    const right = applyPteQuestionStatus({ id: b }, statusMap.get(b));

    if (activityStatus === "most_practiced") {
      return right.attempt_count - left.attempt_count;
    }

    if (activityStatus === "recently_practiced") {
      return (
        new Date(right.last_attempt_at ?? 0).getTime() -
        new Date(left.last_attempt_at ?? 0).getTime()
      );
    }

    if (activityStatus === "highest_score") {
      return (right.best_score ?? 0) - (left.best_score ?? 0);
    }

    return 0;
  });
}

export async function loadPaginatedPteQuestionBank<T extends QuestionRow>({
  supabase,
  admin,
  userId,
  filters,
  config,
}: {
  supabase: SupabaseClient;
  admin: SupabaseClient;
  userId: string;
  filters: PteQuestionBankFilters;
  config: QuestionBankConfig<T>;
}) {
  if (needsStatusDrivenPagination(filters)) {
    let idQuery = supabase
      .schema("pte")
      .from(config.table)
      .select("id, created_at")
      .limit(5000);

    idQuery = orderQuestionQuery(applyQuestionFilters(idQuery, filters, config), filters);

    const [{ data: idRows, error: idError }, statusMap] = await Promise.all([
      idQuery,
      loadPteQuestionStatusMap({
        admin,
        userId,
        questionSource: config.questionSource,
      }),
    ]);

    if (idError) {
      return {
        questions: [] as Array<T & ReturnType<typeof applyPteQuestionStatus<T>>>,
        error: idError,
        totalCount: 0,
        currentPage: filters.page,
        totalPages: 1,
      };
    }

    const filteredIds = ((idRows ?? []) as unknown as QuestionRow[])
      .map((row) => row.id)
      .filter((id) =>
        matchesPracticeStatus(
          applyPteQuestionStatus({ id }, statusMap.get(id)),
          filters.practiceStatus,
        ),
      );

    const orderedIds = sortIdsByActivity(filteredIds, statusMap, filters.activityStatus);
    const totalCount = orderedIds.length;
    const totalPages = getPteQuestionBankTotalPages(totalCount);
    const currentPage = Math.min(filters.page, totalPages);
    const { start, end } = getPteQuestionBankRange(currentPage);
    const pageIds = orderedIds.slice(start, end + 1);

    if (pageIds.length === 0) {
      return {
        questions: [] as Array<T & ReturnType<typeof applyPteQuestionStatus<T>>>,
        error: null,
        totalCount,
        currentPage,
        totalPages,
      };
    }

    const { data: pageRows, error: pageError } = await supabase
      .schema("pte")
      .from(config.table)
      .select(config.select)
      .in("id", pageIds);

    const rowMap = new Map(
      ((pageRows ?? []) as unknown as QuestionRow[]).map((row) => [row.id, row]),
    );

    return {
      questions: pageIds
        .map((id) => rowMap.get(id))
        .filter((row): row is QuestionRow => Boolean(row))
        .map((row) => {
          const question = config.normalizeQuestion(row);
          return applyPteQuestionStatus(question, statusMap.get(question.id));
        }),
      error: pageError,
      totalCount,
      currentPage,
      totalPages,
    };
  }

  const totalPagesForFallback = 1;
  const { start, end } = getPteQuestionBankRange(filters.page);
  let questionQuery = supabase
    .schema("pte")
    .from(config.table)
    .select(config.select, { count: "exact" });

  questionQuery = orderQuestionQuery(applyQuestionFilters(questionQuery, filters, config), filters).range(start, end);

  const { data, error, count } = await questionQuery;
  const rows = (data ?? []) as unknown as QuestionRow[];
  const questionIds = rows.map((row) => row.id);
  const statusMap = await loadPteQuestionStatusMap({
    admin,
    userId,
    questionSource: config.questionSource,
    questionIds,
  });
  const totalCount = count ?? rows.length;

  return {
    questions: rows.map((row) => {
      const question = config.normalizeQuestion(row);
      return applyPteQuestionStatus(question, statusMap.get(question.id));
    }),
    error,
    totalCount,
    currentPage: filters.page,
    totalPages: totalCount > 0 ? getPteQuestionBankTotalPages(totalCount) : totalPagesForFallback,
  };
}

export { PTE_QUESTION_BANK_PAGE_SIZE };
