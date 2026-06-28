"use client";

import { FileQuestion, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import type { CoursePredictionQuestion } from "@/lib/pte/course-prediction-questions";

type CoursePredictionQuestionListProps = {
  questions: CoursePredictionQuestion[];
  selectedId?: string | null;
  onSelect: (question: CoursePredictionQuestion) => void;
};

export default function CoursePredictionQuestionList({ questions, selectedId, onSelect }: CoursePredictionQuestionListProps) {
  return (
    <div className="flex min-h-0 flex-col">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
          <Sparkles size={16} className="text-[var(--primary)]" aria-hidden="true" />
          预测题库
        </div>
        <Badge variant="secondary">{questions.length} 题</Badge>
      </div>

      {questions.length === 0 ? (
        <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--bg-soft)] px-4 py-8 text-center text-sm text-[var(--text-soft)]">
          <FileQuestion className="mx-auto mb-2 text-[var(--text-faint)]" size={22} aria-hidden="true" />
          当前题型暂无预测题
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map((question, index) => {
            const active = selectedId === question.id;

            return (
              <button key={question.id} type="button" onClick={() => onSelect(question)} className={`w-full rounded-[var(--radius-md)] border px-3 py-3 text-left transition ${active ? "border-[var(--primary)] bg-[var(--primary-soft)] shadow-[var(--shadow-sm)]" : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)] hover:bg-[var(--bg-soft)]"}`}>
                <div className="flex items-start gap-2.5">
                  <span className={`flex h-6 min-w-6 items-center justify-center rounded-[var(--radius-sm)] px-1.5 text-[11px] font-bold ${active ? "bg-[var(--primary)] text-white" : "bg-[var(--bg-soft)] text-[var(--text-soft)]"}`}>{index + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 block text-sm font-semibold leading-5 text-[var(--text)]">{question.title}</span>
                    {question.preview && question.preview !== question.title ? <span className="mt-1 line-clamp-2 block text-xs leading-5 text-[var(--text-soft)]">{question.preview}</span> : null}
                    {(question.sourceId || question.difficulty) && <span className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-[var(--text-faint)]">{question.sourceId && <span>#{question.sourceId}</span>}{question.difficulty && <span>难度 {question.difficulty}</span>}</span>}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
