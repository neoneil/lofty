"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  FileText,
  Fingerprint,
  GripVertical,
  Sparkles,
  ChartNoAxesColumn,
} from "lucide-react";

import MasteryProgress from "@/components/ui/mastery-progress";
import Tag from "@/components/ui/tag";

import { saveQuestionOrder } from "@/lib/question-order";

import { Badge } from "@/components/ui-v2/badge";
import { Pagination } from "@/components/ui-v2/pagination";

type Question = {
  id: string;
  question_title: string;
  source_question_id: string | null;
  difficulty_level: number | null;
  is_prediction: boolean | null;
  sentence_count: number;
  question_body_text: string[];
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

export default function RoList({
  initialQuestions,
}: {
  initialQuestions: Question[];
}) {
  const questionIds =
    initialQuestions.map((q) => q.id);

  const [currentPage, setCurrentPage] =
    useState(1);

  const totalPages = Math.max(
    1,
    Math.ceil(
      initialQuestions.length / PAGE_SIZE,
    ),
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages,
  );

  const paginatedQuestions = useMemo(() => {
    const startIndex =
      (safeCurrentPage - 1) * PAGE_SIZE;

    return initialQuestions.slice(
      startIndex,
      startIndex + PAGE_SIZE,
    );
  }, [safeCurrentPage, initialQuestions]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const goToPage = (page: number) => {
    setCurrentPage(page);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <section className="mx-auto block w-full max-w-[84%]">
      {/* Header */}

      <div className="mb-4 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-between px-5 py-4 sm:px-6">
          <div className="flex items-center gap-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
              <ChartNoAxesColumn size={16} />
            </div>

            <div className="flex items-center gap-3">
              <div className="text-base font-semibold tracking-tight text-[var(--text)]">
                RO Question Bank
              </div>

              <div className="h-4 w-px bg-[var(--border)]" />

              <div className="text-sm text-[var(--text-soft)]">
                当前题目数量：
                <span className="ml-1 font-semibold text-[var(--primary)]">
                  {initialQuestions.length}
                </span>
              </div>
            </div>
          </div>

          <Tag tone="theme">
            RO
          </Tag>
        </div>
      </div>

      {/* List */}

      <div className="mx-auto w-[97.5%] space-y-1">
        {paginatedQuestions.map(
          (item, index) => {
            return (
              <Link
                key={item.id}
                href={`/pte/reading/ro/${item.id}`}
                onClick={() => {
                  saveQuestionOrder(
                    "ro",
                    questionIds,
                  );
                }}
                className="block"
              >
                <article className="group rounded-[var(--radius-md)] bg-[var(--card)] shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[var(--shadow-md)]">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)]/[0.025] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    <div className="relative flex items-start justify-center gap-5 px-5 py-4 sm:px-6">
                      <div className="w-full max-w-3xl">
                        {/* Tags + Status */}

                        <div className="mb-2.5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          {/* Left */}

                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="gap-1.5 px-2.5 py-1">
                              {(safeCurrentPage - 1) *
                                PAGE_SIZE +
                                index +
                                1}
                            </Badge>

                            <Badge
                              variant="default"
                              className="gap-1.5 px-2.5 py-1"
                            >
                              <GripVertical size={12} />
                              RO
                            </Badge>

                            {item.source_question_id ? (
                              <Badge
                                variant="secondary"
                                className="gap-1.5 px-2.5 py-1"
                              >
                                <Fingerprint size={12} />
                                {
                                  item.source_question_id
                                }
                              </Badge>
                            ) : null}

                            <Badge
                              variant="warning"
                              className="gap-1.5 px-2.5 py-1"
                            >
                              <FileText size={12} />
                              {
                                item.sentence_count
                              }{" "}
                              Sentences
                            </Badge>

                            <Badge
                              variant="warning"
                              className="gap-1.5 px-2.5 py-1"
                            >
                              <Sparkles size={12} />
                              Real Exam
                            </Badge>

                            {item.is_prediction ? (
                              <Badge className="gap-1.5 bg-violet-50 px-2.5 py-1 text-violet-700">
                                <Sparkles size={12} />
                                Prediction
                              </Badge>
                            ) : null}

                            {item.is_wrong_question ? (
                              <Badge
                                variant="danger"
                                className="gap-1.5 px-2.5 py-1"
                              >
                                <AlertTriangle size={12} />
                                Wrong
                              </Badge>
                            ) : null}
                          </div>

                          {/* Right */}

                          <div className="mr-2 flex flex-wrap items-center gap-2">
                            {item.is_practiced ? (
                              <Badge
                                variant="success"
                                className="gap-1.5 px-2.5 py-1"
                              >
                                <CheckCircle2 size={12} />
                                Practiced
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="gap-1.5 px-2.5 py-1"
                              >
                                <CircleDashed size={12} />
                                Unpracticed
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Title */}

                        <p className="text-[16px] font-semibold leading-7 tracking-[0.01em] text-[var(--text)] transition-colors duration-300 sm:text-[18px] sm:leading-8">
                          {item.question_title}
                        </p>

                        {/* Preview */}

                        <div className="mt-3 space-y-2">
                          {item.question_body_text
                            .slice(0, 2)
                            .map(
                              (
                                sentence,
                                sentenceIndex,
                              ) => (
                                <div
                                  key={
                                    sentenceIndex
                                  }
                                  className="flex items-start gap-2"
                                >
                                  <div className="mt-[7px] h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />

                                  <p className="line-clamp-1 text-[14px] leading-7 text-[var(--text-soft)]">
                                    {sentence}
                                  </p>
                                </div>
                              ),
                            )}
                        </div>
                      </div>

                      {/* Progress */}

                      <div className="hidden w-[95px] flex-shrink-0 items-center justify-center md:flex">
                        <MasteryProgress
                          correct={
                            item.best_score
                          }
                          total={
                            item.sentence_count
                          }
                        />
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            );
          },
        )}
      </div>

      {/* Pagination */}

      <Pagination
        currentPage={safeCurrentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
      />
    </section>
  );
}