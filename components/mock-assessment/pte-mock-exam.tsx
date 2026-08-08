"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, LoaderCircle, ShieldCheck } from "lucide-react";

import { LocalRecordingPanel } from "@/components/mock-assessment/local-recording-panel";
import { MicrophoneCheck } from "@/components/mock-assessment/microphone-check";
import { PteMockListeningQuestion } from "@/components/mock-assessment/pte-mock-listening-question";
import { PteMockReadingQuestion } from "@/components/mock-assessment/pte-mock-reading-question";
import { PteMockSpeakingQuestion } from "@/components/mock-assessment/pte-mock-speaking-question";
import { PteMockWritingQuestion } from "@/components/mock-assessment/pte-mock-writing-question";
import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Card, CardContent } from "@/components/ui-v2/card";
import type { PteMockExamData, PteMockQuestion, PteMockQuestionResponse, PteMockSection } from "@/lib/mock-assessment/pte-mock-types";
import type { MockAttemptSummary } from "@/lib/mock-test/types";

const sectionOrder: PteMockSection[] = ["speaking", "writing", "reading", "listening"];
const sectionMeta: Record<PteMockSection, { label: string; english: string; description: string }> = {
  speaking: { label: "口语部分", english: "Speaking", description: "RA、RS、DI、RL、ASQ、SGD、RTS，每种题型随机 3 题。" },
  writing: { label: "写作部分", english: "Writing", description: "完成 1 道 SWT 和 1 道 Essay。" },
  reading: { label: "阅读部分", english: "Reading", description: "RO、下拉填空和拖拽填空，每种题型随机 2 题。" },
  listening: { label: "听力部分", english: "Listening", description: "完成 1 道 SST、3 道 HIW 和 3 道 WFD。" },
};

function getQuestionKey(question: PteMockQuestion) {
  return `${question.section}:${question.type}:${question.id}`;
}

function QuestionRenderer({ question, onResponseChange }: { question: PteMockQuestion; onResponseChange: (response: PteMockQuestionResponse) => void }) {
  if (question.section === "speaking") return <PteMockSpeakingQuestion question={question} onResponseChange={onResponseChange} />;
  if (question.section === "writing") return <PteMockWritingQuestion question={question} onResponseChange={onResponseChange} />;
  if (question.section === "reading") return <PteMockReadingQuestion question={question} onResponseChange={onResponseChange} />;
  return <PteMockListeningQuestion question={question} onResponseChange={onResponseChange} />;
}

