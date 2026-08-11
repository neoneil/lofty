"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { PteQuestionBankFilters } from "@/lib/pte/question-bank-pagination";

const FILTER_DEFAULTS: Record<string, string> = {
  q: "",
  questionStatus: "is_prediction",
  practiceStatus: "all",
  activityStatus: "all",
  visualType: "all",
};

export function usePteQuestionBankUrlState(filters: PteQuestionBankFilters) {
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

  return {
    searchTerm,
    setSearchTerm,
    questionStatus: filters.questionStatus,
    setQuestionStatus: (value: string) => updateQuery({ questionStatus: value }),
    practiceStatus: filters.practiceStatus,
    setPracticeStatus: (value: string) => updateQuery({ practiceStatus: value }),
    activityStatus: filters.activityStatus,
    setActivityStatus: (value: string) => updateQuery({ activityStatus: value }),
    updateQuery,
    goToPage,
    isPending,
  };
}
