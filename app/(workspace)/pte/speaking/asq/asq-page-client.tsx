"use client";

import { useMemo, useState } from "react";
import { QuestionInfoCard } from "@/components/site/QuestionInfoCard";
import QuestionToolbar from "@/components/site/question-toolbar";
import AsqPracticeList from "./asq-practice-list";

type Question = {
  id: string;
  question_text: string | null;
  answer_text: string | null;
  question_type: string;
  source_question_id: string | null;
  difficulty_level: string | null;
  is_prediction: boolean | null;
  audio_url: string | null;
  audio_duration_seconds: number | null;
  created_at: string;
  updated_at: string;
  is_real_exam: boolean | null;

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
  return `${question.question_text ?? ""} ${question.answer_text ?? ""}`;
}

export default function AsqPageClient({ questions, questionInfo }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [questionStatus, setQuestionStatus] = useState("is_prediction");
  const [practiceStatus, setPracticeStatus] = useState("all");
  const [activityStatus, setActivityStatus] = useState("all");
  const [now] = useState(() => Date.now());

  const filteredQuestions = useMemo(() => {
    let result = [...questions];

    if (searchTerm.trim()) {
      const keyword = searchTerm.trim().toLowerCase();
      result = result.filter((q) =>
        getSearchText(q).toLowerCase().includes(keyword),
      );
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
    now,
  ]);

  return (
    <section className="w-full space-y-2">
      <QuestionInfoCard questionInfo={questionInfo} />
      <div className="relative z-50">
        <QuestionToolbar
          questionType="ASQ"
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
      <AsqPracticeList initialQuestions={filteredQuestions} />
    </section>
  );
}
