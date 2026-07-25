"use client";

import { getPtePracticeListLayoutClass, PtePracticeViewToggle, type PtePracticeViewMode } from "@/components/pte/pte-practice-view-toggle";

import Link from "next/link";
import { useMemo, useState } from "react";
import ScorePercentProgress from "@/components/ui/score-percent-progress";
import Tag from "@/components/ui/tag";
import { saveQuestionOrder } from "@/lib/question-order";
import { Pagination } from "@/components/ui-v2/pagination";
import { Badge } from "@/components/ui-v2/badge";
import {
  AlertTriangle,
  ChartNoAxesColumn,
  CheckCircle2,
  CircleDashed,
  Fingerprint,
  ImageIcon,
  Mic,
  Sparkles,
} from "lucide-react";

type Question = {
  id: string;
  question_type: string;
  source_platform: string | null;
  title: string | null;
  question_text: string | null;
  image_url: string | null;
  answer_info: string | null;
  video_url: string | null;
  ai_keywords: string | null;
  difficulty_level: string | null;
  difficulty_raw: string | null;
  is_prediction: boolean | null;
  is_real_exam: boolean | null;
  is_active: boolean | null;
  tag1: string | number | null;
  tag2: string | number | null;
  tag3: string | number | null;
  tag4: string | number | null;
  raw_json: unknown;
  created_at: string;
  updated_at: string;
  search_text: string | null;

  is_practiced: boolean;
  attempt_count: number;
  correct_count: number;
  wrong_count: number;
  last_attempt_at: string | null;
  latest_score: number | null;
  best_score: number | null;
  is_wrong_question: boolean;
};

const LIST_PAGE_SIZE = 10;
const GRID_PAGE_SIZE = 15;

function getTags(question: Question) {
  return [formatVisualTypeTag(question.tag1), formatConfidenceTag(question.tag2)]
    .filter(Boolean) as string[];
}

function formatVisualTypeTag(value: string | number | null) {
  const code = Number(value);
  const labels: Record<number, string> = {
    1: "Line Chart",
    2: "Bar Chart",
    3: "Pie Chart",
    4: "Table",
    5: "Flowchart",
    6: "Map",
    7: "Image",
    8: "Mixed",
    9: "Unknown",
  };

  return labels[code] ?? null;
}

function formatConfidenceTag(value: string | number | null) {
  const code = Number(value);
  const labels: Record<number, string> = {
    1: "High Confidence",
    2: "Medium Confidence",
    3: "Low Confidence",
  };

  return labels[code] ?? null;
}

function getDisplayTitle(question: Question) {
  return question.title || question.question_text || question.answer_info || "DI Question";
}

export default function DiPracticeList({
  initialQuestions,
}: {
  initialQuestions: Question[];
}) {
  const questionIds = initialQuestions.map((q) => q.id);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<PtePracticeViewMode>("grid");
  const pageSize = viewMode === "grid" ? GRID_PAGE_SIZE : LIST_PAGE_SIZE;

  const totalPages = Math.max(
    1,
    Math.ceil(initialQuestions.length / pageSize),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedQuestions = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return initialQuestions.slice(startIndex, startIndex + pageSize);
  }, [safeCurrentPage, pageSize, initialQuestions]);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
                DI Question Bank
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

          <div className="flex items-center gap-2">
            <PtePracticeViewToggle value={viewMode} onChange={setViewMode} />
            <Tag tone="theme">DI</Tag>
          </div>
        </div>
      </div>

      <div className={getPtePracticeListLayoutClass(viewMode)}>
        {paginatedQuestions.map((item, index) => {
          const tags = getTags(item);

          return (
            <Link
              key={item.id}
              href={`/pte/speaking/di/${item.id}`}
              onClick={() => {
                saveQuestionOrder("di", questionIds);
              }}
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
                            {(safeCurrentPage - 1) * pageSize + index + 1}
                          </Badge>

                          <Badge
                            variant="default"
                            className="gap-1.5 px-2.5 py-1"
                          >
                            <Mic size={12} />
                            DI
                          </Badge>

                          {item.source_platform ? (
                            <Badge
                              variant="secondary"
                              className="gap-1.5 px-2.5 py-1"
                            >
                              <Fingerprint size={12} />
                              {item.source_platform}
                            </Badge>
                          ) : null}

                          {item.image_url ? (
                            <Badge
                              variant="warning"
                              className="gap-1.5 px-2.5 py-1"
                            >
                              <ImageIcon size={12} />
                              Image
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

                      <p className="pte-practice-title text-[15px] font-medium leading-7 tracking-[0.01em] text-[var(--text)] transition-colors duration-300 sm:text-[16px] sm:leading-8">
                        {getDisplayTitle(item)}
                      </p>

                      {tags.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {tags.map((tag) => (
                            <Tag key={tag} tone="neutral">
                              {tag}
                            </Tag>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="pte-practice-progress hidden w-[95px] flex-shrink-0 items-center justify-center md:flex">
                      <ScorePercentProgress score={item.best_score} />
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          );
        })}
      </div>

      <Pagination
        currentPage={safeCurrentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
      />
    </section>
  );
}
