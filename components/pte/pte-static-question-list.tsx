"use client";

import { PendingNavigationLink as Link } from "@/components/navigation/pending-navigation-link";
import { useMemo, useState } from "react";
import { BookOpenCheck, CheckCircle2, FileText, Headphones, ListChecks, PenLine } from "lucide-react";

import { getPtePracticeListLayoutClass, PtePracticeViewToggle, type PtePracticeViewMode } from "@/components/pte/pte-practice-view-toggle";
import { PteEnglishTitle } from "@/components/pte/pte-english-title";
import Tag from "@/components/ui/tag";
import { Badge } from "@/components/ui-v2/badge";
import { Pagination } from "@/components/ui-v2/pagination";
import { saveQuestionOrder } from "@/lib/question-order";
import type { PteStaticQuestion } from "@/lib/pte/static-sample-questions";

type Props = {
  questions: PteStaticQuestion[];
};

function getTypeIcon(question: PteStaticQuestion) {
  if (question.type.startsWith("listening")) return <Headphones size={16} />;
  if (question.type === "reading-multiple") return <ListChecks size={16} />;
  return <BookOpenCheck size={16} />;
}

function getSnippet(question: PteStaticQuestion) {
  return question.passage ?? question.listeningText ?? question.transcriptWithBlanks ?? question.question ?? "";
}

function getQuestionMeta(question: PteStaticQuestion) {
  if (question.type === "listening-fill-blank") return `${question.answers?.length ?? 0} blanks`;
  if (question.answers && question.answers.length > 1) return `${question.answers.length} answers`;
  return "1 answer";
}

export default function PteStaticQuestionList({ questions }: Props) {
  const [viewMode, setViewMode] = useState<PtePracticeViewMode>("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const firstQuestion = questions[0];
  const pageSize = viewMode === "grid" ? 15 : 10;
  const totalPages = Math.max(1, Math.ceil(questions.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageQuestions = useMemo(
    () => questions.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize),
    [questions, pageSize, safeCurrentPage],
  );
  const questionIds = questions.map((question) => question.id);

  if (!firstQuestion) {
    return (
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:max-w-[84%] lg:px-0">
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-6 text-[var(--text-soft)]">
          No questions available.
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto block w-full max-w-7xl px-4 sm:px-6 lg:max-w-[84%] lg:px-0">
      <div className="mb-4 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
        <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
              {getTypeIcon(firstQuestion)}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="text-base font-semibold tracking-tight text-[var(--text)]">{firstQuestion.code} Question Bank</div>
              <div className="hidden h-4 w-px bg-[var(--border)] sm:block" />
              <div className="text-sm text-[var(--text-soft)]">
                当前题目数量：
                <span className="ml-1 font-semibold text-[var(--primary)]">{questions.length}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PtePracticeViewToggle
              value={viewMode}
              onChange={(nextMode) => {
                setViewMode(nextMode);
                setCurrentPage(1);
              }}
            />
            <Tag tone="theme">{firstQuestion.code}</Tag>
          </div>
        </div>
      </div>

      <div className={getPtePracticeListLayoutClass(viewMode)}>
        {pageQuestions.map((question, index) => {
          const absoluteIndex = (safeCurrentPage - 1) * pageSize + index + 1;
          const snippet = getSnippet(question);

          return (
            <Link
              key={question.id}
              href={`${question.route}/${question.id}`}
              onClick={() => saveQuestionOrder(question.bankKey, questionIds)}
              className="block"
            >
              <article
                data-pte-view={viewMode}
                className="pte-practice-card group rounded-[var(--radius-md)] bg-[var(--card)] shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[var(--shadow-md)]"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)]/[0.025] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  <div className="pte-practice-card-body relative flex items-start justify-center gap-5 px-5 py-4 sm:px-6">
                    <div className="pte-practice-card-content w-full max-w-3xl">
                      <div className="pte-practice-meta mb-2.5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="pte-practice-badge-cloud flex flex-wrap items-center gap-2">
                          <Badge className="gap-1.5 px-2.5 py-1">{absoluteIndex}</Badge>
                          <Badge variant="default" className="gap-1.5 px-2.5 py-1">
                            {getTypeIcon(question)}
                            {question.code}
                          </Badge>
                          <Badge variant="warning" className="gap-1.5 px-2.5 py-1">
                            <FileText size={12} />
                            {getQuestionMeta(question)}
                          </Badge>
                          <Badge variant="secondary" className="gap-1.5 px-2.5 py-1">
                            <PenLine size={12} />
                            Practice
                          </Badge>
                        </div>

                        <div className="pte-practice-status-row mr-2 flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="gap-1.5 px-2.5 py-1">
                            <CheckCircle2 size={12} />
                            Ready
                          </Badge>
                        </div>
                      </div>

                      <PteEnglishTitle
                        title={question.title}
                        className="pte-practice-title mb-3 text-[16px] font-semibold leading-7 tracking-[0.01em] text-[var(--text)] transition-colors duration-300 sm:text-[18px] sm:leading-8"
                      />
                      <p className="line-clamp-3 text-sm leading-6 text-[var(--text-soft)]">{snippet}</p>
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          );
        })}
      </div>

      <Pagination currentPage={safeCurrentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </section>
  );
}
