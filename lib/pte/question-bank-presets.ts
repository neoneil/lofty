import {
  PTE_ASQ_BASE_SELECT,
  PTE_DI_BASE_SELECT,
  PTE_FIBR_BASE_SELECT,
  PTE_FIBRW_BASE_SELECT,
  PTE_RL_BASE_SELECT,
  PTE_RO_BASE_SELECT,
  PTE_RS_BASE_SELECT,
  PTE_RTS_BASE_SELECT,
  PTE_SGD_BASE_SELECT,
  PTE_SST_BASE_SELECT,
  PTE_SWT_BASE_SELECT,
  PTE_WE_BASE_SELECT,
} from "@/lib/pte/select-fields";
import type { QuestionBankConfig, QuestionRow } from "@/lib/pte/question-bank-server";

const row = <T extends QuestionRow>(value: QuestionRow) => value as T;

export const PTE_RS_BANK_CONFIG: QuestionBankConfig<QuestionRow> = {
  table: "rs",
  questionSource: "rs",
  questionType: "RS",
  select: PTE_RS_BASE_SELECT,
  searchColumn: "question_text",
  supportsUsageCount: true,
  normalizeQuestion: row,
};

export const PTE_DI_BANK_CONFIG: QuestionBankConfig<QuestionRow> = {
  table: "di",
  questionSource: "di",
  questionType: "DI",
  select: PTE_DI_BASE_SELECT,
  searchColumn: "search_text",
  applyExtraFilters: (query, filters) =>
    filters.visualType === "all" ? query : query.eq("tag1", filters.visualType),
  normalizeQuestion: row,
};

export const PTE_RL_BANK_CONFIG: QuestionBankConfig<QuestionRow> = {
  table: "rl",
  questionSource: "rl",
  questionType: "RL",
  select: PTE_RL_BASE_SELECT,
  searchColumn: "search_text",
  normalizeQuestion: row,
};

export const PTE_ASQ_BANK_CONFIG: QuestionBankConfig<QuestionRow> = {
  table: "asq",
  questionSource: "asq",
  questionType: "ASQ",
  select: PTE_ASQ_BASE_SELECT,
  searchColumn: "search_text",
  normalizeQuestion: (question) => ({
    ...question,
    source_question_id: null,
    difficulty_level: null,
    is_real_exam: null,
  }),
};

export const PTE_RTS_BANK_CONFIG: QuestionBankConfig<QuestionRow> = {
  table: "rts",
  questionSource: "rts",
  questionType: "RTS",
  select: PTE_RTS_BASE_SELECT,
  searchColumn: "question_text",
  normalizeQuestion: (question) => ({
    ...question,
    search_text: null,
  }),
};

export const PTE_SGD_BANK_CONFIG: QuestionBankConfig<QuestionRow> = {
  table: "sgd",
  questionSource: "sgd",
  questionType: "SGD",
  select: PTE_SGD_BASE_SELECT,
  searchColumn: "question_text",
  normalizeQuestion: (question) => ({
    ...question,
    search_text: null,
  }),
};

export const PTE_SWT_BANK_CONFIG: QuestionBankConfig<QuestionRow> = {
  table: "swt",
  questionSource: "swt",
  questionType: "SWT",
  select: PTE_SWT_BASE_SELECT,
  searchColumn: "question_text",
  normalizeQuestion: (question) => ({
    ...question,
    usage_count: null,
  }),
};

export const PTE_WE_BANK_CONFIG: QuestionBankConfig<QuestionRow> = {
  table: "we",
  questionSource: "we",
  questionType: "WE",
  select: PTE_WE_BASE_SELECT,
  searchColumn: "question_text",
  normalizeQuestion: row,
};

export const PTE_RO_BANK_CONFIG: QuestionBankConfig<QuestionRow> = {
  table: "ro",
  questionSource: "ro",
  select: PTE_RO_BASE_SELECT,
  searchColumn: "search_text",
  normalizeQuestion: row,
};

export const PTE_FIBR_BANK_CONFIG: QuestionBankConfig<QuestionRow> = {
  table: "fibr",
  questionSource: "fibr",
  questionType: "FIBR",
  select: PTE_FIBR_BASE_SELECT,
  searchColumn: "search_text",
  normalizeQuestion: row,
};

export const PTE_FIBRW_BANK_CONFIG: QuestionBankConfig<QuestionRow> = {
  table: "fibrw",
  questionSource: "fibrw",
  questionType: "FIBRW",
  select: PTE_FIBRW_BASE_SELECT,
  searchColumn: "search_text",
  normalizeQuestion: (question) => ({
    ...question,
    latest_score: null,
    best_score: null,
  }),
};

export const PTE_SST_BANK_CONFIG: QuestionBankConfig<QuestionRow> = {
  table: "sst",
  questionSource: "sst",
  questionType: "SST",
  select: PTE_SST_BASE_SELECT,
  searchColumn: "search_text",
  normalizeQuestion: (question) => ({
    ...question,
    source_platform: null,
    tags: null,
    audio_duration_seconds: null,
    ai_voice: null,
    usage_count: null,
  }),
};
