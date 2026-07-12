"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, FileText, Loader2, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui-v2/card";

export type PteEssaySampleQuestion = {
  id: string;
  question_text: string;
  created_at: string;
  answer: PteEssaySampleAnswer | null;
  sentences: PteEssaySampleSentence[];
};

export type PteEssaySampleAnswer = {
  id: string;
  we_id: string;
  thesis: string | null;
  answer_text: string;
  score_target: number | null;
  created_at: string;
};

export type PteEssaySampleSentence = {
  id: string;
  we_id: string;
  essay_answer_id: string;
  sentence_text: string;
  chinese_explanation: string | null;
  tag1: string | null;
  tag2: string | null;
  sentence_type: string | null;
  source_type: string | null;
  position_type: string | null;
  argument_pattern: string | null;
  peel_role: string | null;
  difficulty_level: number | null;
  is_featured: boolean | null;
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
        question_text: string;
        created_at: string;
      };
      answer: PteEssaySampleAnswer;
      sentences: PteEssaySampleSentence[];
      message: string;
    }
  | {
      ok: false;
      message: string;
    };

function splitParagraphs(text: string) {
  return text.replace(/\\n/g, "\n").split(/\n\s*\n+/).map((paragraph) => paragraph.trim()).filter(Boolean);
}

function orderSentences(answerText: string, sentences: PteEssaySampleSentence[]) {
  return [...sentences].sort((first, second) => {
    const firstIndex = answerText.indexOf(first.sentence_text);
    const secondIndex = answerText.indexOf(second.sentence_text);
    if (firstIndex === -1 && secondIndex === -1) return 0;
    if (firstIndex === -1) return 1;
    if (secondIndex === -1) return -1;
    return firstIndex - secondIndex;
  });
}

function sentenceTranslationMap(sentences: PteEssaySampleSentence[]) {
  return new Map(sentences.map((sentence) => [sentence.sentence_text, sentence.chinese_explanation || ""]));
}

function normalizeEssaySelectionText(value: string) {
  return value.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/\s+/g, " ").trim().toLowerCase();
}

function sentenceParagraphSegments(paragraph: string, sentences: PteEssaySampleSentence[]) {
  const segments: Array<{ type: "text"; text: string } | { type: "sentence"; sentence: PteEssaySampleSentence }> = [];
  let cursor = 0;

  sentences.forEach((sentence) => {
    const index = paragraph.indexOf(sentence.sentence_text, cursor);
    if (index === -1) return;
    if (index > cursor) segments.push({ type: "text", text: paragraph.slice(cursor, index) });
    segments.push({ type: "sentence", sentence });
    cursor = index + sentence.sentence_text.length;
  });

  if (cursor < paragraph.length) segments.push({ type: "text", text: paragraph.slice(cursor) });
  return segments.length > 0 ? segments : [{ type: "text" as const, text: paragraph }];
}

