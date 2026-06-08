"use client";

import { useMemo, useState } from "react";
import { QuestionInfoCard } from "@/components/site/QuestionInfoCard";
import QuestionToolbar from "@/components/site/question-toolbar";
import SgdPracticeList from "./sgd-practice-list";
import type { SgdQuestion } from "./page";

type QuestionInfo = {
  info: string | null;
  questions: string | null;
  contributing: string | null;
  examiner: string | null;
  suggestion: string | null;
  screen_instruction: string | null;
  official_requirements: string | null;
  hitting_rate: number | null;
  stability: number | null;
  importance: number | null;
};

type Props = {
  questions: SgdQuestion[];
  questionInfo: QuestionInfo | null;
};

function getSearchText(question: SgdQuestion) {
  return [
    question.title,
    question.question_title,
    question.question_text,
    question.original_text,
    question.answer_info,
    question.ai_keywords,
    question.keywords,
    question.tag_topic,
    question.search_text,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export default function SgdPageClient({ questions, questionInfo }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [questionStatus, setQuestionStatus] = useState("is_prediction");
  const [practiceStatus, setPracticeStatus] = useState("all");
  const [activityStatus, setActivityStatus] = useState("all");
  const [now] = useState(() => Date.now());

  const filteredQuestions = useMemo(() => {
    let result = [...questions];

    if (searchTerm.trim()) {
      const keyword = searchTerm.trim().toLowerCase();
      result = result.filter((q) => getSearchText(q).includes(keyword));
    }

    if (questionStatus === "is_prediction") {
      result = result.filter((q) => q.is_prediction);
    }

    if (questionStatus === "new") {
      result = result.filter((q) => {
        const created = new Date(q.created_at).getTime();
        const days = (now - created) / (1000 * 60 * 60 * 24);
        return days <= 14;
      });
    }

    if (questionStatus === "newest") {
      result.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }

    if (practiceStatus === "practiced") {
      result = result.filter((q) => q.is_practiced);
    }

    if (practiceStatus === "unpracticed") {
      result = result.filter((q) => !q.is_practiced);
    }

    if (activityStatus === "recently_practiced") {
      result.sort(
        (a, b) =>
          new Date(b.last_attempt_at ?? 0).getTime() -
          new Date(a.last_attempt_at ?? 0).getTime(),
      );
    }

    if (activityStatus === "highest_score") {
      result.sort((a, b) => (b.best_score ?? 0) - (a.best_score ?? 0));
    }

    if (activityStatus === "all" && questionStatus !== "newest") {
      result.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }

    return result;
  }, [activityStatus, now, practiceStatus, questionStatus, questions, searchTerm]);

  return (
    <section className="w-full space-y-2">
      <QuestionInfoCard questionInfo={questionInfo} />
      <div className="relative z-50">
        <QuestionToolbar
          questionType="SGD"
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          questionStatus={questionStatus}
          onQuestionStatusChange={setQuestionStatus}
          practiceStatus={practiceStatus}
          onPracticeStatusChange={setPracticeStatus}
          activityStatus={activityStatus}
          onActivityStatusChange={setActivityStatus}
        />
      </div>
      <SgdPracticeList initialQuestions={filteredQuestions} />
    </section>
  );
}
