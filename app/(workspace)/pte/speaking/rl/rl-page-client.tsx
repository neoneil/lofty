"use client";

import { useMemo, useState } from "react";
import { QuestionInfoCard } from "@/components/site/QuestionInfoCard";
import QuestionToolbar from "@/components/site/question-toolbar";
import RlPracticeList from "./rl-practice-list";

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
    question.question_title,
    question.question_text,
    question.original_text,
    question.answer_info,
    question.ai_keywords,
    question.keywords,
    question.search_text,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export default function RlPageClient({ questions, questionInfo }: Props) {
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
  }, [questions, searchTerm, questionStatus, practiceStatus, activityStatus, now]);

  return (
    <section className="w-full space-y-2">
      <QuestionInfoCard questionInfo={questionInfo} />
      <div className="relative z-50">
        <QuestionToolbar
          questionType="RL"
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
      <RlPracticeList initialQuestions={filteredQuestions} />
    </section>
  );
}
