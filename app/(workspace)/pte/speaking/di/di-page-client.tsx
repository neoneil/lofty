"use client";

import { useMemo, useState } from "react";
import { QuestionInfoCard } from "@/components/site/QuestionInfoCard";
import QuestionToolbar from "@/components/site/question-toolbar";
import FilterSelect from "@/components/ui/FilterSelect";
import DiPracticeList from "./di-practice-list";

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
  questions: Question[];
  questionInfo: QuestionInfo | null;
};

function getSearchText(question: Question) {
  return [
    question.title,
    question.question_text,
    question.answer_info,
    question.search_text,
    question.tag1,
    question.tag2,
    question.tag3,
    question.tag4,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export default function DiPageClient({ questions, questionInfo }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [questionStatus, setQuestionStatus] = useState("is_prediction");
  const [practiceStatus, setPracticeStatus] = useState("all");
  const [activityStatus, setActivityStatus] = useState("all");
  const [visualType, setVisualType] = useState("all");
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

    if (questionStatus === "re_is_prediction") {
      result = result.filter(
        (q) => q.is_prediction && (q.attempt_count ?? 0) > 30,
      );
    }

    if (visualType !== "all") {
      result = result.filter((q) => String(q.tag1) === visualType);
    }

    if (practiceStatus === "practiced") {
      result = result.filter((q) => q.is_practiced);
    }

    if (practiceStatus === "unpracticed") {
      result = result.filter((q) => !q.is_practiced);
    }

    if (practiceStatus === "wrong") {
      result = result.filter((q) => q.is_wrong_question);
    }

    if (practiceStatus === "mastered") {
      result = result.filter((q) => (q.correct_count ?? 0) >= 1);
    }

    if (practiceStatus === "weak") {
      result = result.filter(
        (q) =>
          (q.wrong_count ?? 0) >= (q.correct_count ?? 0) &&
          (q.attempt_count ?? 0) > 0,
      );
    }

    if (activityStatus === "most_practiced") {
      result.sort((a, b) => (b.attempt_count ?? 0) - (a.attempt_count ?? 0));
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
  }, [
    questions,
    searchTerm,
    questionStatus,
    practiceStatus,
    activityStatus,
    visualType,
    now,
  ]);

  return (
    <section className="w-full space-y-2">
      <QuestionInfoCard questionInfo={questionInfo} />
      <div className="relative z-50">
        <QuestionToolbar
          questionType="DI"
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          questionStatus={questionStatus}
          onQuestionStatusChange={setQuestionStatus}
          practiceStatus={practiceStatus}
          onPracticeStatusChange={setPracticeStatus}
          activityStatus={activityStatus}
          onActivityStatusChange={setActivityStatus}
          extraFilters={
            <FilterSelect
              value={visualType}
              onChange={setVisualType}
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
      <DiPracticeList initialQuestions={filteredQuestions} />
    </section>
  );
}