export function PteEssaySampleBrowser({ initialQuestions }: { initialQuestions: PteEssaySampleQuestion[] }) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [activeSentenceId, setActiveSentenceId] = useState<string | null>(null);
  const activeTranslationRef = useRef<HTMLDivElement | null>(null);
  const stopRequestedRef = useRef(false);

  const completedCount = questions.filter((question) => question.answer).length;
  const missingCount = questions.length - completedCount;

  const sortedQuestions = useMemo(() => [...questions].sort((first, second) => Number(Boolean(second.answer)) - Number(Boolean(first.answer))), [questions]);

  useEffect(() => {
    if (!activeSentenceId) return;
    activeTranslationRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeSentenceId]);

  function mergeGenerated(result: Extract<GenerateNextResponse, { done: false }>) {
    setQuestions((current) => current.map((question) => question.id === result.question.id ? { ...question, answer: result.answer, sentences: result.sentences } : question));
  }

  async function generateMissing() {
    const missingQuestions = questions.filter((question) => !question.answer);
    if (missingQuestions.length === 0) {
      window.alert("所有 PTE 大作文题目都已经有答案。");
      return;
    }

    const previewList = missingQuestions.slice(0, 8).map((question, index) => `${index + 1}. ${question.question_text.slice(0, 90)}${question.question_text.length > 90 ? "..." : ""}`).join("\n");
    const extraCount = missingQuestions.length > 8 ? `\n另外还有 ${missingQuestions.length - 8} 道未显示。` : "";
    if (!window.confirm(`师傅，发现 ${missingQuestions.length} 道 PTE 大作文还没有答案。\n\n${previewList}${extraCount}\n\n是否生成答案？`)) return;

    setIsGenerating(true);
    stopRequestedRef.current = false;
    setStatus("正在准备生成... 每道题会单独生成和保存，通常需要 20-60 秒。");

    try {
      let generated = 0;
      let remaining = missingQuestions.length;
      while (true) {
        if (stopRequestedRef.current) {
          setStatus(`已手动停止。本次已生成 ${generated} 道，剩余题目可之后继续补齐。`);
          break;
        }

        setStatus(`正在生成第 ${generated + 1} 道缺失题，预计剩余 ${remaining} 道...`);
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 150000);
        const response = await fetch("/api/admin/pte-essay-samples/generate-next", { method: "POST", signal: controller.signal });
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
        setStatus(`已生成并保存 ${generated} 道：${result.question.question_text.slice(0, 72)}${result.question.question_text.length > 72 ? "..." : ""}`);
      }
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

  function activateSentenceFromSelection(event: React.SyntheticEvent<HTMLElement>, sentences: PteEssaySampleSentence[]) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
    const container = event.currentTarget;
    if (!selection.anchorNode || !selection.focusNode || !container.contains(selection.anchorNode) || !container.contains(selection.focusNode)) return;

    const selectedText = normalizeEssaySelectionText(selection.toString());
    if (selectedText.length < 6) return;

    const match = sentences.find((sentence) => {
      const sentenceText = normalizeEssaySelectionText(sentence.sentence_text);
      return sentenceText.includes(selectedText) || selectedText.includes(sentenceText);
    });

    if (match) setActiveSentenceId(match.id);
  }

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden rounded-[var(--radius-lg)] border-[var(--primary)]/18 bg-[linear-gradient(135deg,var(--card),var(--primary-soft))] shadow-[var(--shadow-sm)]">
        <CardHeader className="flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <Badge>PTE Essay Library</Badge>
            <CardTitle className="mt-3 text-2xl">PTE 大作文范文</CardTitle>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">集中查看活跃 WE 题目的高分范文与逐句中文翻译。缺失题目可由管理员自动生成并写入现有数据库。</p>
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
          const answer = question.answer;
          const orderedSentences = answer ? orderSentences(answer.answer_text, question.sentences) : [];
          const translations = sentenceTranslationMap(orderedSentences);
          const paragraphs = answer ? splitParagraphs(answer.answer_text) : [];

          return (
            <Card key={question.id} className={`overflow-hidden rounded-[var(--radius-lg)] transition-all duration-300 ${expanded ? "border-[var(--primary)]/30 shadow-[var(--shadow-md)]" : "border-[var(--border)] shadow-[var(--shadow-xs)] hover:border-[var(--primary)]/25 hover:shadow-[var(--shadow-sm)]"}`}>
              <button type="button" onClick={() => toggleExpanded(question.id)} className={`flex w-full flex-col gap-4 p-5 text-left transition sm:flex-row sm:items-start sm:justify-between ${expanded ? "bg-[linear-gradient(135deg,var(--primary-soft),var(--card))]" : "hover:bg-[var(--primary-soft)]/35"}`}>
                <div className="min-w-0">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{index + 1}</Badge>
                    <Badge variant={answer ? "success" : "warning"}>{answer ? "已生成范文" : "待生成"}</Badge>
                    {answer ? <Badge variant="secondary">Target {answer.score_target ?? 90}</Badge> : null}
                  </div>
                  <p className="text-sm font-semibold leading-7 text-[var(--text)]">{question.question_text}</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[var(--primary)]">{answer ? <CheckCircle2 size={16} /> : <FileText size={16} />}{expanded ? "收起" : "查看范文"}</span>
              </button>

              {expanded ? (
                <div className="border-t border-[var(--primary)]/15 bg-[linear-gradient(180deg,var(--card),var(--bg-soft))] p-5">
                  {answer ? (
                    <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
                      <div className="flex h-[32rem] flex-col rounded-[var(--radius-md)] border border-[var(--primary)]/18 bg-[var(--card)]/92 p-4 shadow-[var(--shadow-xs)] sm:h-[36rem] xl:h-[42rem]">
                        <div className="mb-3 flex shrink-0 items-center justify-between gap-3 text-sm font-semibold text-[var(--text)]"><span>高分范文</span><span className="rounded-full bg-[var(--primary-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--primary)]">Essay</span></div>
                        {answer.thesis ? <p className="mb-4 rounded-[var(--radius-sm)] border border-[var(--primary)]/15 bg-[var(--primary-soft)]/50 px-3 py-2 text-sm leading-6 text-[var(--text-soft)]">Thesis: {answer.thesis}</p> : null}
                        <div onMouseUp={(event) => activateSentenceFromSelection(event, orderedSentences)} onTouchEnd={(event) => activateSentenceFromSelection(event, orderedSentences)} onKeyUp={(event) => activateSentenceFromSelection(event, orderedSentences)} className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
                          {paragraphs.map((paragraph, paragraphIndex) => (
                            <p key={`${question.id}-p-${paragraphIndex}`} className="whitespace-pre-wrap text-sm leading-8 text-[var(--text)]">
                              {sentenceParagraphSegments(paragraph, orderedSentences).map((segment, segmentIndex) => {
                                if (segment.type === "text") return <span key={`${question.id}-p-${paragraphIndex}-t-${segmentIndex}`}>{segment.text}</span>;
                                const active = activeSentenceId === segment.sentence.id;
                                return <span key={segment.sentence.id} role="button" tabIndex={0} onClick={() => setActiveSentenceId(segment.sentence.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setActiveSentenceId(segment.sentence.id); }} className={`cursor-text rounded-[var(--radius-xs)] px-0.5 transition-colors duration-200 ${active ? "bg-[var(--primary-soft)] text-[var(--primary)] ring-1 ring-[var(--primary)]/25" : "hover:bg-[var(--primary-soft)]/45"}`}>{segment.sentence.sentence_text}</span>;
                              })}
                            </p>
                          ))}
                        </div>
                      </div>

                      <div className="flex h-[32rem] flex-col rounded-[var(--radius-md)] border border-[var(--primary)]/18 bg-[var(--card)]/92 p-4 shadow-[var(--shadow-xs)] sm:h-[36rem] xl:h-[42rem]">
                        <div className="mb-3 flex shrink-0 items-center justify-between gap-3 text-sm font-semibold text-[var(--text)]"><span>逐句中文翻译</span><span className="rounded-full bg-[var(--primary-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--primary)]">Translation</span></div>
                        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                          {orderedSentences.map((sentence, sentenceIndex) => {
                            const active = activeSentenceId === sentence.id;
                            return <div key={sentence.id} ref={active ? activeTranslationRef : undefined} className={`rounded-[var(--radius-sm)] border px-3 py-3 transition-all duration-300 ${active ? "border-[var(--primary)]/35 bg-[var(--primary-soft)] shadow-[var(--shadow-sm)]" : "border-transparent bg-[var(--bg-soft)]/70 hover:border-[var(--primary)]/15 hover:bg-[var(--primary-soft)]/25"}`}><div className={`mb-1 text-xs font-semibold ${active ? "text-[var(--primary)]" : "text-[var(--text-faint)]"}`}>Sentence {sentenceIndex + 1}</div><p className="text-sm leading-7 text-[var(--text-soft)]">{translations.get(sentence.sentence_text) || "暂无翻译"}</p></div>;
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--primary)]/30 bg-[var(--primary-soft)]/35 p-5 text-sm leading-7 text-[var(--text-soft)]">这道题还没有范文。点击上方“自动补齐缺失”后会自动生成并保存。</div>
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
