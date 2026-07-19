"use client";

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
  Headphones,
  Mic,
  Sparkles,
} from "lucide-react";

type Question = {
  id: string;
  question_type: string;
  source_platform: string | null;
  source_question_id: string | null;
  title: string | null;
  question_title: string | null;
  question_text: string | null;
  audio_url: string | null;
  source_audio_url: string | null;
  storage_path: string | null;
  image_url: string | null;
  question_image_url: string | null;
  original_text: string | null;
  transcript: string | null;
  answer_info: string | null;
  ai_keywords: string | null;
  keywords: string | null;
  difficulty_level: string | null;
  is_prediction: boolean | null;
  is_real_exam: boolean | null;
  is_active: boolean | null;
  tag1: number | null;
  tag2: number | null;
  tag3: number | null;
  tag4: number | null;
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

const PAGE_SIZE = 10;

function getDisplayTitle(question: Question) {
  return (
    question.title ||
    question.question_title ||
    question.question_text ||
    question.transcript ||
    question.original_text ||
    "RL Question"
  );
}

export default function RlPracticeList({
  initialQuestions,
}: {
  initialQuestions: Question[];
}) {
  const questionIds = initialQuestions.map((q) => q.id);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(
    1,
    Math.ceil(initialQuestions.length / PAGE_SIZE),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedQuestions = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
    return initialQuestions.slice(startIndex, startIndex + PAGE_SIZE);
  }, [safeCurrentPage, initialQuestions]);

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
                RL Question Bank
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

          <Tag tone="theme">RL</Tag>
        </div>
      </div>

      <div className="mx-auto w-[97.5%] space-y-1">
        {paginatedQuestions.map((item, index) => {
          return (
            <Link
              key={item.id}
              href={`/pte/speaking/rl/${item.id}`}
              onClick={() => {
                saveQuestionOrder("rl", questionIds);
              }}
              className="block"
            >
              <article className="group rounded-[var(--radius-md)] bg-[var(--card)] shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[var(--shadow-md)]">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)]/[0.025] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  <div className="relative flex items-start justify-center gap-5 px-5 py-4 sm:px-6">
                    <div className="w-full max-w-3xl">
                      <div className="mb-2.5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="gap-1.5 px-2.5 py-1">
                            {(safeCurrentPage - 1) * PAGE_SIZE + index + 1}
                          </Badge>

                          <Badge
                            variant="default"
                            className="gap-1.5 px-2.5 py-1"
                          >
                            <Mic size={12} />
                            RL
                          </Badge>

                          {item.source_question_id ? (
                            <Badge
                              variant="secondary"
                              className="gap-1.5 px-2.5 py-1"
                            >
                              <Fingerprint size={12} />
                              {item.source_question_id}
                            </Badge>
                          ) : null}

                          {item.audio_url || item.storage_path ? (
                            <Badge
                              variant="warning"
                              className="gap-1.5 px-2.5 py-1"
                            >
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
                            <Badge
                              variant="danger"
                              className="gap-1.5 px-2.5 py-1"
                            >
                              <AlertTriangle size={12} />
                              Wrong
                            </Badge>
                          ) : null}
                        </div>

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

                      <p className="text-[15px] font-medium leading-7 tracking-[0.01em] text-[var(--text)] transition-colors duration-300 sm:text-[16px] sm:leading-8">
                        {getDisplayTitle(item)}
                      </p>
                    </div>

                    <div className="hidden w-[95px] flex-shrink-0 items-center justify-center md:flex">
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
