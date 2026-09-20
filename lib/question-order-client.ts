'use client';

import { useEffect, useMemo, useState } from 'react';
import { ensureCompleteQuestionOrder, getQuestionOrder, getQuestionOrderSearch } from '@/lib/question-order';

export type QuestionNavigation = {
  questionNumber: number;
  prevQuestionId: string | null;
  nextQuestionId: string | null;
};

function safeParseIds(value: string | null) {
  if (!value) return [] as string[];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [] as string[];
  }
}

function getCacheKey(questionType: string, search: string) {
  return `${questionType}-full-question-order:${search || 'default'}`;
}

function readStoredOrder(questionType: string, id: string) {
  if (typeof window === 'undefined') return [] as string[];

  const search = getQuestionOrderSearch(questionType);
  const pageOrder = getQuestionOrder(questionType);
  const cachedOrder = safeParseIds(sessionStorage.getItem(getCacheKey(questionType, search)));

  return cachedOrder.includes(id) ? cachedOrder : pageOrder;
}

export function usePteQuestionNavigation(questionType: string, questionId: string | number): QuestionNavigation {
  const id = String(questionId);
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    const search = getQuestionOrderSearch(questionType);
    const cacheKey = getCacheKey(questionType, search);
    const initialOrder = readStoredOrder(questionType, id);

    let cancelled = false;

    window.setTimeout(() => {
      if (!cancelled) setIds(initialOrder);
    }, 0);

    const cachedOrder = safeParseIds(sessionStorage.getItem(cacheKey));
    if (cachedOrder.includes(id)) {
      return () => {
        cancelled = true;
      };
    }

    ensureCompleteQuestionOrder(questionType, search)
      .then((nextIds) => {
        if (cancelled || nextIds.length === 0) return;
        setIds(nextIds.includes(id) ? nextIds : initialOrder);
      });

    return () => {
      cancelled = true;
    };
  }, [id, questionType]);

  return useMemo(() => {
    const currentIndex = ids.findIndex((qId) => qId === id);

    if (currentIndex === -1) {
      return {
        questionNumber: 0,
        prevQuestionId: null,
        nextQuestionId: null,
      };
    }

    return {
      questionNumber: currentIndex + 1,
      prevQuestionId: currentIndex > 0 ? ids[currentIndex - 1] : null,
      nextQuestionId: currentIndex < ids.length - 1 ? ids[currentIndex + 1] : null,
    };
  }, [id, ids]);
}
