"use client";

import { getPtePracticeListLayoutClass, PtePracticeViewToggle, type PtePracticeViewMode } from "@/components/pte/pte-practice-view-toggle";
import { PteEnglishTitle } from "@/components/pte/pte-english-title";

import Link from "next/link";

import { useState } from "react";

import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  FileText,
  Fingerprint,
  Sparkles,
  ChartNoAxesColumn,
  ChevronDown,
} from "lucide-react";

import MasteryProgress from "@/components/ui/mastery-progress";

import Tag from "@/components/ui/tag";

import { Badge } from "@/components/ui-v2/badge";

import { Pagination } from "@/components/ui-v2/pagination";

import { saveQuestionOrder } from "@/lib/question-order";

type Question = {
  id: string;

  question_title: string;

  question_body_text: string;

  question_type: string;

  source_platform: string;

  difficulty_level: string | null;

  tags: string[];

  is_prediction: boolean;

  is_real_exam: boolean;

  blanks_json: {
    answer: string;
    options: string[];
    blank_index: number;
  }[];

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

function getBlankCount(
  blanks: Question["blanks_json"],
) {

  return blanks.length;

}

export default function FibrwList({
  initialQuestions,
  pagination,
  onPageChange,
}: {
  initialQuestions: Question[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
}) {

  const questionIds =
    initialQuestions.map(
      (q) => q.id,
    );

  const [viewMode, setViewMode] = useState<PtePracticeViewMode>("grid");

  const safeCurrentPage =
    Math.min(
      pagination.currentPage,
      pagination.totalPages,
    );

  return (
    <section className="mx-auto block w-full max-w-7xl px-4 sm:px-6 lg:max-w-[84%] lg:px-0">

      {/* Header */}

      <div className="mb-4 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--card)] shadow-[var(--shadow-sm)]">

        <div className="flex items-center justify-between px-5 py-4 sm:px-6">

          <div className="flex items-center gap-6">

            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
              <ChartNoAxesColumn size={16} />
            </div>

            <div className="flex items-center gap-3">

              <div className="text-base font-semibold tracking-tight text-[var(--text)]">
                FIB-RW Question Bank
              </div>

              <div className="h-4 w-px bg-[var(--border)]" />

              <div className="text-sm text-[var(--text-soft)]">
                当前题目数量：
                <span className="ml-1 font-semibold text-[var(--primary)]">
                  {
                    pagination.totalCount
                  }
                </span>
              </div>

            </div>

          </div>

          <div className="flex items-center gap-2">
            <PtePracticeViewToggle value={viewMode} onChange={setViewMode} />
            <Tag tone="theme">
            FIB-RW
          </Tag>
          </div>

        </div>

      </div>

      {/* List */}

      <div className={getPtePracticeListLayoutClass(viewMode)}>

        {initialQuestions.map(
          (
            item,
            index,
          ) => {

            const blankCount =
              getBlankCount(
                item.blanks_json,
              );

            return (
              <Link
                key={item.id}
                href={`/pte/reading/fibrw/${item.id}`}
                onClick={() => {

                  saveQuestionOrder(
                    "fibrw",
                    questionIds,
                  );

                }}
                className="block"
              >

                <article data-pte-view={viewMode} className="pte-practice-card group rounded-[var(--radius-md)] bg-[var(--card)] shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[var(--shadow-md)]">

                  <div className="relative">

                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)]/[0.025] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    <div className="pte-practice-card-body relative flex items-start justify-center gap-5 px-5 py-4 sm:px-6">

                      {/* Left */}

                      <div className="pte-practice-card-content w-full max-w-3xl">

                        {/* Tags */}

                        <div className="pte-practice-meta mb-2.5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">

                          {/* Left */}

                          <div className="pte-practice-badge-cloud flex flex-wrap items-center gap-2">

                            <Badge className="gap-1.5 px-2.5 py-1">
                              {(safeCurrentPage -
                                1) *
                                pagination.pageSize +
                                index +
                                1}
                            </Badge>

                            <Badge
                              variant="default"
                              className="gap-1.5 px-2.5 py-1"
                            >
                              <ChevronDown size={12} />
                              FIB-RW
                            </Badge>

                            <Badge
                              variant="warning"
                              className="gap-1.5 px-2.5 py-1"
                            >
                              <FileText size={12} />
                              {
                                blankCount
                              }{" "}
                              Blanks
                            </Badge>

                            {item.source_platform ? (
                              <Badge
                                variant="secondary"
                                className="gap-1.5 px-2.5 py-1"
                              >
                                <Fingerprint size={12} />
                                {
                                  item.source_platform
                                }
                              </Badge>
                            ) : null}

                            {item.is_prediction ? (
                              <Badge className="gap-1.5 bg-[var(--primary-soft)] px-2.5 py-1 text-[var(--primary)]">
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

                          <div className="pte-practice-status-row mr-2 flex flex-wrap items-center gap-2">

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

                        <PteEnglishTitle title={item.question_title} className="pte-practice-title mb-3 text-[16px] font-semibold leading-7 tracking-[0.01em] text-[var(--text)] transition-colors duration-300 sm:text-[18px] sm:leading-8" />

                        {/* Preview */}

                        {/* <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-soft)] p-4">

                          <div className="pte-practice-title line-clamp-4 text-[14px] leading-8 text-[var(--text-soft)]">

                            {preview}

                          </div>

                        </div> */}

                      </div>

                      {/* Progress */}

                      <div className="pte-practice-progress hidden w-[95px] flex-shrink-0 items-center justify-center md:flex">

                        <MasteryProgress
                          correct={
                            item.best_score
                          }
                          total={
                            blankCount
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
        currentPage={
          safeCurrentPage
        }
        totalPages={
          pagination.totalPages
        }
        onPageChange={
          onPageChange
        }
      />

    </section>
  );
}