function PteMockExam({ data, attempt, onExit }: { data: PteMockExamData; attempt: MockAttemptSummary; onExit: () => void }) {
  const initialSectionIndex = Math.max(0, sectionOrder.indexOf(attempt.currentSectionKey as PteMockSection));
  const [phase, setPhase] = useState<"microphone" | "introduction" | "transition" | "question" | "complete">(initialSectionIndex === 0 ? "microphone" : "transition");
  const [introductionReady, setIntroductionReady] = useState(false);
  const [sectionIndex, setSectionIndex] = useState(initialSectionIndex);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, PteMockQuestionResponse>>({});
  const [savingSection, setSavingSection] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [completeMessage, setCompleteMessage] = useState("");
  const currentSection = sectionOrder[sectionIndex];
  const currentQuestions = data[currentSection];
  const currentQuestion = currentQuestions[questionIndex];
  const totalQuestions = sectionOrder.reduce((sum, section) => sum + data[section].length, 0);
  const completedBeforeSection = sectionOrder.slice(0, sectionIndex).reduce((sum, section) => sum + data[section].length, 0);
  const completedQuestions = completedBeforeSection + questionIndex;
  const progress = totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0;

  function updateResponse(question: PteMockQuestion, response: PteMockQuestionResponse) {
    setResponses((current) => ({ ...current, [getQuestionKey(question)]: response }));
  }

  async function saveCurrentSection(nextSectionKey: PteMockSection | null) {
    setSavingSection(true);
    setSaveError("");
    try {
      const form = new FormData();
      const sectionResponses = currentQuestions.map((question) => {
        const key = getQuestionKey(question);
        const response = responses[key] ?? {};
        const { recording, ...serializable } = response;
        if (recording?.blob) {
          form.append(`recording:${key}`, recording.blob, `${question.type}-${question.id}.webm`);
        }
        return {
          questionKey: key,
          question,
          response: serializable as Record<string, unknown>,
          responseText: response.text ?? "",
        };
      });
      form.append("payload", JSON.stringify({
        attemptId: attempt.id,
        sectionKey: currentSection,
        nextSectionKey,
        responses: sectionResponses,
      }));

      const response = await fetch("/api/mock-test/pte/section", { method: "POST", body: form });
      const result = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!response.ok || !result.ok) throw new Error(result.message || "保存失败");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "保存失败");
      throw error;
    } finally {
      setSavingSection(false);
    }
  }

  const beginSection = () => {
    if (currentQuestions.length === 0) {
      void moveToNextSection();
      return;
    }
    setQuestionIndex(0);
    setPhase("question");
  };

  const moveToNextSection = async () => {
    if (sectionIndex >= sectionOrder.length - 1) {
      await saveCurrentSection(null);
      const response = await fetch("/api/mock-test/pte/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: attempt.id }),
      });
      const result = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!response.ok || !result.ok) throw new Error(result.message || "提交失败");
      setCompleteMessage("PTE 模考已提交。成绩会在 24 小时内通过邮件发送，老师发布后你也可以在账户里查看完整报告。");
      setPhase("complete");
      return;
    }
    await saveCurrentSection(sectionOrder[sectionIndex + 1]);
    setSectionIndex((current) => current + 1);
    setQuestionIndex(0);
    setPhase("transition");
  };

  const nextQuestion = () => {
    if (questionIndex < currentQuestions.length - 1) {
      setQuestionIndex((current) => current + 1);
      return;
    }
    void moveToNextSection();
  };

  if (phase === "microphone") return <div className="space-y-5"><div className="flex justify-start"><Button type="button" variant="ghost" onClick={onExit} className="gap-2"><ArrowLeft size={16} />退出模考</Button></div><MicrophoneCheck onContinue={() => setPhase("introduction")} /></div>;

  if (phase === "introduction") return <div className="mx-auto w-full max-w-3xl space-y-5"><Button type="button" variant="ghost" onClick={onExit} className="gap-2"><ArrowLeft size={16} />退出模考</Button><Card><CardContent className="p-5 sm:p-7"><Badge>Introduction</Badge><h1 className="mt-4 text-2xl font-semibold text-[var(--text)]">30 秒自我介绍</h1><p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">请简单介绍你的姓名、学习背景和参加 PTE 的目标。本段录音不评分、不保存，也不会上传。</p><div className="mt-5"><LocalRecordingPanel maxDuration={30} onReadyChange={setIntroductionReady} /></div><div className="mt-6 flex justify-end"><Button type="button" disabled={!introductionReady} onClick={() => setPhase("transition")} className="gap-2">进入口语部分<ArrowRight size={16} /></Button></div></CardContent></Card></div>;

  if (phase === "transition") {
    const meta = sectionMeta[currentSection];
    return <div className="mx-auto flex min-h-[560px] w-full max-w-3xl items-center"><Card className="w-full"><CardContent className="p-6 text-center sm:p-10"><Badge>{meta.english}</Badge><h1 className="mt-5 text-3xl font-semibold text-[var(--text)]">{meta.label}</h1><p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[var(--text-soft)]">{meta.description}</p><div className="mx-auto mt-6 max-w-sm rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 text-sm text-[var(--text-soft)]">本部分共 {currentQuestions.length} 题。进入本部分后请一次完成，完成后会保存到数据库。</div><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><Button type="button" variant="secondary" onClick={onExit} className="gap-2"><ArrowLeft size={16} />退出并稍后继续</Button><Button type="button" onClick={beginSection} className="gap-2">开始本部分<ArrowRight size={16} /></Button></div></CardContent></Card></div>;
  }

  if (phase === "complete") return <div className="mx-auto flex min-h-[560px] w-full max-w-3xl items-center"><Card className="w-full"><CardContent className="p-6 text-center sm:p-10"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--success-soft)] text-[var(--success)]"><CheckCircle2 size={32} /></span><h1 className="mt-5 text-3xl font-semibold text-[var(--text)]">本次模拟考试已提交</h1><p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[var(--text-soft)]">{completeMessage || "成绩会在 24 小时内通过邮件发送。老师发布后，你也可以在账户里查看完整报告。"}</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><Button type="button" variant="secondary" onClick={onExit}>返回模考首页</Button></div></CardContent></Card></div>;

  if (!currentQuestion) return <div className="rounded-[var(--radius-md)] border border-[var(--warning)]/30 bg-[var(--warning-soft)] p-5 text-sm text-[var(--warning)]">当前部分没有可用题目。<Button type="button" size="sm" onClick={moveToNextSection} className="ml-3">跳过本部分</Button></div>;

  return (
    <div className="space-y-4">
      <Card><CardContent className="p-4 sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-wrap items-center gap-2"><Badge>{sectionMeta[currentSection].english}</Badge><span className="text-sm font-semibold text-[var(--text)]">第 {questionIndex + 1} / {currentQuestions.length} 题</span><span className="text-xs text-[var(--text-faint)]">总进度 {completedQuestions + 1} / {totalQuestions}</span></div><Button type="button" variant="ghost" size="sm" disabled>本部分进行中</Button></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--border)]"><div className="h-full rounded-full bg-[var(--primary)] transition-[width]" style={{ width: `${Math.max(progress, 2)}%` }} /></div></CardContent></Card>
      {data.warnings.length ? <div className="rounded-[var(--radius-md)] border border-[var(--warning)]/30 bg-[var(--warning-soft)] px-4 py-3 text-sm text-[var(--warning)]">{data.warnings.join("；")}</div> : null}
      {saveError ? <div className="rounded-[var(--radius-md)] border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-4 py-3 text-sm font-semibold text-[var(--danger)]">{saveError}</div> : null}
      <Card><CardContent className="p-5 sm:p-7"><QuestionRenderer key={`${currentQuestion.type}-${currentQuestion.id}`} question={currentQuestion} onResponseChange={(response) => updateResponse(currentQuestion, response)} /><div className="mt-7 flex items-center justify-between border-t border-[var(--border)] pt-5"><span className="inline-flex items-center gap-2 text-xs text-[var(--text-faint)]"><ShieldCheck size={14} />本部分完成后保存，最后统一提交评分</span><Button type="button" onClick={nextQuestion} disabled={savingSection} className="gap-2">{savingSection ? "保存中..." : questionIndex === currentQuestions.length - 1 ? "完成本部分" : "下一题"}<ArrowRight size={16} /></Button></div></CardContent></Card>
    </div>
  );
}

