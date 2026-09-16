'use client';

import { useEffect, useMemo, useState } from 'react';
import { getQuestionOrder, getQuestionOrderSearch } from '@/lib/question-order';

type QuestionNavigation = {
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

function buildRequestUrl(questionType: string, search: string) {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  params.delete('page');
  params.set('type', questionType);
  return `/api/pte/question-order?${params.toString()}`;
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
  const [ids, setIds] = useState<string[]>(() => readStoredOrder(questionType, id));

  useEffect(() => {
    const search = getQuestionOrderSearch(questionType);
    const cacheKey = getCacheKey(questionType, search);
    const initialOrder = readStoredOrder(questionType, id);

    let cancelled = false;

    window.setTimeout(() => {
      if (!cancelled) setIds(initialOrder);
    }, 0);

    fetch(buildRequestUrl(questionType, search))
      .then((response) => response.ok ? response.json() : null)
      .then((json) => {
        if (cancelled || !json?.ok || !Array.isArray(json.ids)) return;
        const nextIds = json.ids.map(String);
        sessionStorage.setItem(cacheKey, JSON.stringify(nextIds));
        setIds(nextIds.includes(id) ? nextIds : initialOrder);
      })
      .catch((error) => {
        console.error('PTE question order load failed:', error);
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
