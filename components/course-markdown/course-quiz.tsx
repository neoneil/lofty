import { TriangleAlert } from "lucide-react";

import { parseCourseQuiz } from "@/lib/course-markdown/parse-quiz";
import QuizShortAnswer from "./quiz-short-answer";
import QuizSingle from "./quiz-single";

export default function CourseQuiz({ source }: { source: string }) {
  const result = parseCourseQuiz(source);

  if (!result.ok) {
    return <aside className="my-6 rounded-[var(--radius-md)] border border-[var(--danger)]/35 bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]"><div className="flex items-center gap-2 font-semibold"><TriangleAlert size={17} aria-hidden="true" />Quiz 配置无法渲染</div><p className="mt-2 leading-6">{result.error}</p></aside>;
  }

  return result.quiz.type === "single" ? <QuizSingle quiz={result.quiz} /> : <QuizShortAnswer quiz={result.quiz} />;
}
