"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, Headphones, LogOut, Mic2, PenLine, Rows3, Save } from "lucide-react";

import { IeltsListeningMockPanel } from "@/components/ielts-listening/listening-exam-client";
import { IeltsReadingMockPanel } from "@/components/ielts-reading/reading-exam-client";
import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Card, CardContent } from "@/components/ui-v2/card";
import { sanitizeRichHtml } from "@/lib/html/sanitize";
import type { IeltsMockExamPayload, IeltsMockSectionKey } from "@/lib/mock-test/types";
import { cn } from "@/lib/utils";

type Phase = IeltsMockSectionKey | "submitted";
type SaveState = "idle" | "saving" | "saved" | "error";

const sectionOrder: IeltsMockSectionKey[] = ["listening", "reading", "writing", "speaking"];
const sectionLabels: Record<IeltsMockSectionKey, { label: string; icon: React.ReactNode }> = {
  listening: { label: "Listening", icon: <Headphones size={17} /> },
  reading: { label: "Reading", icon: <Rows3 size={17} /> },
  writing: { label: "Writing", icon: <PenLine size={17} /> },
  speaking: { label: "Speaking", icon: <Mic2 size={17} /> },
};

function formatTimer(seconds: number) {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

export function IeltsMockExamClient({ initialExam }: { initialExam: IeltsMockExamPayload }) {
  const attemptId = initialExam.attempt?.id ?? "";
  const initialPhase = sectionOrder.includes(initialExam.attempt?.currentSectionKey as IeltsMockSectionKey)
    ? initialExam.attempt?.currentSectionKey as IeltsMockSectionKey
    : "listening";
  const [phase, setPhase] = useState<Phase>(initialExam.attempt?.status === "in_progress" ? initialPhase : "submitted");
  const [answers, setAnswers] = useState<Record<string, string>>(initialExam.answers);
  const [timers, setTimers] = useState<Record<IeltsMockSectionKey, number>>(initialExam.timers);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const saveTimersRef = useRef<Record<string, number>>({});
  const activeTimer = phase === "submitted" ? 0 : timers[phase];

  const allQuestionKeys = useMemo(() => {
    const keys: string[] = [];
    for (const sectionKey of ["listening", "reading"] as const) {
      for (const section of initialExam.sections[sectionKey]) {
        for (const group of section.questions) {
          for (let number = group.questionNumberStart; number <= group.questionNumberEnd; number += 1) keys.push(`${sectionKey}:${number}`);
        }
      }
    }
    keys.push("writing:task1", "writing:task2");
    initialExam.sections.speaking?.part1Questions.forEach((_, index) => keys.push(`speaking:part1:${index + 1}`));
    if (initialExam.sections.speaking?.part2Question) keys.push("speaking:part2");
    initialExam.sections.speaking?.part3Questions.forEach((_, index) => keys.push(`speaking:part3:${index + 1}`));
    return keys;
  }, [initialExam.sections]);

  const answeredCount = allQuestionKeys.filter((key) => (answers[key] ?? "").trim()).length;

  const saveAnswer = useCallback(async ({ key, value, sectionKey, questionType }: { key: string; value: string; sectionKey: IeltsMockSectionKey; questionType: string }) => {
    if (!attemptId) return;
    setSaveState("saving");
    try {
      const response = await fetch("/api/mock-test/ielts/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          sectionKey,
          questionKey: key,
          questionType,
          responseText: value,
          currentQuestionKey: key,
          timers,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!response.ok || !data.ok) throw new Error(data.message || "保存失败");
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }, [attemptId, timers]);

  function setAnswer(key: string, value: string, sectionKey: IeltsMockSectionKey, questionType: string) {
    setAnswers((current) => current[key] === value ? current : { ...current, [key]: value });
    if (saveTimersRef.current[key]) window.clearTimeout(saveTimersRef.current[key]);
    saveTimersRef.current[key] = window.setTimeout(() => {
      void saveAnswer({ key, value, sectionKey, questionType });
    }, 650);
  }

  const submitExam = useCallback(async () => {
    if (!attemptId || submitting) return;
    setSubmitting(true);
    setNotice("");
    try {
      const response = await fetch("/api/mock-test/ielts/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId }),
      });
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!response.ok || !data.ok) throw new Error(data.message || "提交失败");
      setPhase("submitted");
      setNotice("模考已提交。老师会审核并通过邮件发布成绩，发布后你可以在账户中查看完整报告。");
    } catch {
      setNotice("提交失败，请稍后重试。");
    } finally {
      setSubmitting(false);
    }
  }, [attemptId, submitting]);

  const moveNextSection = useCallback(() => {
    if (phase === "submitted") return;
    const index = sectionOrder.indexOf(phase);
    if (index >= sectionOrder.length - 1) {
      void submitExam();
      return;
    }
    setPhase(sectionOrder[index + 1]);
  }, [phase, submitExam]);

  useEffect(() => {
    if (phase === "submitted") return;
    const timer = window.setInterval(() => {
      setTimers((current) => {
        const nextValue = Math.max(0, current[phase] - 1);
        if (nextValue === 0 && current[phase] > 0) {
          window.setTimeout(moveNextSection, 0);
        }
        return { ...current, [phase]: nextValue };
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [moveNextSection, phase]);

  useEffect(() => {
    const pendingTimers = saveTimersRef.current;
    return () => Object.values(pendingTimers).forEach((timer) => window.clearTimeout(timer));
  }, []);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!audioPlaying) return;
      event.preventDefault();
      event.returnValue = "Listening audio is playing.";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [audioPlaying]);

  if (!attemptId) {
    return <div className="rounded-[var(--radius-lg)] border border-[var(--danger)]/30 bg-[var(--danger-soft)] p-5 text-sm text-[var(--danger)]">模考 attempt 创建失败，请返回后重试。</div>;
  }

  if (phase === "submitted") {
    return (
      <main className="min-h-screen bg-[var(--bg)] p-4 text-[var(--text)] sm:p-6">
        <Card className="mx-auto mt-10 max-w-2xl">
          <CardContent className="p-8 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--success-soft)] text-[var(--success)]"><CheckCircle2 size={30} /></span>
            <h1 className="mt-5 text-2xl font-bold">模考已提交</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[var(--text-soft)]">老师会审核并通过邮件发布成绩。成绩发布后，你可以在账户里查看完整报告、正确答案、原题和详细反馈。</p>
            <Link href="/mock-test"><Button type="button" className="mt-6">返回模考中心</Button></Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-[#111827]">
      <header className="sticky top-0 z-40 border-b border-[#1f2937] bg-[#111827] text-white shadow-md">
        <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded border border-white/20 bg-white/10">{sectionLabels[phase].icon}</span>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{initialExam.title}</div>
              <div className="text-xs text-white/65">{sectionLabels[phase].label} · {answeredCount} / {allQuestionKeys.length} answered</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className={cn("flex h-10 items-center gap-2 rounded border px-3 text-sm font-bold tabular-nums", activeTimer <= 300 ? "border-red-300 bg-red-500/20 text-red-100" : "border-white/20 bg-white/10")}>
              <Clock3 size={16} />{formatTimer(activeTimer)}
            </div>
            <Badge variant={saveState === "error" ? "danger" : saveState === "saved" ? "success" : "secondary"}>{saveState === "saving" ? "保存中" : saveState === "saved" ? "已保存" : saveState === "error" ? "保存失败" : "自动保存"}</Badge>
            {audioPlaying ? (
              <Button type="button" variant="secondary" disabled className="gap-2"><AlertTriangle size={16} />听力播放中不可退出</Button>
            ) : (
              <Link href="/mock-test"><Button type="button" variant="secondary" className="gap-2"><LogOut size={16} />退出并保存</Button></Link>
            )}
          </div>
        </div>
        <nav className="flex border-t border-white/10">
          {sectionOrder.map((section) => (
            <button key={section} type="button" disabled={sectionOrder.indexOf(section) > sectionOrder.indexOf(phase)} onClick={() => setPhase(section)} className={cn("flex h-11 flex-1 items-center justify-center gap-2 text-sm font-semibold transition", phase === section ? "bg-white text-[#111827]" : "text-white/70 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40")}>{sectionLabels[section].icon}{sectionLabels[section].label}</button>
          ))}
        </nav>
      </header>

      {notice ? <div className="mx-auto mt-4 max-w-6xl rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">{notice}</div> : null}

      {phase === "listening" ? <ListeningSection exam={initialExam} answers={answers} setAnswer={setAnswer} onAudioPlayingChange={setAudioPlaying} /> : null}
      {phase === "reading" ? <ReadingSection exam={initialExam} answers={answers} setAnswer={setAnswer} /> : null}
      {phase === "writing" ? <WritingSection exam={initialExam} answers={answers} setAnswer={setAnswer} /> : null}
      {phase === "speaking" ? <SpeakingSection exam={initialExam} answers={answers} setAnswer={setAnswer} /> : null}

      <footer className="sticky bottom-0 z-30 border-t border-[#d1d5db] bg-white px-4 py-3 shadow">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#6b7280]"><Save size={14} />答案变化后会自动保存</div>
          <Button type="button" onClick={moveNextSection} disabled={submitting} className="gap-2">{phase === "speaking" ? submitting ? "提交中..." : "提交整场模考" : "进入下一部分"}<ArrowRight size={16} /></Button>
        </div>
      </footer>
    </main>
  );
}

function ListeningSection({ exam, answers, setAnswer, onAudioPlayingChange }: { exam: IeltsMockExamPayload; answers: Record<string, string>; setAnswer: (key: string, value: string, sectionKey: IeltsMockSectionKey, questionType: string) => void; onAudioPlayingChange: (value: boolean) => void }) {
  const panelAnswers = useMemo(() => stripSectionPrefix(answers, "listening"), [answers]);
  return (
    <section className="mx-auto max-w-7xl p-4">
      <IeltsListeningMockPanel data={exam.practiceData} answers={panelAnswers} onAnswerChange={(questionNumber, value) => setAnswer(`listening:${questionNumber}`, value, "listening", "ielts_listening")} onAudioPlayingChange={onAudioPlayingChange} />
    </section>
  );
}

function ReadingSection({ exam, answers, setAnswer }: { exam: IeltsMockExamPayload; answers: Record<string, string>; setAnswer: (key: string, value: string, sectionKey: IeltsMockSectionKey, questionType: string) => void }) {
  const panelAnswers = useMemo(() => stripSectionPrefix(answers, "reading"), [answers]);
  return (
    <section className="mx-auto max-w-7xl p-4">
      <IeltsReadingMockPanel data={exam.practiceData} answers={panelAnswers} onAnswerChange={(questionNumber, value) => setAnswer(`reading:${questionNumber}`, value, "reading", "ielts_reading")} />
    </section>
  );
}

function WritingSection({ exam, answers, setAnswer }: { exam: IeltsMockExamPayload; answers: Record<string, string>; setAnswer: (key: string, value: string, sectionKey: IeltsMockSectionKey, questionType: string) => void }) {
  const [taskKey, setTaskKey] = useState<"task1" | "task2">("task1");
  const task = exam.sections.writing.find((item) => item.taskKey === taskKey) ?? exam.sections.writing[0];
  if (!task) return <section className="mx-auto max-w-4xl p-4"><Card><CardContent className="p-5 text-sm text-[#6b7280]">这套模考没有写作题目。</CardContent></Card></section>;
  const answerKey = `writing:${task.taskKey}`;
  const value = answers[answerKey] ?? "";

  return (
    <section className="grid h-[calc(100vh-172px)] grid-cols-1 overflow-hidden lg:grid-cols-2">
      <aside className="overflow-y-auto border-r border-[#d1d5db] bg-white p-5">
        <div className="mb-4 flex gap-2">
          {exam.sections.writing.map((item) => <button key={item.taskKey} type="button" onClick={() => setTaskKey(item.taskKey)} className={cn("rounded border px-3 py-1.5 text-sm font-semibold", item.taskKey === task.taskKey ? "border-[#111827] bg-[#111827] text-white" : "border-[#d1d5db] bg-white text-[#374151]")}>{item.title}</button>)}
        </div>
        <h2 className="text-xl font-bold">{task.title}</h2>
        <p className="mt-2 text-sm font-semibold text-[#6b7280]">{task.instructions}</p>
        <RichHtml className="mt-4 text-sm leading-7" html={task.prompt} />
        <div className="mt-4 space-y-3">
          {task.imageUrls.map((url, index) => <img key={`${url}-${index}`} src={url} alt={`${task.title} image ${index + 1}`} className="w-full rounded border border-[#d1d5db] bg-white object-contain" />)}
        </div>
      </aside>
      <div className="flex flex-col bg-[#f9fafb] p-5">
        <div className="mb-3 flex items-center justify-between text-sm font-semibold text-[#6b7280]">
          <span>{task.title} Answer</span>
          <span>{value.trim().split(/\s+/).filter(Boolean).length} words</span>
        </div>
        <textarea
          value={value}
          onChange={(event) => setAnswer(answerKey, event.target.value, "writing", task.taskKey)}
          className="min-h-0 flex-1 resize-none rounded border border-[#d1d5db] bg-white p-4 text-base leading-7 outline-none focus:border-[#111827]"
          placeholder="Type your answer here..."
        />
      </div>
    </section>
  );
}

function SpeakingSection({ exam, answers, setAnswer }: { exam: IeltsMockExamPayload; answers: Record<string, string>; setAnswer: (key: string, value: string, sectionKey: IeltsMockSectionKey, questionType: string) => void }) {
  const speaking = exam.sections.speaking;
  if (!speaking) {
    return <section className="mx-auto max-w-4xl p-4"><Card><CardContent className="p-5 text-sm text-[#6b7280]">口语题库暂时不可用。</CardContent></Card></section>;
  }

  return (
    <section className="mx-auto max-w-5xl space-y-4 p-4">
      <Card>
        <CardContent className="p-5">
          <Badge>IELTS Speaking</Badge>
          <h1 className="mt-3 text-2xl font-bold text-[#111827]">Speaking Mock Preview</h1>
          <p className="mt-2 text-sm leading-6 text-[#6b7280]">第一版暂不录音。这里先展示正式口语 Part 1、Part 2、Part 3 题目，并保存文字备注/回答，方便你检查成品流程。</p>
        </CardContent>
      </Card>

      <SpeakingCard title={`Part 1 · ${speaking.part1Topic}`} subtitle="Answer the questions briefly.">
        {speaking.part1Questions.map((question, index) => <SpeakingAnswer key={`${question}-${index}`} label={`Question ${index + 1}`} question={question} value={answers[`speaking:part1:${index + 1}`] ?? ""} onChange={(value) => setAnswer(`speaking:part1:${index + 1}`, value, "speaking", "speaking_part1")} />)}
      </SpeakingCard>

      <SpeakingCard title={`Part 2 · ${speaking.part2Title}`} subtitle="You have one minute to prepare. Speak for up to two minutes.">
        <div className="rounded border border-[#d1d5db] bg-[#f9fafb] p-4">
          <p className="font-semibold text-[#111827]">{speaking.part2Question}</p>
          {speaking.cueCards.length > 0 ? <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-[#374151]">{speaking.cueCards.map((cue, index) => <li key={`${cue}-${index}`}>{cue}</li>)}</ul> : null}
        </div>
        <SpeakingTextarea value={answers["speaking:part2"] ?? ""} onChange={(value) => setAnswer("speaking:part2", value, "speaking", "speaking_part2")} placeholder="Type notes or a spoken-answer draft here..." />
      </SpeakingCard>

      <SpeakingCard title="Part 3" subtitle="Discuss more abstract questions related to the Part 2 topic.">
        {speaking.part3Questions.map((question, index) => <SpeakingAnswer key={`${question}-${index}`} label={`Question ${index + 1}`} question={question} value={answers[`speaking:part3:${index + 1}`] ?? ""} onChange={(value) => setAnswer(`speaking:part3:${index + 1}`, value, "speaking", "speaking_part3")} />)}
      </SpeakingCard>
    </section>
  );
}

function SpeakingCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <Card><CardContent className="space-y-4 p-5"><div><h2 className="text-xl font-bold text-[#111827]">{title}</h2><p className="mt-1 text-sm text-[#6b7280]">{subtitle}</p></div>{children}</CardContent></Card>;
}

function SpeakingAnswer({ label, question, value, onChange }: { label: string; question: string; value: string; onChange: (value: string) => void }) {
  return <div className="rounded border border-[#d1d5db] bg-[#f9fafb] p-4"><p className="text-xs font-bold uppercase tracking-wide text-[#6b7280]">{label}</p><p className="mt-2 font-semibold leading-7 text-[#111827]">{question}</p><SpeakingTextarea value={value} onChange={onChange} placeholder="Type your answer or notes here..." /></div>;
}

function SpeakingTextarea({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-3 min-h-28 w-full resize-y rounded border border-[#d1d5db] bg-white p-3 text-sm leading-6 outline-none focus:border-[#111827]" />;
}

function RichHtml({ html, className }: { html: string; className?: string }) {
  if (!html) return null;
  return <div className={className} dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(html) }} />;
}

function stripSectionPrefix(answers: Record<string, string>, sectionKey: "listening" | "reading") {
  const prefix = `${sectionKey}:`;
  return Object.fromEntries(Object.entries(answers).filter(([key]) => key.startsWith(prefix)).map(([key, value]) => [key.slice(prefix.length), value]));
}
