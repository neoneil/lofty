"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import AiUsageConfirmDialog from "@/components/ai/ai-usage-confirm-dialog";
import AiSubmitButton from "@/components/ai/ai-submit-button";
import DictionaryText from "@/components/dictionary/dictionary-text";
import { Badge } from "@/components/ui-v2/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui-v2/card";
import { Textarea } from "@/components/ui-v2/textarea";
import Tag from "@/components/ui/tag";
import type { EssayAnswerRow, EssaySentenceRow } from "./page";

type Props = {
  question: {
    id: string;

    question_text: string;

    answer: string;
  };

  attempts: {
    id: string;

    score: number;

    user_answer: string;

    ai_feedback: SubmitResult["aiFeedback"] | null;

    submitted_at: string;
  }[];

  essayAnswers: EssayAnswerRow[];

  essaySentences: EssaySentenceRow[];
};

type SubmitResult = {
  score: number;

  aiFeedback: {
    overallScore: number;

    rubric: {
      content: number;

      form: number;

      grammar: number;

      vocabulary: number;

      spelling: number;

      writtenDiscourse: number;
    };

    overallFeedback: string;

    strengths: string[];

    weaknesses: {
      category: string;

      issue: string;

      example: string;

      suggestion: string;
    }[];

    grammarCorrections: {
      original: string;

      corrected: string;

      explanation: string;
    }[];

    improvedAnswer: string;
  };
};

type FeedbackWeakness = SubmitResult["aiFeedback"]["weaknesses"][number];

function subscribeQuestionOrder(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getQuestionOrderSnapshot() {
  return sessionStorage.getItem("we-question-order") ?? "[]";
}

function getServerQuestionOrderSnapshot() {
  return "[]";
}

function splitEssayIntoParagraphs(text: string) {
  const normalizedText = text.replace(/\\n/g, "\n").replace(/\r\n/g, "\n");

  const paragraphs = normalizedText
    .split(/\n\s*\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length > 1) {
    return paragraphs;
  }

  const singleLineParagraphs = normalizedText
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (singleLineParagraphs.length > 1) {
    return singleLineParagraphs;
  }

  return paragraphs;
}

function orderSentencesByEssayText(
  answerText: string,
  sentences: EssaySentenceRow[],
) {
  return [...sentences].sort((first, second) => {
    const firstIndex = answerText.indexOf(first.sentence_text);
    const secondIndex = answerText.indexOf(second.sentence_text);

    if (firstIndex === -1 && secondIndex === -1) {
      return 0;
    }

    if (firstIndex === -1) {
      return 1;
    }

    if (secondIndex === -1) {
      return -1;
    }

    return firstIndex - secondIndex;
  });
}

function groupSentencesByParagraph(
  answerText: string,
  sentences: EssaySentenceRow[],
) {
  const paragraphs = splitEssayIntoParagraphs(answerText);

  if (paragraphs.length === 0) {
    return [];
  }

  const usedSentenceIds = new Set<string>();

  return paragraphs.map((paragraph, index) => {
    const paragraphSentences = sentences.filter((sentence) => {
      if (usedSentenceIds.has(sentence.id)) {
        return false;
      }

      const isInParagraph = paragraph.includes(sentence.sentence_text);

      if (isInParagraph) {
        usedSentenceIds.add(sentence.id);
      }

      return isInParagraph;
    });

    if (index === paragraphs.length - 1) {
      const remainingSentences = sentences.filter(
        (sentence) => !usedSentenceIds.has(sentence.id),
      );

      return {
        paragraph,
        sentences: [...paragraphSentences, ...remainingSentences],
      };
    }

    return {
      paragraph,
      sentences: paragraphSentences,
    };
  });
}

function EssayAnswerSentenceMeta({
  sentence,
}: {
  sentence: EssaySentenceRow;
}) {
  const tags = [
    ["tag1", sentence.tag1],
    ["tag2", sentence.tag2],
    ["type", sentence.sentence_type],
    ["position", sentence.position_type],
    ["pattern", sentence.argument_pattern],
    ["peel", sentence.peel_role],
    ["source", sentence.source_type],
  ].filter((item): item is [string, string] => Boolean(item[1]));

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-soft)]">
          句子解析
        </div>
        <p className="text-sm leading-7 text-[var(--text-soft)]">
          {sentence.chinese_explanation || "暂无解析"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map(([label, value]) => (
          <Badge key={`${label}-${value}`} variant="secondary">
            {label}: {value}
          </Badge>
        ))}

        {typeof sentence.difficulty_level === "number" ? (
          <Badge variant="outline">难度 {sentence.difficulty_level}</Badge>
        ) : null}

        {sentence.is_featured ? <Badge variant="default">精选句</Badge> : null}
      </div>
    </div>
  );
}

