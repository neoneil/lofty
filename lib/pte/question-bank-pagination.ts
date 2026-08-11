export const PTE_QUESTION_BANK_PAGE_SIZE = 15;

export type PteQuestionBankFilters = {
  page: number;
  searchTerm: string;
  questionStatus: string;
  practiceStatus: string;
  activityStatus: string;
  visualType: string;
};

export type PteQuestionBankPagination = {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

type SearchParams = Record<string, string | string[] | undefined>;

function readParam(params: SearchParams, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function parsePositiveInt(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function parsePteQuestionBankFilters(
  params: SearchParams | undefined,
): PteQuestionBankFilters {
  const source = params ?? {};
  return {
    page: parsePositiveInt(readParam(source, "page"), 1),
    searchTerm: readParam(source, "q").trim(),
    questionStatus: readParam(source, "questionStatus") || "is_prediction",
    practiceStatus: readParam(source, "practiceStatus") || "all",
    activityStatus: readParam(source, "activityStatus") || "all",
    visualType: readParam(source, "visualType") || "all",
  };
}

export function getPteQuestionBankTotalPages(totalCount: number) {
  return Math.max(1, Math.ceil(totalCount / PTE_QUESTION_BANK_PAGE_SIZE));
}

export function getPteQuestionBankRange(page: number) {
  const start = (page - 1) * PTE_QUESTION_BANK_PAGE_SIZE;
  return {
    start,
    end: start + PTE_QUESTION_BANK_PAGE_SIZE - 1,
  };
}
