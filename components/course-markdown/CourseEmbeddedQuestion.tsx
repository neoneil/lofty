"use client";

import { ExternalLink, RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import type { CoursePredictionQuestion } from "@/lib/pte/course-prediction-questions";

type CourseEmbeddedQuestionProps = {
  question: CoursePredictionQuestion;
  onRestore: () => void;
};

export default function CourseEmbeddedQuestion({ question, onRestore }: CourseEmbeddedQuestionProps) {
  const separator = question.href.includes("?") ? "&" : "?";
  const embedUrl = `${question.href}${separator}embed=course`;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[inherit] bg-[var(--card)]">
      <div className="flex flex-col gap-3 border-b border-[var(--border)] bg-[var(--card)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2"><Badge>预测题</Badge>{question.difficulty && <Badge variant="secondary">难度 {question.difficulty}</Badge>}</div>
          <p className="truncate text-sm font-semibold text-[var(--text)]">{question.title}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <a href={question.href} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-3 text-xs font-semibold text-[var(--text-soft)] transition hover:bg-[var(--bg-soft)] hover:text-[var(--text)]">
            <ExternalLink size={14} aria-hidden="true" />
            新窗口
          </a>
          <Button type="button" variant="secondary" size="sm" onClick={onRestore} className="gap-1.5">
            <RotateCcw size={14} aria-hidden="true" />
            恢复课件
          </Button>
        </div>
      </div>
      <iframe key={embedUrl} src={embedUrl} title={`预测题：${question.title}`} allow="microphone; autoplay" className="min-h-0 flex-1 border-0 bg-[var(--bg)]" />
    </div>
  );
}
