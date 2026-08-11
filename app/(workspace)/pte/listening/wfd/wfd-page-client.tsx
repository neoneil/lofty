"use client";

import type { ComponentProps } from "react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { QuestionInfoCard } from "@/components/site/QuestionInfoCard";
import QuestionToolbar from "@/components/site/question-toolbar";
import type { PteQuestionBankFilters } from "@/lib/pte/question-bank-pagination";
import WfdList from "./wfd-list";

type Question = {
  id: string;
  question_text: string;
  question_type: string;
  source_platform: string | null;
  source_question_id: string | null;
  difficulty_level: string | null;
  tags: string[] | null;
  is_prediction: boolean | null;
  audio_url: string | null;
  audio_duration_seconds: number | null;
  ai_voice: string | null;
  usage_count: number | null;
  created_at: string;
  updated_at: string;
  is_real_exam: boolean | null;

  is_practiced: boolean;
  attempt_count: number;
  correct_count: number;
  wrong_count: number;
  completed_count: number;
  last_attempt_at: string | null;
  latest_score: number | null;
  best_score: number | null;
  is_wrong_question: boolean;
};

type Props = {
  questions: Question[];
  questionInfo: ComponentProps<typeof QuestionInfoCard>["questionInfo"];
  filters: PteQuestionBankFilters;
  pagination: {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
};

const FILTER_DEFAULTS: Record<string, string> = {
  q: "",
  questionStatus: "is_prediction",
  practiceStatus: "all",
  activityStatus: "all",
};

export default function WfdPageClient({
  questions,
  questionInfo,
  filters,
  pagination,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState(filters.searchTerm);

  const updateQuery = useCallback((updates: Record<string, string | number>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      const stringValue = String(value).trim();
      const defaultValue = FILTER_DEFAULTS[key];

      if (!stringValue || stringValue === defaultValue) {
        params.delete(key);
      } else {
        params.set(key, stringValue);
      }
    });

    if (!Object.prototype.hasOwnProperty.call(updates, "page")) {
      params.delete("page");
    }

    const queryString = params.toString();
    startTransition(() => {
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (searchTerm === filters.searchTerm) return;

    const timer = window.setTimeout(() => {
      updateQuery({ q: searchTerm });
    }, 400);

    return () => window.clearTimeout(timer);
  }, [filters.searchTerm, searchTerm, updateQuery]);

  const goToPage = useCallback((page: number) => {
    updateQuery({ page });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [updateQuery]);

  return (
    <section className={`w-full space-y-2 transition-opacity ${isPending ? "opacity-70" : ""}`}>
      <QuestionInfoCard questionInfo={questionInfo} />
      <div className="relative z-50">
        <QuestionToolbar
          questionType="WFD"
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          questionStatus={filters.questionStatus}
          onQuestionStatusChange={(value) => updateQuery({ questionStatus: value })}
          practiceStatus={filters.practiceStatus}
          onPracticeStatusChange={(value) => updateQuery({ practiceStatus: value })}
          activityStatus={filters.activityStatus}
          onActivityStatusChange={(value) => updateQuery({ activityStatus: value })}
        />
      </div>
      <WfdList
        initialQuestions={questions}
        pagination={pagination}
        onPageChange={goToPage}
      />
    </section>
  );
}
