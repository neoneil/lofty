"use client";

import type { ComponentProps } from "react";
import { QuestionInfoCard } from "@/components/site/QuestionInfoCard";
import QuestionToolbar from "@/components/site/question-toolbar";
import FilterSelect from "@/components/ui/FilterSelect";
import { usePteQuestionBankUrlState } from "@/components/pte/use-pte-question-bank-url-state";
import type { PteQuestionBankFilters, PteQuestionBankPagination } from "@/lib/pte/question-bank-pagination";
import DiPracticeList from "./di-practice-list";

type Props = {
  questions: ComponentProps<typeof DiPracticeList>["initialQuestions"];
  questionInfo: ComponentProps<typeof QuestionInfoCard>["questionInfo"];
  filters: PteQuestionBankFilters;
  pagination: PteQuestionBankPagination;
};

export default function DiPageClient({ questions, questionInfo, filters, pagination }: Props) {
  const questionBank = usePteQuestionBankUrlState(filters);

  return (
    <section className={`w-full space-y-2 transition-opacity ${questionBank.isPending ? "opacity-70" : ""}`}>
      <QuestionInfoCard questionInfo={questionInfo} />
      <div className="relative z-50">
        <QuestionToolbar
          questionType="DI"
          searchTerm={questionBank.searchTerm}
          onSearchTermChange={questionBank.setSearchTerm}
          questionStatus={questionBank.questionStatus}
          onQuestionStatusChange={questionBank.setQuestionStatus}
          practiceStatus={questionBank.practiceStatus}
          onPracticeStatusChange={questionBank.setPracticeStatus}
          activityStatus={questionBank.activityStatus}
          onActivityStatusChange={questionBank.setActivityStatus}
          extraFilters={
            <FilterSelect
              value={filters.visualType}
              onChange={(value) => questionBank.updateQuery({ visualType: value })}
              options={[
                { label: "全部图形种类", value: "all" },
                { label: "Line Chart", value: "1" },
                { label: "Bar Chart", value: "2" },
                { label: "Pie Chart", value: "3" },
                { label: "Table", value: "4" },
                { label: "Flowchart", value: "5" },
                { label: "Map", value: "6" },
                { label: "Image", value: "7" },
                { label: "Mixed", value: "8" },
                { label: "Unknown", value: "9" },
              ]}
            />
          }
        />
      </div>
      <DiPracticeList initialQuestions={questions} pagination={pagination} onPageChange={questionBank.goToPage} />
    </section>
  );
}
