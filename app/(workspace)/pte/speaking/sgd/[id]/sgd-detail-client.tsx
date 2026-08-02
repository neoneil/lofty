"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import AudioPlayer from "@/components/site/AudioPlayer";
import { normalizePublicStorageUrl } from "@/lib/storage/public-url";
import RecordingPanel from "@/components/site/RecordingPanel";
import Tag from "@/components/ui/tag";
import { Button } from "@/components/ui-v2/button";
import { SpeakingKeywordScoreCard, type SpeakingKeywordScoreResult } from "@/components/pte-speaking/keyword-score-card";
import { sanitizeRichHtml } from "@/lib/html/sanitize";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-v2/card";
import type { SgdQuestion } from "../page";

type UserRecording = {
  id: string;
  question_source?: string;
  question_type?: string;
  question_id: string;
  audio_url: string;
  duration_seconds: number | null;
  transcript: string | null;
  overall_score: number | null;
  content_score: number | null;
  fluency_score: number | null;
  pronunciation_score: number | null;
  feedback_json: { raw?: SpeakingKeywordScoreResult } | null;
  created_at: string | null;
};

type Props = {
  question: SgdQuestion;
};

function formatDateTime(value: string | null) {
  if (!value) return "";

  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getAudioUrl(question: SgdQuestion) {
  const path =
    question.audio_url || question.storage_path || question.source_audio_url;

  if (!path) return null;
  return normalizePublicStorageUrl(path, "pte-audio");
}

function getDisplayTitle(question: SgdQuestion) {
  return (
    question.title ||
    question.question_title ||
    question.question_text ||
    question.question_num ||
    "SGD Question"
  );
}

function subscribeQuestionOrder(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getQuestionOrderSnapshot() {
  return sessionStorage.getItem("sgd-question-order") ?? "[]";
}

function getServerQuestionOrderSnapshot() {
  return "[]";
}

function normalizeRichText(html: string) {
  const normalizedHtml = /<\/?[a-z][\s\S]*>/i.test(html)
    ? html
    : html.replace(/\n/g, "<br />");

  return sanitizeRichHtml(normalizedHtml);
}

export default function SgdDetailClient({ question }: Props) {
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
        questionNumber: 0,
        prevQuestionId: null as string | null,
        nextQuestionId: null as string | null,
      };
    }

    return {
      questionNumber: currentIndex + 1,
      prevQuestionId: currentIndex > 0 ? ids[currentIndex - 1] : null,
      nextQuestionId:
        currentIndex < ids.length - 1 ? ids[currentIndex + 1] : null,
    };
  }, [question.id, questionOrderSnapshot]);

  const [recordings, setRecordings] = useState<UserRecording[]>([]);
  const [recordingsLoading, setRecordingsLoading] = useState(true);
  const [audioFinished, setAudioFinished] = useState(!getAudioUrl(question));
  const [isOriginalTextOpen, setIsOriginalTextOpen] = useState(false);
  const [isAnswerOpen, setIsAnswerOpen] = useState(false);
  const [scoreResult, setScoreResult] = useState<SpeakingKeywordScoreResult | null>(null);

  const audioUrl = getAudioUrl(question);
  const originalText = question.original_text?.trim();
  const answerInfo = question.answer_info?.trim();
  const originalTextHtml = originalText ? normalizeRichText(originalText) : "";
  const answerInfoHtml = answerInfo ? normalizeRichText(answerInfo) : "";

  const loadRecordings = useCallback(async ({ showLoading = true }: { showLoading?: boolean } = {}) => {
    if (showLoading) setRecordingsLoading(true);
    try {
      const res = await fetch(`/api/pte/sgd/recordings?questionId=${question.id}`);
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message || "加载历史录音失败");
      setRecordings(json.recordings ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      if (showLoading) setRecordingsLoading(false);
    }
  }, [question.id]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadRecordings(), 0);
    return () => window.clearTimeout(timer);
  }, [loadRecordings]);

  return (
    <div className="mt-8 space-y-6">
      <div className="round bg-[var(--bg-soft)] px-5 py-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Tag tone="theme">SGD</Tag>
          {questionNav.questionNumber > 0 ? (
            <Tag tone="green">第 {questionNav.questionNumber} 题</Tag>
          ) : null}
          <Tag tone="yellow">{getDisplayTitle(question)}</Tag>
        </div>

        {question.question_text ? (
          <div className="text-[18px] leading-9 text-[var(--text)]">
            {question.question_text}
          </div>
        ) : null}

        {/* {questionInfo ? (
          <div className="mt-4 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] p-4 text-sm leading-7 text-[var(--text-soft)]">
            {questionInfo}
          </div>
        ) : null} */}
      </div>

      {audioUrl ? (
        <div className="mx-auto w-full max-w-[50%] max-lg:max-w-[72%] max-sm:max-w-full">
          <AudioPlayer
            url={audioUrl}
            autoPlay
            countdown={5}
            size="compact"
            onEnded={() => setAudioFinished(true)}
          />
        </div>
      ) : (
        <div className="mx-auto w-full max-w-[50%] rounded border border-dashed border-[var(--border-strong)] bg-[var(--bg-soft)] p-6 text-center text-sm text-[var(--text-soft)] max-lg:max-w-[72%] max-sm:max-w-full">
          当前题目暂无音频
        </div>
      )}

      <div className="mx-auto w-full max-w-[50%] space-y-6 max-lg:max-w-[72%] max-sm:max-w-full">
        {audioFinished ? (
          <RecordingPanel
            questionId={question.id}
            type="SGD"
            preparationDuration={10}
            maxDuration={120}
            autoStart
            uploadUrl="/api/pte/sgd/submit"
            uploadFormat="wav"
            aiUsageFeature="pte_sgd"
            onUploadSuccess={(_newRecording, response) => {
              const aiFeedback = response?.aiFeedback as SpeakingKeywordScoreResult | undefined;
              if (aiFeedback) setScoreResult(aiFeedback);
              void loadRecordings({ showLoading: false });
              router.refresh();
            }}
          />
        ) : null}

        {scoreResult ? <SpeakingKeywordScoreCard result={scoreResult} questionType="SGD" /> : null}

        {originalText ? (
          <Card>
            <CardHeader className="items-center py-4">
              <div>
                <CardTitle>音频原文</CardTitle>
                <CardDescription>默认隐藏，展开后查看原文内容</CardDescription>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="gap-1.5"
                onClick={() => setIsOriginalTextOpen((value) => !value)}
                aria-expanded={isOriginalTextOpen}
              >
                <span>{isOriginalTextOpen ? "收起" : "展开"}</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform ${
                    isOriginalTextOpen ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </CardHeader>
            {isOriginalTextOpen ? (
              <CardContent>
                <div
                  className="sgd-rich-text rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 text-sm leading-7 text-[var(--text)]"
                  dangerouslySetInnerHTML={{ __html: originalTextHtml }}
                />
              </CardContent>
            ) : null}
          </Card>
        ) : null}

        {answerInfo ? (
          <Card>
            <CardHeader className="items-center py-4">
              <div>
                <CardTitle>听力笔记</CardTitle>
                <CardDescription>默认隐藏，展开后查看参考内容</CardDescription>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="gap-1.5"
                onClick={() => setIsAnswerOpen((value) => !value)}
                aria-expanded={isAnswerOpen}
              >
                <span>{isAnswerOpen ? "收起" : "展开"}</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform ${
                    isAnswerOpen ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </CardHeader>
            {isAnswerOpen ? (
              <CardContent>
                <div
                  className="sgd-rich-text rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 text-sm leading-7 text-[var(--text)]"
                  dangerouslySetInnerHTML={{ __html: answerInfoHtml }}
                />
              </CardContent>
            ) : null}
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <div>
              <CardTitle>我的历史录音</CardTitle>
              <CardDescription>最近上传的 SGD 录音记录</CardDescription>
            </div>
            <span className="text-xs text-[var(--text-soft)]">
              {recordings.length} 条
            </span>
          </CardHeader>

          <CardContent>
            {recordingsLoading ? (
              <p className="text-sm text-[var(--text-soft)]">
                正在加载历史录音...
              </p>
            ) : recordings.length === 0 ? (
              <p className="text-sm text-[var(--text-soft)]">暂无历史录音</p>
            ) : (
              <div className="space-y-3">
                {recordings.map((recording, index) => (
                  <div
                    key={recording.id}
                    className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] p-3"
                  >
                    <div className="mb-2 text-xs text-[var(--text-soft)]">
                      Attempt {index + 1}
                      {recording.created_at
                        ? ` · ${formatDateTime(recording.created_at)}`
                        : ""}
                    </div>
                    {recording.overall_score !== null ? <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{[["总分", recording.overall_score], ["内容", recording.content_score], ["流利度", recording.fluency_score], ["发音", recording.pronunciation_score]].map(([label, value]) => <div key={label} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-2.5 py-2"><div className="text-[10px] font-semibold text-[var(--text-faint)]">{label}</div><div className="mt-0.5 text-sm font-bold text-[var(--primary)]">{value ?? "-"}</div></div>)}</div> : null}
                    <div className="mx-auto w-full max-w-[88%] max-sm:max-w-full">
                      <AudioPlayer url={recording.audio_url} size="compact" />
                    </div>
                    {recording.transcript ? <p className="mt-3 rounded-[var(--radius-sm)] bg-[var(--card)] px-3 py-2 text-xs leading-6 text-[var(--text-soft)]">{recording.transcript}</p> : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex items-center justify-between">
        {questionNav.prevQuestionId ? (
          <Link
            href={`/pte/speaking/sgd/${questionNav.prevQuestionId}`}
            className="inline-flex items-center gap-2 rounded border border-[var(--border)] bg-[var(--card)] px-3 py-3 text-sm font-semibold text-[var(--text-soft)] transition hover:border-[var(--theme)]/30 hover:text-[var(--theme)]"
          >
            <span>上一题</span>
          </Link>
        ) : (
          <div />
        )}

        {questionNav.nextQuestionId ? (
          <Link
            href={`/pte/speaking/sgd/${questionNav.nextQuestionId}`}
            className="inline-flex items-center gap-2 rounded bg-[var(--theme)] px-3 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <span>下一题</span>
          </Link>
        ) : null}
      </div>

      <style jsx global>{`
        .sgd-rich-text p {
          margin: 0;
        }

        .sgd-rich-text strong {
          color: var(--text);
          font-weight: 700;
        }

        .sgd-rich-text span {
          color: inherit !important;
          font-family: inherit !important;
          font-size: inherit !important;
        }

        .sgd-rich-text br {
          display: block;
          content: "";
          margin-top: 0.35rem;
        }
      `}</style>
    </div>
  );
}