export function PteMockExamExperience({ onExit }: { onExit: () => void }) {
  const [data, setData] = useState<PteMockExamData | null>(null);
  const [attempt, setAttempt] = useState<MockAttemptSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch("/api/mock-test/pte", { cache: "no-store", signal: controller.signal });
        const result = await response.json() as { ok: boolean; exam?: PteMockExamData; attempt?: MockAttemptSummary; message?: string };
        if (!response.ok || !result.ok || !result.exam || !result.attempt) throw new Error(result.message || "PTE 模考组卷失败");
        setData(result.exam);
        setAttempt(result.attempt);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "PTE 模考组卷失败");
      }
    };
    void load();
    return () => controller.abort();
  }, []);

  if (error) return <div className="mx-auto w-full max-w-2xl rounded-[var(--radius-md)] border border-[var(--danger)]/30 bg-[var(--danger-soft)] p-5 text-center text-sm text-[var(--danger)]"><p>{error}</p><Button type="button" variant="secondary" onClick={onExit} className="mt-4">返回</Button></div>;
  if (!data || !attempt) return <div className="flex min-h-[420px] items-center justify-center"><div className="text-center"><LoaderCircle className="mx-auto animate-spin text-[var(--primary)]" size={30} /><p className="mt-3 text-sm text-[var(--text-soft)]">正在随机生成 PTE 模考试卷...</p></div></div>;
  return <PteMockExam data={data} attempt={attempt} onExit={onExit} />;
}
