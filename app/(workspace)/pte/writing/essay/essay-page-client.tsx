"use client";

import { useMemo, useState } from "react";
import { QuestionInfoCard } from "@/components/site/QuestionInfoCard";
import QuestionToolbar from "@/components/site/question-toolbar";
import EssayList from "./essay-list";

type Question = {
  id: string;
  question_text: string;
  question_type: string;
  response_type: string | null;
  is_prediction: boolean | null;
  created_at: string;
  updated_at: string;

  is_practiced: boolean;
  attempt_count: number;
  correct_count: number;
  wrong_count: number;
  completed_count: number;
  last_attempt_at: string | null;
  latest_score: number | null;
  best_score: number | null;
  is_wrong_question: boolean;
};

type Props = {
  questions: Question[];
  questionInfo: any;
};

function getWordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function EssayPageClient({ questions, questionInfo }: Props) {
  const [searchTerm, setSearchTerm] = useState("");

  const [questionStatus, setQuestionStatus] = useState("is_prediction"); // 默认就是活跃题型 不是 all

  const [practiceStatus, setPracticeStatus] = useState("all");

  const [activityStatus, setActivityStatus] = useState("all");

  const filteredQuestions = useMemo(() => {
    let result = [...questions];

    // SEARCH
    if (searchTerm.trim()) {
      const keyword = searchTerm.trim().toLowerCase();

      result = result.filter((q) =>
        q.question_text.toLowerCase().includes(keyword),
      );
    }

    // QUESTION STATUS
    if (questionStatus === "is_prediction") {
      result = result.filter((q) => q.is_prediction);
    }

    if (questionStatus === "new") {
      result = result.filter((q) => {
        const created = new Date(q.created_at).getTime();

        const now = Date.now();

        const days = (now - created) / (1000 * 60 * 60 * 24);

        return days <= 14;
      });
    }

    if (questionStatus === "re_is_prediction") {
      result = result.filter((q) => q.is_practiced);
    }

    // PRACTICE STATUS
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

    // ACTIVITY STATUS
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

    // DEFAULT SORT // 由大到小 逆向输出
    if (activityStatus === "all") {
      result.sort(
        (a, b) => getWordCount(b.question_text) - getWordCount(a.question_text),
      );
    }

    return result;
  }, [questions, searchTerm, questionStatus, practiceStatus, activityStatus]);

  return (
    <section className="w-full space-y-2">
      <QuestionInfoCard questionInfo={questionInfo} />
      <div className="relative z-50">
        <QuestionToolbar
          questionType="WE"
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
      <EssayList initialQuestions={filteredQuestions} />
    </section>
  );
}
