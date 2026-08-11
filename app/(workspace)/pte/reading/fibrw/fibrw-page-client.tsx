"use client";

import type { ComponentProps } from "react";
import { QuestionInfoCard } from "@/components/site/QuestionInfoCard";
import QuestionToolbar from "@/components/site/question-toolbar";
import { usePteQuestionBankUrlState } from "@/components/pte/use-pte-question-bank-url-state";
import type { PteQuestionBankFilters, PteQuestionBankPagination } from "@/lib/pte/question-bank-pagination";
import FibrwList from "./fibrw-list";

type Props = {
  questions: ComponentProps<typeof FibrwList>["initialQuestions"];
  questionInfo: ComponentProps<typeof QuestionInfoCard>["questionInfo"];
  filters: PteQuestionBankFilters;
  pagination: PteQuestionBankPagination;
};

export default function FibrwPageClient({ questions, questionInfo, filters, pagination }: Props) {
  const questionBank = usePteQuestionBankUrlState(filters);

  return (
    <section className={`w-full space-y-2 transition-opacity ${questionBank.isPending ? "opacity-70" : ""}`}>
      <QuestionInfoCard questionInfo={questionInfo} />
      <div className="relative z-50">
        <QuestionToolbar
          questionType="FIBRW"
          searchTerm={questionBank.searchTerm}
          onSearchTermChange={questionBank.setSearchTerm}
          questionStatus={questionBank.questionStatus}
          onQuestionStatusChange={questionBank.setQuestionStatus}
          practiceStatus={questionBank.practiceStatus}
          onPracticeStatusChange={questionBank.setPracticeStatus}
          activityStatus={questionBank.activityStatus}
          onActivityStatusChange={questionBank.setActivityStatus}
        />
      </div>
      <FibrwList initialQuestions={questions} pagination={pagination} onPageChange={questionBank.goToPage} />
    </section>
  );
}
