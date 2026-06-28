"use client";

import { useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Card, CardContent } from "@/components/ui-v2/card";
import type { CoursePredictionQuestion } from "@/lib/pte/course-prediction-questions";
import { stripCourseSlideFooters } from "@/lib/course-markdown/parse-slide-footer";
import CourseEmbeddedQuestion from "./CourseEmbeddedQuestion";
import CourseMarkdownBody from "./CourseMarkdownBody";
import CoursePredictionQuestionList from "./CoursePredictionQuestionList";

type CourseArticleViewProps = {
  content: string;
  predictionQuestions?: CoursePredictionQuestion[];
};

export default function CourseArticleView({ content, predictionQuestions = [] }: CourseArticleViewProps) {
  const articleContent = stripCourseSlideFooters(content);
  const [selectedQuestion, setSelectedQuestion] = useState<CoursePredictionQuestion | null>(null);
  const [questionsCollapsed, setQuestionsCollapsed] = useState(false);
  const hasQuestions = predictionQuestions.length > 0;

  if (!hasQuestions) {
    return (
      <Card className="rounded-[var(--radius-lg)]">
        <CardContent className="p-5 sm:p-8 lg:p-10">
          <div data-course-markdown-content="true"><CourseMarkdownBody content={articleContent} /></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`grid gap-5 transition-[grid-template-columns,gap] duration-300 ${questionsCollapsed ? "lg:grid-cols-[0_minmax(0,1fr)] lg:gap-0" : "lg:grid-cols-[280px_minmax(0,1fr)]"}`}>
      <aside className={`min-w-0 overflow-hidden transition-opacity duration-200 ${questionsCollapsed ? "hidden pointer-events-none opacity-0 lg:block" : "opacity-100"}`} aria-hidden={questionsCollapsed}>
        <div className="max-h-[520px] w-full overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-3 shadow-[var(--shadow-sm)] lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:w-[280px]">
          <CoursePredictionQuestionList questions={predictionQuestions} selectedId={selectedQuestion?.id} onSelect={setSelectedQuestion} />
        </div>
      </aside>

      <div className="relative min-w-0">
        <button type="button" onClick={() => setQuestionsCollapsed((collapsed) => !collapsed)} className="absolute -left-3 top-4 z-20 hidden h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] text-[var(--text-soft)] shadow-[var(--shadow-sm)] transition hover:border-[var(--primary)] hover:text-[var(--primary)] lg:flex" aria-label={questionsCollapsed ? "展开预测题列表" : "收起预测题列表"} title={questionsCollapsed ? "展开预测题" : "收起预测题"}>
          {questionsCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </button>

        <Card className={`overflow-hidden rounded-[var(--radius-lg)] ${selectedQuestion ? "h-[720px]" : ""}`}>
          {selectedQuestion ? (
            <CourseEmbeddedQuestion question={selectedQuestion} onRestore={() => setSelectedQuestion(null)} />
          ) : (
            <CardContent className="p-5 sm:p-8 lg:p-10"><div data-course-markdown-content="true"><CourseMarkdownBody content={articleContent} /></div></CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
