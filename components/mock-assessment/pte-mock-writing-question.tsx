"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui-v2/badge";
import { Textarea } from "@/components/ui-v2/textarea";
import type { PteMockQuestion, PteMockQuestionResponse } from "@/lib/mock-assessment/pte-mock-types";

export function PteMockWritingQuestion({ question, onResponseChange }: { question: PteMockQuestion; onResponseChange?: (response: PteMockQuestionResponse) => void }) {
  const [answer, setAnswer] = useState("");
  const wordCount = useMemo(() => answer.trim().split(/\s+/).filter(Boolean).length, [answer]);
  const isSwt = question.type === "SWT";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2"><Badge>{question.type}</Badge><Badge variant="secondary">Writing</Badge><Badge variant={isSwt ? (wordCount >= 5 && wordCount <= 75 ? "success" : "warning") : (wordCount >= 200 ? "success" : "secondary")}>{wordCount} words</Badge></div>
      <div><h2 className="text-xl font-semibold text-[var(--text)] sm:text-2xl">{question.title}</h2><p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">{isSwt ? "阅读文章，并用一个不超过 75 词的完整句子概括内容。" : "根据题目完成一篇结构清晰的议论文。"}</p></div>
      <div className="max-h-[360px] overflow-y-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 text-sm leading-7 text-[var(--text)] sm:p-5">{question.prompt}</div>
      <Textarea value={answer} onChange={(event) => { setAnswer(event.target.value); onResponseChange?.({ text: event.target.value }); }} placeholder={isSwt ? "Write one sentence..." : "Write your essay..."} className={isSwt ? "min-h-36" : "min-h-[320px]"} />
      <p className="text-xs text-[var(--text-faint)]">内容只保存在当前页面内存，进入下一题后不会提交到数据库。</p>
    </div>
  );
}