function EssayAnswerLibrary({
  answers,
  sentences,
}: {
  answers: EssayAnswerRow[];
  sentences: EssaySentenceRow[];
}) {
  const [expandedAnswerIds, setExpandedAnswerIds] = useState<string[]>([]);
  const [selectedSentenceIds, setSelectedSentenceIds] = useState<
    Record<string, string | null>
  >({});

  function toggleAnswer(answerId: string) {
    setExpandedAnswerIds((current) =>
      current.includes(answerId)
        ? current.filter((id) => id !== answerId)
        : [...current, answerId],
    );
  }

  function selectSentence(answerId: string, sentenceId: string) {
    setSelectedSentenceIds((current) => ({
      ...current,
      [answerId]: current[answerId] === sentenceId ? null : sentenceId,
    }));
  }

  return (
    <Card>
      <CardHeader className="gap-3 border-b border-[var(--border)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg">高分答案库</CardTitle>
          <p className="mt-1 text-sm text-[var(--text-soft)]">
            这道题的范文答案与句子拆解，点击文章后可展开逐句解析。
          </p>
        </div>
        <Badge variant="default">{answers.length} 篇答案</Badge>
      </CardHeader>

      <CardContent className="space-y-3 p-4 sm:p-5">
        {answers.length === 0 ? (
          <div className="rounded-[var(--radius-sm)] border border-dashed border-[var(--border)] bg-[var(--bg-soft)] p-5 text-sm leading-7 text-[var(--text-soft)]">
            这道题目前还没有录入高分答案。保存到{" "}
            <span className="font-semibold text-[var(--text)]">
              pte.essay_answer
            </span>{" "}
            和{" "}
            <span className="font-semibold text-[var(--text)]">
              pte.essay_sentence
            </span>{" "}
            后，会在这里显示答案文章和逐句解析。
          </div>
        ) : null}

        {answers.map((answer, index) => {
          const isExpanded = expandedAnswerIds.includes(answer.id);
          const answerSentences = orderSentencesByEssayText(
            answer.answer_text,
            sentences.filter((sentence) => sentence.essay_answer_id === answer.id),
          );
          const answerParagraphs = groupSentencesByParagraph(
            answer.answer_text,
            answerSentences,
          );
          const selectedSentenceId = selectedSentenceIds[answer.id] ?? null;
          const selectedSentence = answerSentences.find(
            (sentence) => sentence.id === selectedSentenceId,
          );

          return (
            <article
              key={answer.id}
              className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] transition hover:border-[var(--border-strong)]"
            >
              <button
                type="button"
                onClick={() => toggleAnswer(answer.id)}
                className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">Answer {index + 1}</Badge>
                    <Badge variant="outline">
                      Target {answer.score_target ?? 90}
                    </Badge>
                    <Badge variant={isExpanded ? "default" : "secondary"}>
                      {isExpanded ? "已展开" : "默认关闭"}
                    </Badge>
                  </div>

                  {answer.thesis ? (
                    <p className="mt-3 line-clamp-2 text-sm font-medium leading-6 text-[var(--text)]">
                      {answer.thesis}
                    </p>
                  ) : (
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--text-soft)]">
                      {answer.answer_text}
                    </p>
                  )}
                </div>

                <span className="shrink-0 text-xs font-semibold text-[var(--primary)]">
                  {isExpanded ? "收起" : "展开"}
                </span>
              </button>

              {isExpanded ? (
                <div className="border-t border-[var(--border)] px-4 py-4">
                  <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-[var(--text)]">
                        完整范文
                      </div>
                      <Badge variant="secondary">
                        {answerSentences.length} 个句子
                      </Badge>
                    </div>

                    <div className="space-y-8">
                      {answerParagraphs.length > 0
                        ? answerParagraphs.map((paragraph, paragraphIndex) => (
                            <div
                              key={`${paragraphIndex}-${paragraph.paragraph.slice(0, 24)}`}
                              className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] p-4"
                            >
                              <Badge variant="secondary">
                                Paragraph {paragraphIndex + 1}
                              </Badge>

                              <p className="mt-3 text-[15px] leading-8 text-[var(--text)]">
                                {paragraph.sentences.length > 0
                                  ? paragraph.sentences.map((sentence) => {
                                      const selected =
                                        selectedSentenceId === sentence.id;

                                      return (
                                        <button
                                          key={sentence.id}
                                          type="button"
                                          onClick={() =>
                                            selectSentence(answer.id, sentence.id)
                                          }
                                          className={`mx-0.5 rounded px-1 text-left align-baseline transition hover:bg-[var(--primary-soft)] hover:text-[var(--primary)] ${
                                            selected
                                              ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                                              : "text-[var(--text)]"
                                          }`}
                                        >
                                          {sentence.sentence_text}
                                        </button>
                                      );
                                    })
                                  : paragraph.paragraph}
                              </p>
                            </div>
                          ))
                        : answer.answer_text}
                    </div>
                  </div>

                  {selectedSentence ? (
                    <div className="mt-4 rounded-[var(--radius-sm)] border border-[var(--primary)]/30 bg-[var(--primary-soft)] p-4">
                      <div className="mb-2 text-sm font-semibold text-[var(--text)]">
                        当前句子
                      </div>
                      <p className="mb-4 text-sm leading-7 text-[var(--text)]">
                        {selectedSentence.sentence_text}
                      </p>
                      <EssayAnswerSentenceMeta sentence={selectedSentence} />
                    </div>
                  ) : (
                    <div className="mt-4 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] p-4 text-sm leading-7 text-[var(--text-soft)]">
                      点击范文中的任意句子查看标签、句型、PEEL 角色和中文解析。
                    </div>
                  )}
                </div>
              ) : null}
            </article>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default function EssayDetailClient({
  question,
  attempts,
  essayAnswers,
  essaySentences,
}: Props) {
  const [startedAt] = useState(() => Date.now());

  const [answer, setAnswer] = useState("");

  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState<SubmitResult | null>(null);

  const [expandedAttempts, setExpandedAttempts] = useState<string[]>([]);

  const router = useRouter();

  const questionOrderSnapshot = useSyncExternalStore(
    subscribeQuestionOrder,
    getQuestionOrderSnapshot,
    getServerQuestionOrderSnapshot,
  );

  const questionNav = useMemo(() => {
    let ids: string[] = [];

    try {
      ids = JSON.parse(questionOrderSnapshot);
    } catch {
      ids = [];
    }

    const currentIndex = ids.findIndex((qId) => qId === question.id);

    if (currentIndex === -1) {
      return {
        prevQuestionId: null,
        nextQuestionId: null,
        questionNumber: 0,
      };
    }

    return {
      prevQuestionId: currentIndex > 0 ? ids[currentIndex - 1] : null,
      nextQuestionId:
        currentIndex < ids.length - 1 ? ids[currentIndex + 1] : null,
      questionNumber: currentIndex + 1,
    };
  }, [question.id, questionOrderSnapshot]);

  const { prevQuestionId, nextQuestionId, questionNumber } = questionNav;

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/pte/essay/submit", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          questionId: question.id,

          userAnswer: answer,

          startedAt,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message ?? "提交失败");
      }

      setResult({
        score: data.score ?? 0,

        aiFeedback: data.aiFeedback,
      });

      router.refresh();
    } catch (error) {
      console.error(error);

      alert(error instanceof Error ? error.message : "提交失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 space-y-6">
      {/* artical */}

      <div
        className="
                    round
                    bg-[var(--bg-soft)]
                    px-5 py-5
                "
      >
        <div className="mb-4 flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Tag tone="theme">Essay</Tag>

            {questionNumber ? <Tag tone="green">第 {questionNumber} 题</Tag> : null}
          </div>
        </div>
        <div className="rounded border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="mb-2 text-sm font-semibold text-[var(--text)]">
            阅读原文
          </div>

          <div
            className="
        whitespace-pre-wrap
        text-sm
        leading-7
        transition"
          >
            <DictionaryText
              text={question.question_text.replace(/\n/g, "\n\n")}
            />
          </div>
        </div>
      </div>
      {/* RESULT */}

      {result ? (
        <section
          className="
                        round
                        border border-[var(--border)]
                        bg-[var(--bg-soft)]
                        p-6
                        shadow-sm
                        space-y-6
                    "
        >
          {/* TOP */}

          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`
                                rounded
                                px-4 py-1.5
                                text-sm font-semibold

                                ${
                                  result.score >= 65
                                    ? "bg-[var(--success-soft)] text-[var(--success)]"
                                    : "bg-[var(--danger-soft)] text-[var(--danger)]"
                                }
                            `}
            >
              {result.score >= 65 ? "Good" : "Needs Improvement"}
            </span>

            <span
              className="
                                rounded
                                border border-[var(--border)]
                                bg-[var(--card)]
                                px-4 py-1.5
                                text-sm font-semibold
                                text-[var(--text-soft)]
                            "
            >
              Score: {result.score} / 90
            </span>
          </div>

          {/* OVERALL FEEDBACK */}

          <div>
            <div
              className="
                                mb-3
                                text-sm
                                font-semibold
                                uppercase
                                tracking-[0.16em]
                                text-[var(--text-soft)]
                            "
            >
              AI Feedback
            </div>

            <div
              className="
                                rounded
                                border border-[var(--border)]
                                bg-[var(--card)]
                                p-5
                                text-[15px]
                                leading-8
                                text-[var(--text-soft)]
                            "
            >
              {result.aiFeedback.overallFeedback}
            </div>
          </div>

          {/* STRENGTHS */}

          <div>
            <div
              className="
                                mb-3
                                text-sm
                                font-semibold
                                uppercase
                                tracking-[0.16em]
                                text-[var(--text-soft)]
                            "
            >
              Strengths
            </div>

            <div className="flex flex-wrap gap-2">
              {result.aiFeedback.strengths.map((item, index) => (
                <span
                  key={index}
                  className="
                                            rounded
                                            bg-[var(--success-soft)]
                                            px-3 py-2
                                            text-sm
                                            font-medium
                                            text-[var(--success)]
                                        "
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* WEAKNESSES */}

          <div>
            <div
              className="
                                mb-3
                                text-sm
                                font-semibold
                                uppercase
                                tracking-[0.16em]
                                text-[var(--text-soft)]
                            "
            >
              Weaknesses
            </div>

            <div className="space-y-4">
              {result.aiFeedback.weaknesses.map((item, index) => (
                <div
                  key={index}
                  className="
                                            rounded
                                            border border-[color:var(--danger)]/30
                                            bg-[var(--danger-soft)]
                                            p-5
                                            space-y-3
                                        "
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="
                                                    rounded
                                                    bg-[color:var(--danger)]/25
                                                    px-2 py-1
                                                    text-xs
                                                    font-semibold
                                                    text-[var(--danger)]
                                                "
                    >
                      {item.category}
                    </span>
                  </div>

                  <div>
                    <div className="mb-1 text-sm font-semibold text-[var(--text)]">
                      问题
                    </div>

                    <div className="text-sm leading-7 text-[var(--text-soft)]">
                      {item.issue}
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 text-sm font-semibold text-[var(--text)]">
                      原文关键内容
                    </div>

                    <div className="text-sm leading-7 text-[var(--text-soft)]">
                      {item.example}
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 text-sm font-semibold text-[var(--text)]">
                      改进建议
                    </div>

                    <div className="text-sm leading-7 text-[var(--text-soft)]">
                      {item.suggestion}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GRAMMAR CORRECTIONS */}

          {result.aiFeedback.grammarCorrections.length > 0 && (
            <div>
              <div
                className="
                                    mb-3
                                    text-sm
                                    font-semibold
                                    uppercase
                                    tracking-[0.16em]
                                    text-[var(--text-soft)]
                                "
              >
                Grammar Corrections
              </div>

              <div className="space-y-4">
                {result.aiFeedback.grammarCorrections.map((item, index) => (
                  <div
                    key={index}
                    className="
                                                rounded
                                                border border-[color:var(--warning)]/30
                                                bg-[var(--warning-soft)]
                                                p-5
                                                space-y-3
                                            "
                  >
                    <div>
                      <div className="mb-1 text-sm font-semibold text-[var(--text)]">
                        原句
                      </div>

                      <div className="text-sm leading-7 text-[var(--danger)]">
                        {item.original}
                      </div>
                    </div>

                    <div>
                      <div className="mb-1 text-sm font-semibold text-[var(--text)]">
                        正确版本
                      </div>

                      <div className="text-sm leading-7 text-[var(--success)]">
                        {item.corrected}
                      </div>
                    </div>

                    <div>
                      <div className="mb-1 text-sm font-semibold text-[var(--text)]">
                        解释
                      </div>

                      <div className="text-sm leading-7 text-[var(--text-soft)]">
                        {item.explanation}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* IMPROVED ANSWER */}

          <div>
            <div
              className="
                                mb-3
                                text-sm
                                font-semibold
                                uppercase
                                tracking-[0.16em]
                                text-[var(--text-soft)]
                            "
            >
              Improved Answer
            </div>

            <div
              className="
                                rounded
                                border border-[color:var(--primary)]/30
                                bg-[var(--primary-soft)]
                                p-5
                                text-[15px]
                                leading-8
                                text-[var(--text)]
                            "
            >
              {result.aiFeedback.improvedAnswer}
            </div>
          </div>
        </section>
      ) : null}

      {/* INPUT */}

      <div>
        <label className="mb-2 ml-1 block text-sm font-semibold text-[var(--muted)]">
          输入答案
        </label>

        <Textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="在 20 分钟内 写一篇200词 - 300词的文章"
          className="min-h-[180px] px-5 py-4 text-[17px] leading-8 shadow-sm"
        />
      </div>

      {/* SUBMIT */}

      <div className="flex justify-end">
        <AiUsageConfirmDialog feature="pte_essay" onConfirm={handleSubmit}>
          {(openDialog) => (
            <AiSubmitButton loading={loading} disabled={loading || !!result} completed={!!result} onClick={openDialog} />
          )}
        </AiUsageConfirmDialog>
      </div>

      {/* NAVIGATION */}

      <div
        className="
                    mt-8
                    flex items-center
                    justify-between
                "
      >
        {prevQuestionId ? (
          <Link
            href={`/pte/writing/essay/${prevQuestionId}`}
            className="
                            inline-flex
                            items-center
                            gap-2
                            rounded
                            border border-[var(--border)]
                            bg-[var(--card)]
                            px-3 py-3
                            text-sm font-semibold
                            text-[var(--text-soft)]
                            transition
                            hover:border-[var(--theme)]/30
                            hover:text-[var(--theme)]
                        "
          >
            <div className="h-5 w-5 text-[var(--primary)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M14.7 5.3a1 1 0 0 1 0 1.4L10.41 11H20a1 1 0 1 1 0 2h-9.59l4.3 4.3a1 1 0 0 1-1.42 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.41 0z" />
              </svg>
            </div>

            <span>上一题</span>
          </Link>
        ) : (
          <div />
        )}

        {nextQuestionId ? (
          <Link
            href={`/pte/writing/essay/${nextQuestionId}`}
            className="
                            inline-flex
                            items-center
                            gap-2
                            rounded
                            bg-[var(--theme)]
                            px-3 py-3
                            text-sm font-semibold
                            text-white
                            transition
                            hover:opacity-90
                        "
          >
            <span>下一题</span>

            <div className="h-5 w-5 text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M9.3 18.7a1 1 0 0 1 0-1.4L13.59 13H4a1 1 0 1 1 0-2h9.59L9.3 6.7a1 1 0 1 1 1.42-1.4l6 6a1 1 0 0 1 0 1.4l-6 6a1 1 0 0 1-1.41 0z" />
              </svg>
            </div>
          </Link>
        ) : null}
      </div>

      {question.answer ? (
        <div
          className="
            mt-8
            rounded-2xl
            border border-[color:var(--success)]/30
            bg-[var(--success-soft)]
            p-5
        "
        >
          <div
            className="
                mb-3
                text-sm
                font-semibold
                uppercase
                tracking-wider
                text-[var(--success)]
            "
          >
            参考答案
          </div>

          <div
            className="
                whitespace-pre-wrap
                text-[15px]
                leading-8
                text-[var(--text)]
            "
          >
            <DictionaryText text={question.answer} />
          </div>
        </div>
      ) : null}

      <EssayAnswerLibrary answers={essayAnswers} sentences={essaySentences} />

      {/* ATTEMPT HISTORY */}

      <div
        className="
        rounded
        border border-[var(--border)]
        bg-[var(--card)]
        p-6
        shadow-sm"
      >
        <div className=" mb-4 text-lg font-semibold text-[var(--text)]">
          历史记录
        </div>

        <div className="space-y-4">
          {attempts.map((attempt, index) => (
            <div
              key={attempt.id}
              className="
                    rounded
                    border border-[var(--border)]
                    bg-[var(--bg-soft)]
                    p-4
                "
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-sm font-semibold text-[var(--text)]">
                    Attempt {attempts.length - index}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setExpandedAttempts((prev) => {
                        if (prev.includes(attempt.id)) {
                          return prev.filter((id) => id !== attempt.id);
                        }

                        return [...prev, attempt.id];
                      });
                    }}
                    className="btn-soft cursor-pointer"
                  >
                    {expandedAttempts.includes(attempt.id)
                      ? "收起 AI Feedback"
                      : "展开 AI Feedback"}
                  </button>
                </div>

                <div
                  className="
            rounded
            bg-[var(--theme)]
            px-3 py-1
            text-sm
            font-semibold
            text-white
        "
                >
                  {attempt.score ?? 0} / 90
                </div>
              </div>

              <div className="mt-2 text-xs text-[var(--text-soft)]">
                {new Date(attempt.submitted_at).toLocaleString()}
              </div>

              <div
                className="
                        mt-4
                        rounded
                        border border-[var(--border)]
                        bg-[var(--card)]
                        p-4
                    "
              >
                <div className="mb-2 text-sm font-semibold text-[var(--text)]">
                  你的答案
                </div>

                <div
                  className="
                            whitespace-pre-wrap
                            text-sm
                            leading-7
                            text-[var(--text-soft)]
                        "
                >
                  {attempt.user_answer}
                </div>

                {/* AI FEEDBACK */}

                {attempt.ai_feedback &&
                  expandedAttempts.includes(attempt.id) && (
                    <div className="mt-4 space-y-4">
                      {/* OVERALL */}

                      <div
                        className="
                rounded
                border border-[color:var(--primary)]/30
                bg-[var(--primary-soft)]
                p-4
            "
                      >
                        <div className="mb-2 text-sm font-semibold text-[var(--text)]">
                          AI 总评
                        </div>

                        <div
                          className="
                    text-sm
                    leading-7
                    text-[var(--text-soft)]
                "
                        >
                          {attempt.ai_feedback.overallFeedback}
                        </div>
                      </div>

                      {/* IMPROVED ANSWER */}

                      <div
                        className="
                rounded
                border border-[color:var(--success)]/30
                bg-[var(--success-soft)]
                p-4
            "
                      >
                        <div className="mb-2 text-sm font-semibold text-[var(--text)]">
                          AI 改进版答案
                        </div>

                        <div
                          className="
                    text-sm
                    leading-7
                    text-[var(--text-soft)]
                "
                        >
                          {attempt.ai_feedback.improvedAnswer}
                        </div>
                      </div>

                      {/* WEAKNESSES */}

                      {attempt.ai_feedback.weaknesses?.length > 0 && (
                        <div className="space-y-3">
                          {attempt.ai_feedback.weaknesses.map(
                            (
                              weakness: FeedbackWeakness,
                              weaknessIndex: number,
                            ) => (
                              <div
                                key={weaknessIndex}
                                className="
                                    rounded
                                    border border-[color:var(--danger)]/30
                                    bg-[var(--danger-soft)]
                                    p-4
                                "
                              >
                                <div className="mb-2">
                                  <span
                                    className="
                                            rounded
                                            bg-[color:var(--danger)]/25
                                            px-2 py-1
                                            text-xs
                                            font-semibold
                                            text-[var(--danger)]
                                        "
                                  >
                                    {weakness.category}
                                  </span>
                                </div>

                                <div className="space-y-2 text-sm leading-7 text-[var(--text-soft)]">
                                  <div>
                                    <span className="font-semibold text-[var(--text)]">
                                      问题：
                                    </span>{" "}
                                    {weakness.issue}
                                  </div>

                                  <div>
                                    <span className="font-semibold text-[var(--text)]">
                                      原文关键内容：
                                    </span>{" "}
                                    {weakness.example}
                                  </div>

                                  <div>
                                    <span className="font-semibold text-[var(--text)]">
                                      改进建议：
                                    </span>{" "}
                                    {weakness.suggestion}
                                  </div>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
