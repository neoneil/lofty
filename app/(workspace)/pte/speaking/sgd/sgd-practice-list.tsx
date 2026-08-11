"use client";

import { getPtePracticeListLayoutClass, PtePracticeViewToggle, type PtePracticeViewMode } from "@/components/pte/pte-practice-view-toggle";
import { PteEnglishTitle } from "@/components/pte/pte-english-title";

import Link from "next/link";
import { useState } from "react";
import { Pagination } from "@/components/ui-v2/pagination";
import { Badge } from "@/components/ui-v2/badge";
import Tag from "@/components/ui/tag";
import ScorePercentProgress from "@/components/ui/score-percent-progress";
import { saveQuestionOrder } from "@/lib/question-order";
import {
  AlertTriangle,
  ChartNoAxesColumn,
  CheckCircle2,
  CircleDashed,
  Fingerprint,
  Headphones,
  Mic,
  Sparkles,
} from "lucide-react";
import type { SgdQuestion } from "./page";

function getDisplayTitle(question: SgdQuestion) {
  return (
    question.title ||
    question.question_title ||
    question.question_text ||
    question.question_num ||
    "SGD Question"
  );
}

export default function SgdPracticeList({
  initialQuestions,
  pagination,
  onPageChange,
}: {
  initialQuestions: SgdQuestion[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
}) {
  const questionIds = initialQuestions.map((q) => q.id);
  const [viewMode, setViewMode] = useState<PtePracticeViewMode>("grid");
  const safeCurrentPage = Math.min(pagination.currentPage, pagination.totalPages);

  return (
    <section className="mx-auto block w-full max-w-7xl px-4 sm:px-6 lg:max-w-[84%] lg:px-0">
      <div className="mb-4 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-between px-5 py-4 sm:px-6">
          <div className="flex items-center gap-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
              <ChartNoAxesColumn size={16} />
            </div>

            <div className="flex items-center gap-3">
              <div className="text-base font-semibold tracking-tight text-[var(--text)]">
                SGD Question Bank
              </div>
              <div className="h-4 w-px bg-[var(--border)]" />
              <div className="text-sm text-[var(--text-soft)]">
                当前题目数量：
                <span className="ml-1 font-semibold text-[var(--primary)]">
                  {pagination.totalCount}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PtePracticeViewToggle value={viewMode} onChange={setViewMode} />
            <Tag tone="theme">SGD</Tag>
          </div>
        </div>
      </div>

      <div className={getPtePracticeListLayoutClass(viewMode)}>
        {initialQuestions.map((item, index) => (
          <Link
            key={item.id}
            href={`/pte/speaking/sgd/${item.id}`}
            onClick={() => saveQuestionOrder("sgd", questionIds)}
            className="block"
          >
            <article data-pte-view={viewMode} className="pte-practice-card group rounded-[var(--radius-md)] bg-[var(--card)] shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[var(--shadow-md)]">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)]/[0.025] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="pte-practice-card-body relative flex items-start justify-center gap-5 px-5 py-4 sm:px-6">
                  <div className="pte-practice-card-content w-full max-w-3xl">
                    <div className="pte-practice-meta mb-2.5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="pte-practice-badge-cloud flex flex-wrap items-center gap-2">
                        <Badge className="gap-1.5 px-2.5 py-1">
                          {(safeCurrentPage - 1) * pagination.pageSize + index + 1}
                        </Badge>
                        <Badge variant="default" className="gap-1.5 px-2.5 py-1">
                          <Mic size={12} />
                          SGD
                        </Badge>
                        {item.source_question_id ? (
                          <Badge variant="secondary" className="gap-1.5 px-2.5 py-1">
                            <Fingerprint size={12} />
                            {item.source_question_id}
                          </Badge>
                        ) : null}
                        {item.audio_url || item.storage_path || item.source_audio_url ? (
                          <Badge variant="warning" className="gap-1.5 px-2.5 py-1">
                            <Headphones size={12} />
                            Audio
                          </Badge>
                        ) : null}
                        {item.is_prediction ? (
                          <Badge className="gap-1.5 bg-[var(--primary-soft)] px-2.5 py-1 text-[var(--primary)]">
                            <Sparkles size={12} />
                            Prediction
                          </Badge>
                        ) : null}
                        {item.is_wrong_question ? (
                          <Badge variant="danger" className="gap-1.5 px-2.5 py-1">
                            <AlertTriangle size={12} />
                            Wrong
                          </Badge>
                        ) : null}
                      </div>

                      <div className="pte-practice-status-row mr-2 flex flex-wrap items-center gap-2">
                        {item.is_practiced ? (
                          <Badge variant="success" className="gap-1.5 px-2.5 py-1">
                            <CheckCircle2 size={12} />
                            Practiced
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1.5 px-2.5 py-1">
                            <CircleDashed size={12} />
                            Unpracticed
                          </Badge>
                        )}
                      </div>
                    </div>

                    <PteEnglishTitle title={getDisplayTitle(item)} className="pte-practice-title text-[15px] font-medium leading-7 tracking-[0.01em] text-[var(--text)] transition-colors duration-300 sm:text-[16px] sm:leading-8" />

                    {item.tag_topic ? (
                      <p className="mt-2 text-sm text-[var(--text-soft)]">
                        {item.tag_topic}
                      </p>
                    ) : null}
                  </div>

                  <div className="pte-practice-progress hidden w-[95px] flex-shrink-0 items-center justify-center md:flex">
                    <ScorePercentProgress score={item.best_score} />
                  </div>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>

      <Pagination
        currentPage={safeCurrentPage}
        totalPages={pagination.totalPages}
        onPageChange={onPageChange}
      />
    </section>
  );
}
