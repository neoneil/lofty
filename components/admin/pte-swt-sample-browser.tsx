"use client";

import { useMemo, useRef, useState } from "react";
import { CheckCircle2, FileText, Loader2, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui-v2/card";

export type PteSwtSampleQuestion = {
  id: string;
  question_title: string | null;
  question_text: string;
  source_answer: string | null;
  created_at: string;
  answer: PteSwtSampleAnswer | null;
  components: PteSwtSampleComponent[];
};

export type PteSwtSampleAnswer = {
  id: string;
  swt_id: string;
  answer_text: string;
  chinese_explanation: string | null;
  word_count: number | null;
  score_target: number | null;
  created_at: string;
};

export type PteSwtSampleComponent = {
  id: string;
  swt_id: string | null;
  swt_answer_id: string | null;
  component_text: string;
  chinese_explanation: string | null;
  component_role: string | null;
  grammar_pattern: string | null;
  source_idea: string | null;
  created_at: string;
};

type GenerateNextResponse =
  | {
      ok: true;
      done: true;
      message: string;
    }
  | {
      ok: true;
      done: false;
      question: {
        id: string;
        question_title: string | null;
        question_text: string;
        answer: string | null;
        created_at: string;
      };
      answer: PteSwtSampleAnswer;
      components: PteSwtSampleComponent[];
      message: string;
    }
  | {
      ok: false;
      message: string;
    };

function getSourceTranslation(components: PteSwtSampleComponent[]) {
  return components.find((component) => component.component_role === "source_translation")?.chinese_explanation ?? "";
}

function getLearningComponents(components: PteSwtSampleComponent[]) {
  return components.filter((component) => component.component_role !== "source_translation");
}

function previewText(value: string, length = 88) {
  return `${value.slice(0, length)}${value.length > length ? "..." : ""}`;
}

export function PteSwtSampleBrowser({ initialQuestions }: { initialQuestions: PteSwtSampleQuestion[] }) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const stopRequestedRef = useRef(false);

  const completedCount = questions.filter((question) => question.answer).length;
  const missingCount = questions.length - completedCount;
  const sortedQuestions = useMemo(() => [...questions].sort((first, second) => Number(Boolean(second.answer)) - Number(Boolean(first.answer))), [questions]);

  function mergeGenerated(result: Extract<GenerateNextResponse, { done: false }>) {
    setQuestions((current) => current.map((question) => question.id === result.question.id ? { ...question, answer: result.answer, components: result.components } : question));
  }

  async function generateMissing() {
    const missingQuestions = questions.filter((question) => !question.answer);
    if (missingQuestions.length === 0) {
      window.alert("所有 PTE SWT 题目都已经有答案。");
      return;
    }

    const previewList = missingQuestions.slice(0, 8).map((question, index) => `${index + 1}. ${previewText(question.question_title || question.question_text, 90)}`).join("\n");
    const extraCount = missingQuestions.length > 8 ? `\n另外还有 ${missingQuestions.length - 8} 道未显示。` : "";
    if (!window.confirm(`师傅，发现 ${missingQuestions.length} 道 PTE SWT 还没有答案。\n\n${previewList}${extraCount}\n\n是否生成答案？`)) return;

    setIsGenerating(true);
    stopRequestedRef.current = false;
    setStatus("正在准备生成... 每道题会单独生成和保存，建议每批 5 道观察质量。");

    try {
      let generated = 0;
      let remaining = missingQuestions.length;
      while (generated < 5) {
        if (stopRequestedRef.current) {
          setStatus(`已手动停止。本次已生成 ${generated} 道，剩余题目可之后继续补齐。`);
          break;
        }

        setStatus(`正在生成第 ${generated + 1} 道 SWT，预计剩余 ${remaining} 道...`);
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 150000);
        const response = await fetch("/api/admin/pte-swt-samples/generate-next", { method: "POST", signal: controller.signal });
        window.clearTimeout(timeout);
        const result = await response.json() as GenerateNextResponse;

        if (!response.ok || !result.ok) {
          throw new Error("message" in result ? result.message : "生成失败");
        }

        if (result.done) {
          setStatus(generated > 0 ? `已补齐完成，本次生成 ${generated} 道。` : result.message);
          break;
        }

        generated += 1;
        remaining = Math.max(0, remaining - 1);
        mergeGenerated(result);
        setStatus(`已生成并保存 ${generated} 道：${previewText(result.question.question_title || result.question.question_text, 72)}`);
      }

      if (generated === 5) setStatus("本批 5 道已完成。请刷新或继续点击按钮补齐下一批。");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setStatus("本次生成超过 150 秒，已自动停止。已保存成功的题目不会丢失，可以稍后继续点击补齐。");
      } else {
        setStatus(error instanceof Error ? error.message : "生成失败");
      }
    } finally {
      setIsGenerating(false);
    }
  }

  function stopGenerating() {
    stopRequestedRef.current = true;
    setStatus("正在等待当前这一题结束，然后停止...");
  }

  function toggleExpanded(questionId: string) {
    setExpandedIds((current) => current.includes(questionId) ? current.filter((id) => id !== questionId) : [...current, questionId]);
  }

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden rounded-[var(--radius-lg)] border-[var(--primary)]/18 bg-[linear-gradient(135deg,var(--card),var(--primary-soft))] shadow-[var(--shadow-sm)]">
        <CardHeader className="flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <Badge>PTE SWT Library</Badge>
            <CardTitle className="mt-3 text-2xl">PTE SWT 范文与翻译</CardTitle>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">动态读取活跃 SWT 预测题，生成 75 词以内一句话答案、原文中文翻译、答案中文翻译与句子合并技巧拆解。</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">总题数 {questions.length}</Badge>
            <Badge variant="success">已完成 {completedCount}</Badge>
            <Badge variant={missingCount > 0 ? "warning" : "success"}>未完成 {missingCount}</Badge>
            <Button type="button" size="sm" onClick={generateMissing} disabled={isGenerating} className="gap-2">{isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}{isGenerating ? "生成中..." : "检查题目答案"}</Button>
            {isGenerating ? <Button type="button" size="sm" variant="secondary" onClick={stopGenerating}>停止</Button> : null}
          </div>
        </CardHeader>
        {status ? <CardContent className="border-t border-[var(--primary)]/15 p-5"><div className="rounded-[var(--radius-md)] border border-[var(--primary)]/20 bg-[var(--card)]/80 px-4 py-3 text-sm text-[var(--text)] shadow-[var(--shadow-xs)]">{status}</div></CardContent> : null}
      </Card>

      <div className="grid gap-4">
        {sortedQuestions.map((question, index) => {
          const expanded = expandedIds.includes(question.id);
          const sourceTranslation = getSourceTranslation(question.components);
          const learningComponents = getLearningComponents(question.components);
          const title = question.question_title || `SWT ${index + 1}`;

          return (
            <Card key={question.id} className={`overflow-hidden rounded-[var(--radius-lg)] transition-all duration-300 ${expanded ? "border-[var(--primary)]/30 shadow-[var(--shadow-md)]" : "border-[var(--border)] shadow-[var(--shadow-xs)] hover:border-[var(--primary)]/25 hover:shadow-[var(--shadow-sm)]"}`}>
              <button type="button" onClick={() => toggleExpanded(question.id)} className={`flex w-full flex-col gap-4 p-5 text-left transition sm:flex-row sm:items-start sm:justify-between ${expanded ? "bg-[linear-gradient(135deg,var(--primary-soft),var(--card))]" : "hover:bg-[var(--primary-soft)]/35"}`}>
                <div className="min-w-0">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{index + 1}</Badge>
                    <Badge variant={question.answer ? "success" : "warning"}>{question.answer ? "已生成范文" : "待生成"}</Badge>
                    {question.answer ? <Badge variant="secondary">{question.answer.word_count ?? 0} words</Badge> : null}
                  </div>
                  <p className="text-sm font-semibold leading-7 text-[var(--text)]">{title}</p>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--text-soft)]">{question.question_text}</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[var(--primary)]">{question.answer ? <CheckCircle2 size={16} /> : <FileText size={16} />}{expanded ? "收起" : "查看范文"}</span>
              </button>

              {expanded ? (
                <div className="border-t border-[var(--primary)]/15 bg-[linear-gradient(180deg,var(--card),var(--bg-soft))] p-5">
                  {question.answer ? (
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
                      <div className="space-y-4">
                        <section className="rounded-[var(--radius-md)] border border-[var(--primary)]/18 bg-[var(--card)]/92 p-4 shadow-[var(--shadow-xs)]">
                          <div className="mb-3 flex items-center justify-between gap-3 text-sm font-semibold text-[var(--text)]"><span>原文</span><span className="rounded-full bg-[var(--primary-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--primary)]">Source</span></div>
                          <p className="max-h-80 overflow-y-auto whitespace-pre-wrap pr-1 text-sm leading-8 text-[var(--text-soft)]">{question.question_text}</p>
                        </section>
                        <section className="rounded-[var(--radius-md)] border border-[var(--primary)]/18 bg-[var(--card)]/92 p-4 shadow-[var(--shadow-xs)]">
                          <div className="mb-3 flex items-center justify-between gap-3 text-sm font-semibold text-[var(--text)]"><span>原文中文翻译</span><span className="rounded-full bg-[var(--primary-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--primary)]">中文</span></div>
                          <p className="max-h-80 overflow-y-auto whitespace-pre-wrap pr-1 text-sm leading-8 text-[var(--text-soft)]">{sourceTranslation || "暂无原文翻译"}</p>
                        </section>
                      </div>

                      <div className="space-y-4">
                        <section className="rounded-[var(--radius-md)] border border-[var(--primary)]/18 bg-[var(--card)]/92 p-4 shadow-[var(--shadow-xs)]">
                          <div className="mb-3 flex items-center justify-between gap-3 text-sm font-semibold text-[var(--text)]"><span>75词内一句话答案</span><span className="rounded-full bg-[var(--primary-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--primary)]">{question.answer.word_count ?? 0} words</span></div>
                          <p className="text-sm font-semibold leading-8 text-[var(--text)]">{question.answer.answer_text}</p>
                          <div className="mt-4 rounded-[var(--radius-sm)] border border-[var(--primary)]/15 bg-[var(--primary-soft)]/45 px-3 py-3 text-sm leading-7 text-[var(--text-soft)]">{question.answer.chinese_explanation || "暂无答案翻译"}</div>
                        </section>
                        <section className="rounded-[var(--radius-md)] border border-[var(--primary)]/18 bg-[var(--card)]/92 p-4 shadow-[var(--shadow-xs)]">
                          <div className="mb-3 flex items-center justify-between gap-3 text-sm font-semibold text-[var(--text)]"><span>句子合并拆解</span><span className="rounded-full bg-[var(--primary-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--primary)]">{learningComponents.length} components</span></div>
                          <div className="space-y-3">
                            {learningComponents.map((component, componentIndex) => <div key={component.id} className="rounded-[var(--radius-sm)] border border-transparent bg-[var(--bg-soft)]/70 px-3 py-3 transition hover:border-[var(--primary)]/20 hover:bg-[var(--primary-soft)]/25"><div className="mb-2 flex flex-wrap items-center gap-2"><Badge variant="secondary">{componentIndex + 1}</Badge><Badge variant="outline">{component.component_role || "component"}</Badge><Badge>{component.grammar_pattern || "grammar"}</Badge></div><p className="text-sm font-semibold leading-7 text-[var(--text)]">{component.component_text}</p><p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">{component.chinese_explanation || "暂无中文说明"}</p>{component.source_idea ? <p className="mt-2 rounded-[var(--radius-sm)] bg-[var(--card)] px-3 py-2 text-xs leading-6 text-[var(--text-faint)]">Source idea: {component.source_idea}</p> : null}</div>)}
                          </div>
                        </section>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--primary)]/30 bg-[var(--primary-soft)]/35 p-5 text-sm leading-7 text-[var(--text-soft)]">这道题还没有 SWT 范文。点击上方“自动补齐 5 道”后会自动生成并保存。</div>
                  )}
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
