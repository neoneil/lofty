"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import MasteryProgress from "@/components/ui/mastery-progress";
import Tag from "@/components/ui/tag";
import { saveQuestionOrder } from "@/lib/question-order";
type Question = {
  id: string;
  question_text: string;
  question_type: string;
  response_type: string | null;
  is_prediction: boolean | null;
  created_at: string;
  updated_at: string;

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

const PAGE_SIZE = 10;

function getWordCount(text: string) {
    return text.trim().split(/\s+/).filter(Boolean).length;
}

function getPaginationNumbers(currentPage: number, totalPages: number) {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 3) {
        return [1, 2, 3, 4, -1, totalPages];
    }

    if (currentPage >= totalPages - 2) {
        return [1, -1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, -1, currentPage - 1, currentPage, currentPage + 1, -1, totalPages];
}

function PaginationButton({
    active = false,
    disabled = false,
    onClick,
    children,
}: {
    active?: boolean;
    disabled?: boolean;
    onClick?: () => void;
    children: React.ReactNode;
}) {
    if (disabled) {
        return (
            <span className="inline-flex h-11 min-w-11 items-center justify-center rounded border border-gray-200 bg-gray-100 px-4 text-sm font-medium text-gray-400">
                {children}
            </span>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex h-11 min-w-11 items-center justify-center rounded border px-4 text-sm font-semibold transition ${active
                ? "border-[var(--theme)] bg-[var(--theme)] text-white"
                : "border-gray-200 bg-white text-gray-600 hover:border-[var(--theme)]/30 hover:text-[var(--theme)]"
                }`}
        >
            {children}
        </button>
    );
}


export default function EssayList({
    initialQuestions,

}: {
    initialQuestions: Question[];

}) {
    const questionIds = initialQuestions.map((q) => q.id);
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.max(1, Math.ceil(initialQuestions.length / PAGE_SIZE));
    const safeCurrentPage = Math.min(currentPage, totalPages);

    const paginatedQuestions = useMemo(() => {
        const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
        return initialQuestions.slice(startIndex, startIndex + PAGE_SIZE);
    }, [safeCurrentPage, initialQuestions]);

    const paginationNumbers = useMemo(
        () => getPaginationNumbers(safeCurrentPage, totalPages),
        [safeCurrentPage, totalPages]
    );

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const goToPage = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <section className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm mx-auto block w-full max-w-[80%]">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 sm:px-6">
                <div className="text-sm font-medium text-(--theme)">
                    当前题目数量：
                    <span className="ml-1 text-(--theme)">
                        {initialQuestions.length}
                    </span>
                </div>
            </div>
            <div>
                {paginatedQuestions.map((item, index) => {
                    return (
                        <Link
                            key={item.id}
                            href={`/pte/writing/essay/${item.id}`}
                            onClick={() => {
                                saveQuestionOrder(
                                    "we", questionIds
                                );
                            }}
                            className="block"
                        >
                            <article className="question-card">
                                <div className="flex items-center justify-center gap-6 pt-1">
                                    <div className="w-full max-w-3xl">
                                        <div className="mb-1 flex flex-wrap items-center gap-2">
                                            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--theme)] px-2 text-xs font-bold text-white">
                                                {(safeCurrentPage - 1) * PAGE_SIZE + index + 1}
                                            </span>

                                            <Tag tone="theme">Essay/WE</Tag>

                                            <Tag tone="yellow">
                                                词数：{getWordCount(item.question_text)}
                                            </Tag>

                                            <Tag tone="yellow">考试原题</Tag>

                                            {item.is_prediction ? (
                                                <Tag tone="purple">活跃</Tag>
                                            ) : null}

                                            {item.is_practiced ? (
                                                <Tag tone="green">已练习</Tag>
                                            ) : (
                                                <Tag tone="neutral">未练习</Tag>
                                            )}

                                            {item.is_wrong_question ? (
                                                <Tag tone="pink">错题</Tag>
                                            ) : null}
                                        </div>

                                        <p className="text-[15px] text-gray-700 tracking-[0.01em] transition sm:text-[17px] sm:leading-7">
                                            {item.question_text}
                                        </p>

                                    </div>

                                    <div className="hidden w-[110px] flex-shrink-0 items-center justify-end md:flex">
                                        <MasteryProgress
                                            correct={item.best_score}
                                            total={getWordCount(item.question_text)}
                                        />
                                    </div>
                                </div>
                            </article>
                        </Link>
                    );
                })}
            </div>

            {totalPages > 1 ? (
                <div className=" cursor-pointer flex flex-wrap items-center justify-center gap-3 border-t border-gray-100 px-5 py-5 sm:px-6">
                    <PaginationButton
                        disabled={safeCurrentPage === 1}
                        onClick={() => goToPage(Math.max(1, safeCurrentPage - 1))}
                    >
                        上一页
                    </PaginationButton>

                    {paginationNumbers.map((page, idx) =>
                        page === -1 ? (
                            <span
                                key={`ellipsis-${idx}`}
                                className="cursor-pointer inline-flex h-11 min-w-11 items-center justify-center text-sm font-semibold text-gray-400"
                            >
                                ...
                            </span>
                        ) : (
                            <PaginationButton
                                key={page}
                                active={page === safeCurrentPage}
                                onClick={() => goToPage(page)}
                            >
                                {page}
                            </PaginationButton>
                        )
                    )}

                    <PaginationButton
                        disabled={safeCurrentPage === totalPages}
                        onClick={() => goToPage(Math.min(totalPages, safeCurrentPage + 1))}
                    >
                        下一页
                    </PaginationButton>
                </div>
            ) : null}
        </section>
    );
}



