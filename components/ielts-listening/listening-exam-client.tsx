"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, ClipboardPenLine, FileText, Headphones, ListChecks, MoreHorizontal, PanelRightOpen, SendHorizontal, X } from "lucide-react";

import { IeltsSubmitDialog } from "@/components/ielts-practice/ielts-submit-dialog";
import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { SecureAudioPlayer } from "@/components/ui-v2/secure-audio-player";
import { BRAND_NAME_CN } from "@/lib/brand";
import { sanitizeRichHtml } from "@/lib/html/sanitize";
import { buildIeltsSubmitResult } from "@/lib/ielts/answer-scoring";
import type { IeltsAnswer, IeltsAsset, IeltsBookPracticeData, IeltsQuestion, IeltsSection } from "@/lib/ielts/practice";
import { normalizePublicStorageUrl } from "@/lib/storage/public-url";
import { cn } from "@/lib/utils";

type Answers = Record<string, string>;

type ListeningPart = {
  section: IeltsSection;
  displayNumber: number;
  questions: IeltsQuestion[];
  numbers: number[];
  audio?: IeltsAsset;
};

type TranscriptCue = {
  id: string;
  start: number;
  end: number;
  text: string;
};

export function IeltsListeningExamClient({ data, selectedTestNumber, isAdmin = false }: { data: IeltsBookPracticeData; selectedTestNumber: number; isAdmin?: boolean }) {
  const examRef = useRef<HTMLDivElement | null>(null);
  const questionPanelRef = useRef<HTMLDivElement | null>(null);
  const navFadeTimerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [audioTime, setAudioTime] = useState(0);
  const [activePartIndex, setActivePartIndex] = useState(0);
  const [notesOpen, setNotesOpen] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [navActive, setNavActive] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [submitDialogMode, setSubmitDialogMode] = useState<"confirm" | "result" | null>(null);
  const [submitNotice, setSubmitNotice] = useState("");

  const listeningModule = data.modules.find((module) => module.module_type === "listening");
  const sections = useMemo(() => listeningModule ? data.sections.filter((section) => section.module_id === listeningModule.id).sort((a, b) => a.sort_order - b.sort_order) : [], [data.sections, listeningModule]);
  const sectionAudios = useMemo(() => selectSectionAudios(data.assets, sections), [data.assets, sections]);
  const parts = useMemo<ListeningPart[]>(() => sections.map((section, index) => {
    const questions = data.questions.filter((question) => question.section_id === section.id).sort((a, b) => a.sort_order - b.sort_order);
    const fallbackStart = index * 10 + 1;
    const numbers = [...new Set(questions.flatMap(questionNumbers))].sort((a, b) => a - b);
    return { section, displayNumber: index + 1, questions, numbers: numbers.length > 0 ? numbers : Array.from({ length: 10 }, (_, offset) => fallbackStart + offset), audio: sectionAudios[index] };
  }), [data.questions, sections, sectionAudios]);
  const activePart = parts[activePartIndex] ?? parts[0] ?? null;
  const officialAnswerByNumber = useMemo(() => {
    const listeningQuestions = parts.flatMap((part) => part.questions);
    const questionById = new Map(listeningQuestions.map((question) => [question.id, question]));
    const rows = data.answers.flatMap((answer) => {
      const question = questionById.get(answer.question_id);
      return question ? getOfficialAnswerRows(question, answer) : [];
    });
    return Object.fromEntries(rows.map((row) => [row.questionNumber, row.answerText]));
  }, [data.answers, parts]);

  useEffect(() => {
    const timer = window.setInterval(() => setElapsedSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    questionPanelRef.current?.scrollTo({ top: 0 });
    const frame = window.requestAnimationFrame(() => setAudioTime(0));
    return () => window.cancelAnimationFrame(frame);
  }, [activePart?.section.id]);

  useEffect(() => {
    return () => {
      if (navFadeTimerRef.current) window.clearTimeout(navFadeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!submitNotice) return;
    const timer = window.setTimeout(() => setSubmitNotice(""), 2200);
    return () => window.clearTimeout(timer);
  }, [submitNotice]);

  function setAnswer(questionNumber: string, value: string) {
    setAnswers((current) => current[questionNumber] === value ? current : { ...current, [questionNumber]: value });
  }

  function scrollToPart(partIndex: number) {
    if (!parts[partIndex]) return;
    setActivePartIndex(partIndex);
  }

  function scrollToQuestion(questionNumber: number) {
    const partIndex = parts.findIndex((item) => item.numbers.includes(questionNumber));
    if (partIndex >= 0) setActivePartIndex(partIndex);
    window.setTimeout(() => {
      document.getElementById(`listening-question-${questionNumber}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  }

  function scrollQuestionStep(direction: 1 | -1) {
    pulseQuestionNav();
    const panel = questionPanelRef.current;
    if (!panel) return;
    const items = [...panel.querySelectorAll<HTMLElement>("[data-listening-question]")];
    if (items.length === 0) return;
    const panelRect = panel.getBoundingClientRect();
    const center = panelRect.top + panelRect.height / 2;
    const closestIndex = items.reduce((best, item, index) => Math.abs(item.getBoundingClientRect().top - center) < Math.abs(items[best].getBoundingClientRect().top - center) ? index : best, 0);
    items[Math.min(items.length - 1, Math.max(0, closestIndex + direction))]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function pulseQuestionNav() {
    setNavActive(true);
    if (navFadeTimerRef.current) window.clearTimeout(navFadeTimerRef.current);
    navFadeTimerRef.current = window.setTimeout(() => setNavActive(false), 1000);
  }

  function closeNotesFromOutside(event: React.PointerEvent<HTMLDivElement>) {
    if (!notesOpen) return;
    const target = event.target as Element;
    if (target.closest("[data-notes-drawer]") || target.closest("[data-notes-toggle]")) return;
    setNotesOpen(false);
  }

  function seekTranscript(start: number) {
    if (!audioRef.current) return;
    audioRef.current.currentTime = start;
    setAudioTime(start);
    void audioRef.current.play().catch(() => undefined);
  }

  function handleSubmit() {
    const result = buildIeltsSubmitResult("listening", answers, officialAnswerByNumber);
    setSubmitDialogMode(result.unanswered.length > 0 ? "confirm" : "result");
  }

  if (!data.book || !listeningModule) {
    return (
      <main className="container-main py-6">
        <Link href="/ielts/listening" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-soft)] transition hover:text-[var(--primary)]"><ArrowLeft size={16} />返回听力练习</Link>
        <div className="mt-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-6 text-sm text-[var(--text-soft)]">这套书暂时没有听力数据。</div>
      </main>
    );
  }

  return (
    <div ref={examRef} onPointerDownCapture={closeNotesFromOutside} className={cn("min-h-screen bg-[var(--bg)] text-[var(--text)] transition-[padding] duration-300 ease-out", notesOpen && "lg:pr-[28rem]")}>
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--card)]/95 shadow-[var(--shadow-sm)] backdrop-blur">
        <div className="px-3 py-2 lg:hidden">
          <div className="flex items-center gap-2">
            <Link href={`/ielts/listening?book=${data.book.book_number}`} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text-soft)] transition hover:text-[var(--primary)]"><ArrowLeft size={17} /></Link>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-[var(--text)]">Cambridge {data.book.book_number} · Test {selectedTestNumber}</div>
              <div className="truncate text-xs text-[var(--text-soft)]">Part {activePart?.displayNumber ?? 1} · Q{activePart?.numbers[0] ?? ""}-{activePart?.numbers.at(-1) ?? ""}</div>
            </div>
            <div className="flex h-9 shrink-0 items-center justify-center gap-1 rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-2.5 text-xs text-[var(--success)]"><span>◷</span><span className="font-bold tabular-nums">{formatTimer(elapsedSeconds)}</span></div>
            <Button type="button" size="sm" onClick={handleSubmit} className="h-9 shrink-0 rounded-full px-3">Submit</Button>
          </div>
          <details className="group mt-2">
            <summary className="flex h-9 cursor-pointer list-none items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-soft)] text-xs font-semibold text-[var(--text-soft)]"><MoreHorizontal size={16} />工具</summary>
            <div className="mt-2 grid grid-cols-3 gap-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-2">
              <span data-notes-toggle><MobileExamTool label="笔记" onClick={() => setNotesOpen(true)}><ClipboardPenLine size={17} /></MobileExamTool></span>
              <MobileExamTool label="字幕" active={transcriptOpen} onClick={() => setTranscriptOpen((value) => !value)}><FileText size={17} /></MobileExamTool>
              <MobileExamTool label="Review" onClick={() => setReviewOpen(true)}><ListChecks size={17} /></MobileExamTool>
            </div>
          </details>
        </div>

        <div className="hidden min-h-16 gap-3 px-3 py-3 sm:px-5 lg:grid lg:grid-cols-[minmax(220px,1fr)_auto_minmax(420px,1fr)] lg:items-center">
          <div className="flex items-center gap-3">
            <Link href={`/ielts/listening?book=${data.book.book_number}`} className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text-soft)] transition hover:text-[var(--primary)]"><ArrowLeft size={17} /></Link>
            <div>
              <div className="text-sm font-semibold text-[var(--text)]">{BRAND_NAME_CN} IELTS Listening</div>
              <div className="text-xs text-[var(--text-soft)]">Cambridge {data.book.book_number} · Test {selectedTestNumber}</div>
            </div>
          </div>
          <div className="justify-self-center text-center">
            <div className="text-sm font-bold text-[var(--text)]">Part {activePart?.displayNumber ?? 1}</div>
            <div className="mt-0.5 text-xs text-[var(--text-soft)]">Listen and answer questions {activePart?.numbers[0] ?? ""}-{activePart?.numbers.at(-1) ?? ""}</div>
          </div>
          <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
            <span data-notes-toggle><ExamIconButton label="记笔记" onClick={() => setNotesOpen(true)}><ClipboardPenLine size={18} /></ExamIconButton></span>
            <ExamIconButton label="字幕区" active={transcriptOpen} onClick={() => setTranscriptOpen((value) => !value)}><FileText size={18} /></ExamIconButton>
            <Button type="button" variant="secondary" size="sm" onClick={() => setReviewOpen(true)} className="gap-2 rounded-full"><ListChecks size={17} />Review</Button>
            <div className="flex h-9 w-32 shrink-0 items-center justify-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-3 text-sm text-[var(--text-soft)] sm:w-36">
              <span className="text-[var(--success)]">◷</span>
              <span className="font-bold tabular-nums text-[var(--success)]">{formatTimer(elapsedSeconds)}</span>
            </div>
            <Button type="button" size="sm" onClick={handleSubmit} className="gap-2 rounded-full">Submit <SendHorizontal size={17} /></Button>
          </div>
        </div>
      </header>

      <main className="relative flex min-h-[calc(100vh-150px)] flex-col overflow-hidden md:h-[calc(100vh-150px)] md:flex-row">
        <section ref={questionPanelRef} className={cn("h-[58vh] min-w-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,var(--bg-soft),var(--bg))] px-4 py-5 transition-[width] duration-300 md:h-auto md:px-7", transcriptOpen ? "md:w-[68%]" : "md:w-full")}>
          {activePart && <ListeningQuestionPart part={activePart} answers={answers} onAnswerChange={setAnswer} isAdmin={isAdmin} audioRef={audioRef} onAudioTimeChange={setAudioTime} />}
        </section>

        <aside className={cn("border-l border-[var(--border)] bg-[var(--card)] transition-all duration-300 md:h-auto", transcriptOpen ? "h-72 overflow-y-auto p-4 md:w-[32%] md:p-5" : "h-0 overflow-hidden border-l-0 p-0 md:w-0")}>
          {activePart && data.book && <TranscriptPanel bookNumber={data.book.book_number} testNumber={selectedTestNumber} sectionNumber={activePart.displayNumber} currentTime={audioTime} onCueClick={seekTranscript} />}
        </aside>

        <div className={cn("absolute bottom-5 right-5 z-20 hidden gap-3 transition-opacity duration-700 md:flex", navActive ? "opacity-100" : "opacity-25 hover:opacity-100")}>
          <button type="button" onClick={() => scrollQuestionStep(-1)} className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--success)]/45 bg-[var(--card)] text-[var(--success)] shadow-[var(--shadow-md)] transition hover:bg-[var(--success-soft)]"><ChevronLeft size={22} /></button>
          <button type="button" onClick={() => scrollQuestionStep(1)} className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--success)] bg-[var(--card)] text-[var(--success)] shadow-[var(--shadow-md)] transition hover:bg-[var(--success-soft)]"><ChevronRight size={22} /></button>
        </div>
      </main>

      <footer className="sticky bottom-0 z-30 border-t border-[var(--border)] bg-[var(--card)]/95 px-3 py-3 shadow-[var(--shadow-lg)] backdrop-blur">
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {parts.map((part, index) => <PartNavigator key={part.section.id} part={part} active={index === activePartIndex} answers={answers} onPartClick={() => scrollToPart(index)} onQuestionClick={scrollToQuestion} />)}
        </div>
      </footer>

      <NotesDrawer open={notesOpen} onClose={() => setNotesOpen(false)} />
      {reviewOpen && <ReviewDialog answers={answers} officialAnswers={officialAnswerByNumber} onClose={() => setReviewOpen(false)} />}
      {submitDialogMode && <IeltsSubmitDialog moduleType="listening" answers={answers} officialAnswers={officialAnswerByNumber} mode={submitDialogMode} showOfficialAnswers={isAdmin} bookNumber={data.book.book_number} testNumber={selectedTestNumber} durationSeconds={elapsedSeconds} onCancel={() => setSubmitDialogMode(null)} onConfirm={() => setSubmitDialogMode("result")} onClose={() => setSubmitDialogMode(null)} />}
      {submitNotice && <div className="fixed right-5 top-24 z-50 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm font-medium text-[var(--text)] shadow-[var(--shadow-lg)]">{submitNotice}</div>}
    </div>
  );
}

function ExamIconButton({ label, onClick, active = false, children }: { label: string; onClick: () => void; active?: boolean; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} title={label} aria-label={label} className={cn("inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] text-[var(--text-soft)] transition hover:bg-[var(--bg-soft)] hover:text-[var(--primary)]", active && "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]")}>{children}</button>;
}

function MobileExamTool({ label, onClick, active = false, children }: { label: string; onClick: () => void; active?: boolean; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={cn("flex h-14 w-full flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] text-[11px] font-semibold text-[var(--text-soft)] transition hover:text-[var(--primary)]", active && "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]")}><span>{children}</span><span>{label}</span></button>;
}

function ListeningQuestionPart({ part, answers, onAnswerChange, isAdmin, audioRef, onAudioTimeChange }: { part: ListeningPart; answers: Answers; onAnswerChange: (questionNumber: string, value: string) => void; isAdmin: boolean; audioRef: React.RefObject<HTMLAudioElement | null>; onAudioTimeChange: (value: number) => void }) {
  const shownInstructionKeys = new Set<string>();

  return (
    <section className="mx-auto max-w-5xl scroll-mt-24 pb-10">
      <div className="mb-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge className="mb-2 w-fit">Part {part.displayNumber}</Badge>
            {part.section.instruction && <ReadingRichText html={part.section.instruction} compact />}
          </div>
          <ListeningAudioPlayer audio={part.audio} partNumber={part.displayNumber} audioRef={audioRef} onTimeChange={onAudioTimeChange} />
        </div>
      </div>
      <div className="space-y-8">
        {part.questions.map((question) => {
          const instructionKey = questionInstructionKey(question);
          const suppressInstruction = Boolean(instructionKey && shownInstructionKeys.has(instructionKey));
          if (instructionKey) shownInstructionKeys.add(instructionKey);
          return <QuestionBlock key={question.id} question={question} answers={answers} onAnswerChange={onAnswerChange} suppressInstruction={suppressInstruction} isAdmin={isAdmin} />;
        })}
      </div>
    </section>
  );
}

export function IeltsListeningMockPanel({ data, answers, onAnswerChange, isAdmin = false, onAudioPlayingChange }: { data: IeltsBookPracticeData; answers: Answers; onAnswerChange: (questionNumber: string, value: string) => void; isAdmin?: boolean; onAudioPlayingChange?: (value: boolean) => void }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const listeningModule = data.modules.find((module) => module.module_type === "listening");
  const sections = useMemo(() => listeningModule ? data.sections.filter((section) => section.module_id === listeningModule.id).sort((a, b) => a.sort_order - b.sort_order) : [], [data.sections, listeningModule]);
  const sectionAudios = useMemo(() => selectSectionAudios(data.assets, sections), [data.assets, sections]);
  const parts = useMemo<ListeningPart[]>(() => sections.map((section, index) => {
    const questions = data.questions.filter((question) => question.section_id === section.id).sort((a, b) => a.sort_order - b.sort_order);
    const fallbackStart = index * 10 + 1;
    const numbers = [...new Set(questions.flatMap(questionNumbers))].sort((a, b) => a - b);
    return { section, displayNumber: index + 1, questions, numbers: numbers.length > 0 ? numbers : Array.from({ length: 10 }, (_, offset) => fallbackStart + offset), audio: sectionAudios[index] };
  }), [data.questions, sections, sectionAudios]);

  if (!listeningModule || parts.length === 0) {
    return <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-5 text-sm text-[var(--text-soft)]">这套模考没有听力静态题目。</div>;
  }

  return (
    <div className="space-y-6">
      {parts.map((part) => (
        <section key={part.section.id} className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)] sm:p-5">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Badge className="mb-2 w-fit">Listening Part {part.displayNumber}</Badge>
              {part.section.instruction ? <ReadingRichText html={part.section.instruction} compact /> : null}
            </div>
            <ListeningAudioPlayer audio={part.audio} partNumber={part.displayNumber} audioRef={audioRef} onTimeChange={() => undefined} onPlayingChange={onAudioPlayingChange} />
          </div>
          <div className="space-y-8">
            {part.questions.map((question) => <QuestionBlock key={question.id} question={question} answers={answers} onAnswerChange={onAnswerChange} isAdmin={isAdmin} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

function ListeningAudioPlayer({ audio, partNumber, audioRef, onTimeChange, onPlayingChange }: { audio?: IeltsAsset; partNumber: number; audioRef: React.RefObject<HTMLAudioElement | null>; onTimeChange: (value: number) => void; onPlayingChange?: (value: boolean) => void }) {
  const [playbackRate, setPlaybackRate] = useState(1);
  const playbackRates = [0.8, 1, 1.2, 1.5];
  const audioUrl = audio ? getListeningAssetUrl(audio) : "";

  function changePlaybackRate(nextRate: number) {
    setPlaybackRate(nextRate);
    if (audioRef.current) audioRef.current.playbackRate = nextRate;
  }

  return (
    <div className="w-full rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-soft)] p-3 shadow-[var(--shadow-sm)] lg:max-w-md">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]"><Headphones size={16} className="text-[var(--primary)]" />Part {partNumber} Audio</div>
        <div className="flex flex-wrap gap-1.5">
          {playbackRates.map((rate) => (
            <button key={rate} type="button" onClick={() => changePlaybackRate(rate)} className={cn("h-7 rounded-full border px-2.5 text-xs font-semibold tabular-nums transition", playbackRate === rate ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)] shadow-[var(--shadow-sm)]" : "border-[var(--border)] bg-[var(--card)] text-[var(--text-soft)] hover:border-[var(--primary)] hover:text-[var(--primary)]")}>{rate}x</button>
          ))}
        </div>
      </div>
      {audioUrl ? <SecureAudioPlayer ref={audioRef} key={audioUrl} src={audioUrl} preload="metadata" title={`Part ${partNumber} Audio`} description="IELTS Listening" compact onLoadedMetadata={(event) => { event.currentTarget.playbackRate = playbackRate; }} onTimeUpdate={(event) => onTimeChange(event.currentTarget.currentTime)} onPlay={() => onPlayingChange?.(true)} onPause={() => onPlayingChange?.(false)} onEnded={() => onPlayingChange?.(false)} /> : <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] px-3 py-4 text-sm text-[var(--text-soft)]">这个 Part 暂时没有音频。</div>}
    </div>
  );
}

function QuestionBlock({ question, answers, onAnswerChange, suppressInstruction = false, isAdmin }: { question: IeltsQuestion; answers: Answers; onAnswerChange: (questionNumber: string, value: string) => void; suppressInstruction?: boolean; isAdmin: boolean }) {
  const numbers = questionNumbers(question);
  const range = numbers.length > 1 ? `${numbers[0]}-${numbers.at(-1)}` : `${numbers[0]}`;
  const sourceQuestions = arrayValue(question.content, "questions");
  const pageContent = removeDuplicateQuestionHeading(stringValue(question.content, "page_content"), range);
  const sectionDesc = suppressInstruction ? "" : stringValue(question.content, "section_desc") || question.instruction || "";
  const hasSourceQuestions = sourceQuestions.length > 0;
  const pageContentHasBlanks = hasQuestionBlanks(pageContent);
  const visibleOptions = question.options.filter((option) => !isEmptyLetterOption(optionText(option)));
  const optionBankIsAnswerKey = isFillInBlankAnswerBank(question, pageContent, sectionDesc);
  const studentOptions = optionBankIsAnswerKey ? [] : visibleOptions;
  const judgementOptions = isJudgementOptions(studentOptions) ? studentOptions.map((option) => stripOptionLabel(optionText(option))) : [];
  const inferredOptions = inferQuestionOptions(question, sectionDesc, pageContent);
  const optionLetterValues = getOptionLetterValues(studentOptions);
  const sourceQuestionOptions = judgementOptions.length > 0 ? judgementOptions : inferredOptions.length > 0 ? inferredOptions : optionLetterValues;
  const sourceQuestionsWithOptions = sourceQuestionOptions.length > 0 ? sourceQuestions.map((sourceQuestion) => ({ ...sourceQuestion, option: sourceQuestionOptions })) : sourceQuestions;
  const shouldRenderOptionBank = hasSourceQuestions && studentOptions.length > 0 && judgementOptions.length === 0;
  const shouldShowOptionsBeforeQuestions = shouldRenderOptionBank && isMatchingOptionBank(question, sectionDesc, pageContent || "");
  const promptText = question.prompt ? stripHtml(question.prompt) : "";
  const shouldShowPrompt = Boolean(promptText && !isQuestionRangeHeading(promptText));
  const blankSelectOptions = getBlankSelectOptions(pageContent, studentOptions, inferredOptions);
  const shouldRenderSourceQuestions = hasSourceQuestions && !(pageContentHasBlanks && Object.keys(blankSelectOptions).length > 0);

  return (
    <article id={hasSourceQuestions ? `listening-question-group-${numbers[0]}` : `listening-question-${numbers[0]}`} data-listening-question={hasSourceQuestions ? undefined : true} className="scroll-mt-24 border-b border-[var(--border)] pb-7 last:border-b-0">
      {shouldShowPrompt && <p className="mb-3 text-base font-semibold text-[var(--text)]">{promptText}</p>}
      {sectionDesc && <ReadingRichText html={sectionDesc} compact />}
      {pageContent && <ReadingAnswerHtml html={pageContent} answers={answers} optionsByNumber={blankSelectOptions} onAnswerChange={onAnswerChange} />}
      {shouldShowOptionsBeforeQuestions && <QuestionOptionBank options={studentOptions} />}
      {shouldRenderSourceQuestions && <SourceQuestionList questions={sourceQuestionsWithOptions} fallbackNumbers={numbers} answers={answers} onAnswerChange={onAnswerChange} hideTextInputs={pageContentHasBlanks} />}
      {shouldRenderOptionBank && !shouldShowOptionsBeforeQuestions && <QuestionOptionBank options={studentOptions} />}
      {!hasSourceQuestions && studentOptions.length > 0 && <OptionQuestion questionNumber={`${numbers[0]}`} options={studentOptions} value={answers[`${numbers[0]}`] ?? ""} onChange={onAnswerChange} />}
      {isAdmin && <AdminAnswerDetails question={question} />}
    </article>
  );
}

function TranscriptPanel({ bookNumber, testNumber, sectionNumber, currentTime, onCueClick }: { bookNumber: number; testNumber: number; sectionNumber: number; currentTime: number; onCueClick: (start: number) => void }) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const cueRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [cues, setCues] = useState<TranscriptCue[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const activeCue = cues.find((cue) => currentTime >= cue.start && currentTime < cue.end);
  const activeCueId = activeCue?.id ?? null;

  useEffect(() => {
    let cancelled = false;
    const loadingTimer = window.setTimeout(() => {
      if (cancelled) return;
      setStatus("loading");
      setCues([]);
    }, 0);

    fetch(`/api/ielts/listening/transcript?book=${bookNumber}&test=${testNumber}&section=${sectionNumber}`, { cache: "force-cache" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to load transcript");
        return response.text();
      })
      .then((text) => {
        if (cancelled) return;
        const parsed = parseVtt(text);
        setCues(parsed);
        setStatus(parsed.length > 0 ? "ready" : "empty");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
      });

    return () => {
      cancelled = true;
      window.clearTimeout(loadingTimer);
    };
  }, [bookNumber, testNumber, sectionNumber]);

  useEffect(() => {
    if (!activeCueId) return;
    const container = scrollContainerRef.current;
    const activeNode = cueRefs.current[activeCueId];
    if (!container || !activeNode) return;

    const containerRect = container.getBoundingClientRect();
    const activeRect = activeNode.getBoundingClientRect();
    const activeOffsetTop = activeRect.top - containerRect.top + container.scrollTop;
    const targetTop = activeOffsetTop - container.clientHeight / 2 + activeNode.offsetHeight / 2;
    const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);

    container.scrollTo({
      top: Math.min(maxScrollTop, Math.max(0, targetTop)),
      behavior: "smooth",
    });
  }, [activeCueId]);

  return (
    <div className="flex h-full flex-col rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-soft)]">
      <div className="border-b border-[var(--border)] p-4">
        <div className="text-sm font-semibold text-[var(--text)]">听力原文</div>
        <p className="mt-1 text-xs text-[var(--text-soft)]">Cambridge {bookNumber} · Test {testNumber} · Part {sectionNumber}</p>
      </div>
      <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
        {status === "loading" && <p className="text-sm text-[var(--text-soft)]">字幕加载中...</p>}
        {status === "empty" && <p className="text-sm text-[var(--text-soft)]">这个 Part 暂时没有字幕内容。</p>}
        {status === "error" && <p className="text-sm text-[var(--text-soft)]">字幕读取失败，请稍后重试。</p>}
        {status === "ready" && (
          <div className="space-y-3">
            {cues.map((cue) => {
              const active = cue.id === activeCueId;
              return (
                <button key={cue.id} ref={(node) => { cueRefs.current[cue.id] = node; }} type="button" onClick={() => onCueClick(cue.start)} className="grid w-full grid-cols-[3.5rem_1fr] gap-3 rounded-[var(--radius-sm)] px-1 py-1 text-left transition hover:text-[var(--primary)]">
                  <span className={cn("pt-0.5 text-xs tabular-nums text-[var(--text-faint)]", active && "font-semibold text-[var(--primary)]")}>{formatCueTime(cue.start)}</span>
                  <span className={cn("text-sm leading-7 text-[var(--text-soft)]", active && "font-semibold text-[var(--primary)]")}>{cue.text}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function QuestionOptionBank({ options }: { options: Record<string, unknown>[] }) {
  return (
    <div className="mx-auto mb-5 mt-3 w-fit max-w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-5 py-2.5 text-left text-sm leading-7 text-[var(--text)] shadow-[var(--shadow-sm)]">
      {options.map((option, index) => (
        <div key={`${stringValue(option, "id") || stringValue(option, "optionId") || index}`}>{stripHtml(optionText(option))}</div>
      ))}
    </div>
  );
}

function SourceQuestionList({ questions, fallbackNumbers, answers, onAnswerChange, hideTextInputs = false }: { questions: Record<string, unknown>[]; fallbackNumbers: number[]; answers: Answers; onAnswerChange: (questionNumber: string, value: string) => void; hideTextInputs?: boolean }) {
  const visibleQuestions = questions.filter((question) => !hideTextInputs || stringArrayValue(question, "option").length > 0);
  if (visibleQuestions.length === 0) return null;

  return (
    <div className="mt-4 space-y-4">
      {visibleQuestions.map((question, index) => {
        const label = stringValue(question, "questionNo") || stringValue(question, "sort") || `${fallbackNumbers[index] ?? index + 1}`;
        const title = stringValue(question, "title") || stringValue(question, "content");
        const options = stringArrayValue(question, "option");
        const cleanTitle = stripQuestionNumberPrefix(stripHtml(title), label);
        return (
          <div key={`${label}-${index}`} id={`listening-question-${label}`} data-listening-question className="scroll-mt-24">
            {options.length > 0 ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-baseline">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--success)] text-sm font-bold text-white">{label}</span>
                {cleanTitle && <span className="text-sm leading-7 text-[var(--text)]">{cleanTitle}</span>}
                <select value={answers[label] ?? ""} onChange={(event) => onAnswerChange(label, event.target.value)} className="h-9 min-w-28 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]">
                  <option value="">Select</option>
                  {options.map((option, optionIndex) => <option key={`${label}-${optionIndex}`} value={option}>{option}</option>)}
                </select>
              </div>
            ) : (
              <label className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-baseline">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--success)] text-sm font-bold text-white">{label}</span>
                {cleanTitle && <span className="text-sm leading-7 text-[var(--text)]">{cleanTitle}</span>}
                <input value={answers[label] ?? ""} placeholder={label} onChange={(event) => onAnswerChange(label, event.target.value)} className="h-9 min-w-40 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-3 text-center text-sm text-[var(--text)] outline-none transition placeholder:text-center placeholder:text-[var(--text-faint)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]" />
              </label>
            )}
          </div>
        );
      })}
    </div>
  );
}

function OptionQuestion({ questionNumber, options, value, onChange }: { questionNumber: string; options: Record<string, unknown>[]; value: string; onChange: (questionNumber: string, value: string) => void }) {
  return (
    <div className="mt-4 grid gap-2">
      {options.map((option, index) => {
        const text = optionText(option);
        return (
          <label key={`${questionNumber}-${index}`} className={cn("flex cursor-pointer items-start gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-2 text-sm text-[var(--text)] transition hover:border-[var(--primary)]", value === text && "border-[var(--primary)] bg-[var(--primary-soft)]")}>
            <input type="radio" name={`question-${questionNumber}`} value={text} checked={value === text} onChange={(event) => onChange(questionNumber, event.target.value)} className="mt-1" />
            <span>{stripHtml(text)}</span>
          </label>
        );
      })}
    </div>
  );
}

function AdminAnswerDetails({ question }: { question: IeltsQuestion }) {
  const answerRows = getInlineAnswerRows(question);
  const explanationRows = getInlineExplanationRows(question);
  if (answerRows.length === 0 && explanationRows.length === 0) return null;

  return (
    <div className="mt-5 space-y-3 text-sm">
      {answerRows.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer list-none font-semibold text-[var(--primary)] transition hover:opacity-80">答案</summary>
          <div className="mt-3 grid gap-2 text-[var(--text)]">
            {answerRows.map((row) => <div key={row.questionNumber} className="flex gap-2 leading-7"><span className="font-semibold text-[var(--text-soft)]">Q{row.questionNumber}</span><span>{row.answerText}</span></div>)}
          </div>
        </details>
      )}
      {explanationRows.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer list-none font-semibold text-[var(--primary)] transition hover:opacity-80">答案与解析</summary>
          <div className="mt-3 space-y-3 text-[var(--text-soft)]">
            {explanationRows.map((row) => <div key={row.questionNumber} className="leading-7"><span className="font-semibold text-[var(--text)]">Q{row.questionNumber}：</span>{row.explanation}</div>)}
          </div>
        </details>
      )}
    </div>
  );
}

const ReadingRichText = memo(function ReadingRichText({ html, compact = false }: { html?: string | null; compact?: boolean }) {
  if (!html) return null;
  return <div className={cn("reading-rich-text max-w-none text-[15px] leading-8 text-[var(--text)] antialiased [&_*]:!border-[var(--border)] [&_*]:!bg-transparent [&_*]:!text-[var(--text)] [&_a]:!text-[var(--primary)] [&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-[var(--radius-md)] [&_li]:my-1.5 [&_p]:my-3 [&_strong]:font-semibold [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:p-2.5 [&_th]:border [&_th]:p-2.5", compact && "text-sm leading-7")} dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(normalizeQuestionBlanks(html)) }} />;
});

const ReadingAnswerHtml = memo(function ReadingAnswerHtml({ html, answers, optionsByNumber, onAnswerChange }: { html: string; answers: Answers; optionsByNumber: Record<string, string[]>; onAnswerChange: (questionNumber: string, value: string) => void }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const commitTimersRef = useRef<Record<string, number>>({});
  const [markup] = useState(() => sanitizeRichHtml(injectAnswerInputs(formatQuestionContent(html), answers, optionsByNumber)));
  const [openSelect, setOpenSelect] = useState<{ number: string; options: string[]; top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const protectAnswerControl = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const control = target.closest<HTMLElement>("input[data-question-number], button[data-answer-select='true']");
      if (!control || !container.contains(control)) return;
      event.stopPropagation();
      if (control instanceof HTMLInputElement && (event.type === "mousedown" || event.type === "pointerdown" || event.type === "click")) {
        window.setTimeout(() => control.focus(), 0);
      }
    };

    const scheduleInputAnswer = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      const number = target.dataset.questionNumber;
      if (!number) return;
      if (commitTimersRef.current[number]) window.clearTimeout(commitTimersRef.current[number]);
      commitTimersRef.current[number] = window.setTimeout(() => {
        onAnswerChange(number, target.value);
        delete commitTimersRef.current[number];
      }, 500);
    };

    const commitInputAnswer = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      const number = target.dataset.questionNumber;
      if (!number) return;
      if (commitTimersRef.current[number]) {
        window.clearTimeout(commitTimersRef.current[number]);
        delete commitTimersRef.current[number];
      }
      onAnswerChange(number, target.value);
    };

    const protectedEvents = ["pointerdown", "mousedown", "mouseup", "click", "touchstart", "touchend", "keyup", "selectionchange"];
    protectedEvents.forEach((eventName) => container.addEventListener(eventName, protectAnswerControl, true));
    container.addEventListener("input", scheduleInputAnswer, true);
    container.addEventListener("change", commitInputAnswer, true);
    container.addEventListener("blur", commitInputAnswer, true);

    return () => {
      protectedEvents.forEach((eventName) => container.removeEventListener(eventName, protectAnswerControl, true));
      container.removeEventListener("input", scheduleInputAnswer, true);
      container.removeEventListener("change", commitInputAnswer, true);
      container.removeEventListener("blur", commitInputAnswer, true);
      Object.values(commitTimersRef.current).forEach((timer) => window.clearTimeout(timer));
      commitTimersRef.current = {};
    };
  }, [onAnswerChange]);

  function keepAnswerControlEventInside(event: React.SyntheticEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (target.closest("input, textarea, select, button, [data-answer-control='true']")) {
      event.stopPropagation();
    }
  }

  function handleSelectButtonClick(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    const button = target.closest<HTMLButtonElement>("[data-answer-select='true']");
    if (!button) return;

    const number = button.dataset.questionNumber;
    const options = number ? optionsByNumber[number] ?? [] : [];
    if (!number || options.length === 0) return;

    const rect = button.getBoundingClientRect();
    setOpenSelect((current) => current?.number === number ? null : {
      number,
      options,
      top: rect.bottom + 6,
      left: rect.left,
      width: Math.max(220, rect.width),
    });
  }

  function chooseSelectOption(option: string) {
    if (!openSelect) return;
    const button = document.querySelector<HTMLButtonElement>(`[data-answer-select='true'][data-question-number='${openSelect.number}']`);
    if (button) {
      button.textContent = option;
      button.dataset.selected = "true";
    }
    onAnswerChange(openSelect.number, option);
    setOpenSelect(null);
  }

  return (
    <>
      <div
        ref={containerRef}
        className="reading-rich-text max-w-none text-[15px] leading-8 text-[var(--text)] antialiased [&_*]:!text-[var(--text)] [&_a]:!text-[var(--primary)] [&_button[data-answer-select='true']]:!text-[var(--text)] [&_figure.table]:!mx-auto [&_figure.table]:!my-5 [&_figure.table]:!w-4/5 [&_figure.table]:!max-w-[80%] [&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-[var(--radius-md)] [&_input[data-question-number]]:!pointer-events-auto [&_input[data-question-number]]:!select-text [&_li]:my-1.5 [&_p]:my-3 [&_strong]:font-semibold [&_table]:!mx-auto [&_table]:!my-5 [&_table]:!w-full [&_table]:!table-fixed [&_table]:!border-collapse [&_table]:!border [&_table]:!border-[var(--border)] [&_td]:!border [&_td]:!border-[var(--border)] [&_td]:!p-3 [&_td]:!align-middle [&_th]:!border [&_th]:!border-[var(--border)] [&_th]:!bg-[var(--bg-soft)] [&_th]:!p-3 [&_th]:!text-left [&_th]:!font-semibold"
        onPointerDown={keepAnswerControlEventInside}
        onMouseDown={keepAnswerControlEventInside}
        onTouchStart={keepAnswerControlEventInside}
        onMouseUp={keepAnswerControlEventInside}
        onKeyUp={keepAnswerControlEventInside}
        onClick={(event) => {
          keepAnswerControlEventInside(event);
          handleSelectButtonClick(event);
        }}
        dangerouslySetInnerHTML={{ __html: markup }}
      />
      {openSelect && (
        <div className="fixed z-50 max-h-72 overflow-y-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-1 shadow-[var(--shadow-lg)]" style={{ top: openSelect.top, left: openSelect.left, width: openSelect.width }}>
          {openSelect.options.map((option) => (
            <button key={option} type="button" onClick={() => chooseSelectOption(option)} className="block w-full rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm leading-6 text-[var(--text)] transition hover:bg-[var(--bg-soft)] hover:text-[var(--primary)]">
              {option}
            </button>
          ))}
        </div>
      )}
    </>
  );
}, (previous, next) => previous.html === next.html && optionMapSignature(previous.optionsByNumber) === optionMapSignature(next.optionsByNumber));

function optionMapSignature(optionsByNumber: Record<string, string[]>) {
  return Object.keys(optionsByNumber)
    .sort((a, b) => Number(a) - Number(b))
    .map((number) => `${number}:${(optionsByNumber[number] ?? []).join("\u0001")}`)
    .join("\u0002");
}

function PartNavigator({ part, active, answers, onPartClick, onQuestionClick }: { part: ListeningPart; active: boolean; answers: Answers; onPartClick: () => void; onQuestionClick: (questionNumber: number) => void }) {
  const answered = part.numbers.filter((number) => answers[`${number}`]).length;
  return (
    <div role="button" tabIndex={0} onClick={onPartClick} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onPartClick(); } }} className={cn("min-w-[min(22rem,78vw)] flex-1 cursor-pointer rounded-[var(--radius-md)] border bg-[var(--card)] px-3 py-2 transition hover:border-[var(--primary)] lg:min-w-0", active ? "border-[var(--primary)] shadow-[var(--shadow-sm)]" : "border-[var(--border)]")}>
      <div className={cn("flex items-center justify-between gap-2", active && "mb-2")}>
        <div className={cn("text-sm font-bold transition", active ? "text-[var(--primary)]" : "text-[var(--text)]")}>Part {part.displayNumber}</div>
        <div className="text-xs text-[var(--text-soft)]">{answered} of {part.numbers.length} questions</div>
      </div>
      {active && <div className="flex flex-nowrap gap-1.5 overflow-x-auto pb-0.5">
        {part.numbers.map((number) => <button key={number} type="button" onClick={(event) => { event.stopPropagation(); onQuestionClick(number); }} className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs transition", answers[`${number}`] ? "border-[var(--success)] bg-[var(--success)] text-white" : "border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text-soft)] hover:border-[var(--primary)] hover:text-[var(--primary)]")}>{number}</button>)}
      </div>}
    </div>
  );
}

function NotesDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <aside data-notes-drawer className={cn("fixed bottom-0 right-0 top-0 z-50 flex w-[min(28rem,88vw)] flex-col border-l border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-lg)] transition-transform duration-300 ease-out sm:top-0", open ? "translate-x-0" : "pointer-events-none translate-x-full")}>
      <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
        <div>
          <div className="flex items-center gap-2 text-base font-semibold text-[var(--text)]"><PanelRightOpen size={18} className="text-[var(--primary)]" />记笔记</div>
          <p className="mt-1 text-xs text-[var(--text-soft)]">当前只保存在页面内，刷新后会丢失。</p>
        </div>
        <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-soft)] transition hover:text-[var(--primary)]"><X size={17} /></button>
      </div>
      <textarea className="min-h-0 flex-1 resize-none bg-[var(--bg)] p-4 text-sm leading-7 text-[var(--text)] outline-none" placeholder="记录关键词、定位句、错题原因..." />
    </aside>
  );
}

function ReviewDialog({ answers, officialAnswers, onClose }: { answers: Answers; officialAnswers: Record<string, string>; onClose: () => void }) {
  const [showOfficialAnswers, setShowOfficialAnswers] = useState(false);
  const [tooltip, setTooltip] = useState<{ value: string; top: number; left: number } | null>(null);

  function showTooltip(value: string, rect: DOMRect) {
    setTooltip({
      value,
      top: Math.min(window.innerHeight - 96, rect.bottom + 8),
      left: Math.min(window.innerWidth - 272, Math.max(12, rect.left)),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <div className="max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-lg)] sm:p-7">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="text-center sm:flex-1">
            <h2 className="text-xl font-bold text-[var(--text)]">Review your answers</h2>
            <p className="mt-2 text-sm text-[var(--text-soft)]">这个窗口只用于检查作答情况，不能在这里修改答案。</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" size="sm" variant={showOfficialAnswers ? "primary" : "secondary"} onClick={() => setShowOfficialAnswers((value) => !value)} className="rounded-full">显示答案</Button>
            <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-soft)] transition hover:bg-[var(--bg-soft)] hover:text-[var(--primary)]"><X size={20} /></button>
          </div>
        </div>
        <div className="grid grid-cols-2 border border-[var(--border)] sm:grid-cols-4">
          {Array.from({ length: 40 }, (_, index) => index + 1).map((number) => {
            const studentAnswer = answers[`${number}`] || "未作答";
            const officialAnswer = officialAnswers[`${number}`] || "暂无答案";
            return (
              <div key={number} className="min-h-16 overflow-hidden border-b border-r border-[var(--border)] px-3 py-2 text-sm text-[var(--text-soft)]">
                <div className="font-semibold text-[var(--primary)]">Q{number}</div>
                <div className="mt-1 flex items-start gap-1.5 text-xs leading-5">
                  <ReviewAnswerText value={studentAnswer} className={answers[`${number}`] ? "text-[var(--text)]" : "font-semibold text-red-500"} onShowTooltip={showTooltip} onHideTooltip={() => setTooltip(null)} />
                  {showOfficialAnswers && <><span className="text-[var(--text-faint)]">|</span><ReviewAnswerText value={officialAnswer} className="text-[var(--text)]" onShowTooltip={showTooltip} onHideTooltip={() => setTooltip(null)} /></>}
                </div>
              </div>
            );
          })}
        </div>
        {tooltip && <ReviewTooltip value={tooltip.value} top={tooltip.top} left={tooltip.left} />}
        <div className="mt-6 flex justify-center">
          <Button type="button" onClick={onClose} className="min-w-44 rounded-full">Close</Button>
        </div>
      </div>
    </div>
  );
}

function ReviewAnswerText({ value, className, onShowTooltip, onHideTooltip }: { value: string; className?: string; onShowTooltip: (value: string, rect: DOMRect) => void; onHideTooltip: () => void }) {
  return (
    <span
      className="min-w-0 flex-1"
      onMouseEnter={(event) => onShowTooltip(value, event.currentTarget.getBoundingClientRect())}
      onMouseLeave={onHideTooltip}
      onFocus={(event) => onShowTooltip(value, event.currentTarget.getBoundingClientRect())}
      onBlur={onHideTooltip}
      tabIndex={0}
    >
      <span className={cn("line-clamp-2 break-words", className)}>{value}</span>
    </span>
  );
}

function ReviewTooltip({ value, top, left }: { value: string; top: number; left: number }) {
  return (
    <div className="pointer-events-none fixed z-[70] max-w-64 whitespace-normal rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs leading-5 text-[var(--text)] shadow-[var(--shadow-lg)]" style={{ top, left }}>
      {value}
    </div>
  );
}

function selectSectionAudios(assets: IeltsAsset[], sections: IeltsSection[]) {
  const audioAssets = dedupeAssets(assets.filter((asset) => asset.asset_type === "audio" && getListeningAssetUrl(asset)));
  if (audioAssets.length <= 4) return audioAssets;
  const fullAudio = audioAssets.find((asset) => assetMatchesRawSectionAudio(asset, sections)) ?? [...audioAssets].sort((a, b) => metadataBytes(b) - metadataBytes(a))[0];
  return audioAssets.filter((asset) => asset.id !== fullAudio.id).slice(0, 4);
}

function getListeningAssetUrl(asset: IeltsAsset) {
  return normalizePublicStorageUrl(asset.public_url || asset.storage_path, asset.bucket || "ielts");
}

function assetMatchesRawSectionAudio(asset: IeltsAsset, sections: IeltsSection[]) {
  const assetName = fileNameFromUrl(asset.storage_path || asset.public_url || "");
  return sections.some((section) => fileNameFromUrl(stringValue(section.raw_data, "audio")) === assetName);
}

function fileNameFromUrl(value: string) {
  if (!value) return "";
  return value.split("?")[0]?.split("/").pop() ?? "";
}

function dedupeAssets(assets: IeltsAsset[]) {
  const seen = new Set<string>();
  return assets.filter((asset) => {
    const key = asset.storage_path || asset.public_url || asset.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function metadataBytes(asset: IeltsAsset) {
  const value = asset.metadata.bytes;
  return typeof value === "number" ? value : 0;
}

function questionNumbers(question: IeltsQuestion) {
  const end = question.question_number_end && question.question_number_end >= question.question_number_start ? question.question_number_end : question.question_number_start;
  return Array.from({ length: end - question.question_number_start + 1 }, (_, index) => question.question_number_start + index);
}

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function parseVtt(source: string): TranscriptCue[] {
  return source
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((block, index) => {
      const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
      if (lines.length === 0 || lines[0] === "WEBVTT") return null;
      const timeLineIndex = lines.findIndex((line) => line.includes("-->"));
      if (timeLineIndex < 0) return null;
      const [startRaw, endRaw] = lines[timeLineIndex].split("-->").map((value) => value.trim().split(/\s+/)[0]);
      const start = parseCueTimestamp(startRaw);
      const end = parseCueTimestamp(endRaw);
      const text = lines.slice(timeLineIndex + 1).join(" ").replace(/<[^>]*>/g, "").trim();
      return Number.isFinite(start) && Number.isFinite(end) && text ? { id: `${index}-${start}`, start, end, text } : null;
    })
    .filter((cue): cue is TranscriptCue => Boolean(cue));
}

function parseCueTimestamp(value: string) {
  const parts = value.split(":");
  const seconds = Number(parts.pop());
  const minutes = Number(parts.pop() ?? 0);
  const hours = Number(parts.pop() ?? 0);
  return hours * 3600 + minutes * 60 + seconds;
}

function formatCueTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function injectAnswerInputs(html: string, answers: Answers, optionsByNumber: Record<string, string[]> = {}) {
  return normalizeQuestionBlanks(html).replace(/_____(\d{1,3})______/g, (_, number: string) => {
    const value = escapeHtmlAttribute(answers[number] ?? "");
    const options = optionsByNumber[number] ?? [];
    if (options.length > 0) {
      const label = value || number;
      return `<span data-answer-control="true" class="relative z-10 mx-1 inline-flex items-baseline align-baseline"><button type="button" data-answer-control="true" data-answer-select="true" data-question-number="${number}" data-selected="${value ? "true" : "false"}" class="relative z-10 min-h-8 min-w-24 align-baseline rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-3 text-center text-sm leading-7 outline-none transition hover:border-[var(--primary)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]">${escapeHtml(label)}</button></span>`;
    }
    return `<span data-answer-control="true" class="relative z-10 mx-1 inline-flex items-baseline align-baseline"><input data-answer-control="true" data-question-number="${number}" value="${value}" placeholder="${number}" autocomplete="off" class="relative z-10 h-8 min-w-32 align-baseline rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-3 text-center text-sm leading-8 text-[var(--text)] outline-none placeholder:text-center placeholder:text-[var(--text-faint)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]" /></span>`;
  });
}

function formatQuestionContent(value: string) {
  const normalized = normalizeQuestionBlanks(value);
  if (hasHtmlMarkup(normalized)) return normalized;

  const lines = normalized.replace(/\r\n?/g, "\n").split("\n").map((line) => line.trimEnd());
  const chunks: string[] = [];
  let index = 0;
  let pendingTableTitle: string | null = null;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }

    if (line.includes("\t")) {
      const tableLines: string[] = [];
      while (index < lines.length && lines[index].includes("\t")) {
        tableLines.push(lines[index]);
        index += 1;
      }
      chunks.push(renderPlainTextTable(tableLines, pendingTableTitle));
      pendingTableTitle = null;
      continue;
    }

    if (/^\*{0,2}Questions?\s+\d{1,2}\s*[–-]\s*\d{1,2}\*{0,2}$/i.test(line)) {
      index += 1;
      continue;
    }

    if (pendingTableTitle) {
      chunks.push(`<h4 style="margin:1.25rem 0 0.75rem;text-align:center;font-size:1.25rem;font-weight:700;color:var(--text);">${formatInlineMarkdown(pendingTableTitle)}</h4>`);
      pendingTableTitle = null;
    }

    if (/^\*\*.+\*\*$/.test(line)) {
      const nextTableLine = lines.slice(index + 1).find((item) => item.trim());
      if (nextTableLine?.includes("\t")) {
        pendingTableTitle = line;
      } else {
        chunks.push(`<h4 style="margin:1.25rem 0 0.75rem;text-align:center;font-size:1.25rem;font-weight:700;color:var(--text);">${formatInlineMarkdown(line)}</h4>`);
      }
    } else {
      chunks.push(`<p>${formatInlineMarkdown(line)}</p>`);
    }
    index += 1;
  }

  if (pendingTableTitle) {
    chunks.push(`<h4 style="margin:1.25rem 0 0.75rem;text-align:center;font-size:1.25rem;font-weight:700;color:var(--text);">${formatInlineMarkdown(pendingTableTitle)}</h4>`);
  }

  return chunks.join("");
}

function renderPlainTextTable(lines: string[], title?: string | null) {
  const rawRows = lines.map((line) => line.split("\t").map((cell) => cell.trim()));
  const maxCols = Math.max(1, ...rawRows.map((row) => row.length));
  const rows = rawRows.map((row, rowIndex) => {
    const normalizedRow = rowIndex === 0 && row.length === maxCols - 1 ? ["", ...row] : row;
    return Array.from({ length: maxCols }, (_, cellIndex) => normalizedRow[cellIndex] ?? "");
  });
  const tableStyle = "width:80% !important;min-width:80% !important;max-width:80% !important;border-collapse:collapse;table-layout:fixed;margin:1.25rem auto;color:var(--text);";
  const titleStyle = "border:1px solid var(--border);padding:0.9rem;text-align:center;font-size:1.35rem;font-weight:800;background:var(--card);color:var(--text);";
  const thStyle = "border:1px solid var(--border);padding:0.75rem;vertical-align:top;text-align:left;font-weight:700;background:var(--bg-soft);color:var(--text);line-height:1.65;";
  const tdStyle = "border:1px solid var(--border);padding:0.75rem;vertical-align:middle;color:var(--text);line-height:1.75;";
  const widths = maxCols === 3 ? ["22%", "48%", "30%"] : maxCols === 2 ? ["52%", "48%"] : Array.from({ length: maxCols }, () => `${100 / maxCols}%`);
  const colgroup = `<colgroup>${widths.map((width) => `<col style="width:${width};" />`).join("")}</colgroup>`;
  const titleRow = title ? `<thead><tr><th colspan="${maxCols}" style="${titleStyle}">${formatInlineMarkdown(title)}</th></tr></thead>` : "";
  const bodyRows = rows.map((row, rowIndex) => `<tr>${row.map((cell) => rowIndex === 0 ? `<th style="${thStyle}">${formatInlineMarkdown(cell)}</th>` : `<td style="${tdStyle}">${formatInlineMarkdown(cell)}</td>`).join("")}</tr>`).join("");
  return `<div style="width:100%;overflow-x:auto;"><table class="ielts-listening-table" style="${tableStyle}">${colgroup}${titleRow}<tbody>${bodyRows}</tbody></table></div>`;
}

function formatInlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function normalizeQuestionBlanks(value: string) {
  return decodeHtmlEntities(value)
    .replace(/#{2,}\s*-\s*(\d{1,3})\s*-\s*#{2,}/g, "_____$1______")
    .replace(/(\d{1,3})\s*\[blank\]\s*\[\/blank\]/gi, "_____$1______")
    .replace(/\[blank\]\s*(\d{1,3})\s*\[\/blank\]/gi, "_____$1______")
    .replace(/\[blank\]\s*\[\/blank\]\s*(\d{1,3})/gi, "_____$1______")
    .replace(/\[blank\]\s*\[\/blank\]/gi, "______");
}

function hasQuestionBlanks(value: string) {
  return /#{2,}\s*-\s*\d{1,3}\s*-\s*#{2,}/.test(value) || /\[blank\]\s*\[\/blank\]/i.test(value) || /_{3,}\s*\d{1,3}\s*_{3,}/.test(value);
}

function removeDuplicateQuestionHeading(html: string, range: string) {
  if (!html) return "";
  const normalizedRange = range.replace("-", "[–-]");
  return html
    .replace(new RegExp(`(?:LISTENING\\s*)?Questions\\s+${normalizedRange}\\s*\\d*\\s*Questions\\s+${normalizedRange}`, "i"), `Questions ${range}`)
    .replace(new RegExp(`^\\s*\\*{0,2}Questions?\\s+${normalizedRange}\\*{0,2}\\s*`, "i"), "");
}

function getOfficialAnswerRows(question: IeltsQuestion, answer: IeltsAnswer) {
  const items = arrayValue(answer.answer_data as Record<string, unknown>, "answers");
  return items.map((item, index) => {
    const questionNumber = stringValue(item, "question_no") || stringValue(item, "questionNo") || `${question.question_number_start + index}`;
    return {
      questionNumber,
      answerText: resolveOfficialAnswerText(question, answer, item),
    };
  });
}

function resolveOfficialAnswerText(question: IeltsQuestion, answer: IeltsAnswer, item: Record<string, unknown>) {
  const direct = stringValue(item, "answer_value") || stringValue(item, "answerValue") || stringValue(item, "answer_text") || stringValue(item, "answerText") || stringValue(item, "value");
  if (direct) return stripHtml(direct);

  const optionIds = officialOptionIds(item);
  if (optionIds.length > 0) {
    const options = [...question.options, ...arrayValue(answer.answer_data as Record<string, unknown>, "options")];
    const matched = optionIds.map((id) => {
      const option = options.find((candidate) => {
        const candidateIds = [stringValue(candidate, "id"), stringValue(candidate, "option_id"), stringValue(candidate, "optionId"), stringValue(candidate, "value")].filter(Boolean);
        return candidateIds.includes(id);
      });
      return option ? stripHtml(optionText(option)) : "";
    }).filter(Boolean);
    if (matched.length > 0) return matched.join(", ");
  }

  const fallback = stringValue(item, "answer") || stringValue(item, "correct_answer") || stringValue(item, "correctAnswer");
  return fallback ? stripHtml(fallback) : "未提供";
}

function getInlineAnswerRows(question: IeltsQuestion) {
  const sourceQuestions = arrayValue(question.content, "questions");
  return sourceQuestions.map((sourceQuestion, index) => {
    const questionNumber = stringValue(sourceQuestion, "questionNo") || stringValue(sourceQuestion, "sort") || `${question.question_number_start + index}`;
    const answerText = getAnswerTextFromOptionIds(question.options, officialOptionIds(sourceQuestion));
    return answerText ? { questionNumber, answerText } : null;
  }).filter((row): row is { questionNumber: string; answerText: string } => Boolean(row));
}

function getInlineExplanationRows(question: IeltsQuestion) {
  const sourceQuestions = arrayValue(question.content, "questions");
  return sourceQuestions.map((sourceQuestion, index) => {
    const explanation = stringValue(sourceQuestion, "answerExplain");
    const questionNumber = stringValue(sourceQuestion, "questionNo") || stringValue(sourceQuestion, "sort") || `${question.question_number_start + index}`;
    return explanation ? { questionNumber, explanation } : null;
  }).filter((row): row is { questionNumber: string; explanation: string } => Boolean(row));
}

function getAnswerTextFromOptionIds(options: Record<string, unknown>[], optionIds: string[]) {
  if (optionIds.length === 0) return "";
  return optionIds.map((id) => {
    const option = options.find((candidate) => {
      const candidateIds = [stringValue(candidate, "id"), stringValue(candidate, "option_id"), stringValue(candidate, "optionId"), stringValue(candidate, "value")].filter(Boolean);
      return candidateIds.includes(id);
    });
    return option ? stripHtml(optionText(option)) : "";
  }).filter(Boolean).join(" / ");
}

function officialOptionIds(item: Record<string, unknown>) {
  const raw = stringValue(item, "option_ids") || stringValue(item, "optionIds") || stringValue(item, "option_id") || stringValue(item, "optionId");
  return raw.split(/[,|\s]+/).map((value) => value.trim()).filter(Boolean);
}

function arrayValue(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item)) : [];
}

function stringArrayValue(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (Array.isArray(value)) return value.map((item) => typeof item === "string" || typeof item === "number" ? `${item}` : "").filter(Boolean);
  if (typeof value === "string" || typeof value === "number") return [`${value}`];
  return [];
}

function stringValue(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (typeof value === "string") return value;
  if (typeof value === "number") return `${value}`;
  return "";
}

function optionText(option: Record<string, unknown>) {
  return stringValue(option, "title") || stringValue(option, "content") || stringValue(option, "value") || stringValue(option, "label") || stringValue(option, "text") || stringValue(option, "name");
}

function getBlankSelectOptions(pageContent: string, options: Record<string, unknown>[], inferredOptions: string[]) {
  const blankNumbers = questionBlankNumbers(pageContent);
  const selectOptions = options.length > 0 ? options.map((option) => stripHtml(optionText(option))).filter(Boolean) : inferredOptions;
  if (blankNumbers.length === 0 || selectOptions.length === 0) return {};
  return Object.fromEntries(blankNumbers.map((number) => [`${number}`, selectOptions]));
}

function inferQuestionOptions(question: IeltsQuestion, sectionDesc: string, pageContent: string) {
  const text = stripHtml(`${question.prompt ?? ""} ${question.instruction ?? ""} ${sectionDesc} ${pageContent}`);
  const upperText = text.toUpperCase();
  if (upperText.includes("TRUE") && upperText.includes("FALSE") && upperText.includes("NOT GIVEN")) return ["TRUE", "FALSE", "NOT GIVEN"];
  if (upperText.includes("YES") && upperText.includes("NO") && upperText.includes("NOT GIVEN")) return ["YES", "NO", "NOT GIVEN"];
  return inferLetterOptions(text);
}

function inferLetterOptions(text: string) {
  const rangeMatch = text.match(/\b([A-Z])\s*[–-]\s*([A-Zl])\b/);
  if (rangeMatch) {
    const start = rangeMatch[1].toUpperCase();
    const rawEnd = rangeMatch[2];
    const end = rawEnd === "l" ? "I" : rawEnd.toUpperCase();
    const options = letterRange(start, end);
    if (options.length >= 2 && options.length <= 12) return options;
  }

  const commaMatch = text.match(/\b([A-Z](?:\s*,\s*[A-Z])+(?:\s*,?\s*or\s*[A-Z])?)\b/i);
  if (!commaMatch) return [];
  const options = commaMatch[1].split(/\s*,\s*|\s+or\s+/i).map((value) => value.trim().toUpperCase()).filter((value) => /^[A-Z]$/.test(value));
  return [...new Set(options)];
}

function letterRange(start: string, end: string) {
  const startCode = start.charCodeAt(0);
  const endCode = end.charCodeAt(0);
  if (startCode > endCode) return [];
  return Array.from({ length: endCode - startCode + 1 }, (_, index) => String.fromCharCode(startCode + index));
}

function questionBlankNumbers(value: string) {
  return [...normalizeQuestionBlanks(value).matchAll(/_____(\d{1,3})______/g)].map((match) => Number(match[1])).filter(Number.isFinite);
}

function questionInstructionKey(question: IeltsQuestion) {
  const instruction = stringValue(question.content, "section_desc") || question.instruction || "";
  const normalized = stripHtml(instruction).toLowerCase();
  return normalized.length > 20 ? normalized : "";
}

function isQuestionRangeHeading(value: string) {
  return /^Questions?\s*\d{1,2}\s*[–-]\s*\d{1,2}$/i.test(value.trim()) || /^Questions?\s*\d{1,2}$/i.test(value.trim());
}

function stripQuestionNumberPrefix(value: string, label: string) {
  return value
    .replace(/^\s*\d{1,2}\s*[–-]\s*\d{1,2}\s*[.)：:]?\s*/, "")
    .replace(new RegExp(`^\\s*${escapeRegExp(label)}\\s*[.)：:]?\\s*`), "")
    .replace(/^\s*Write the correct letters? in boxes? \d{1,2}(?:\s*(?:and|[–-])\s*\d{1,2})? on your answer sheet\.?\s*/i, "")
    .trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isJudgementOptions(options: Record<string, unknown>[]) {
  const values = options.map((option) => stripOptionLabel(optionText(option)).toUpperCase());
  const hasNotGiven = values.includes("NOT GIVEN");
  const isTrueFalse = values.includes("TRUE") && values.includes("FALSE");
  const isYesNo = values.includes("YES") && values.includes("NO");
  return hasNotGiven && (isTrueFalse || isYesNo);
}

function stripOptionLabel(value: string) {
  return stripHtml(value).replace(/^[A-Z]\s*[.)]\s*/i, "").trim();
}

function isMatchingOptionBank(question: IeltsQuestion, sectionDesc: string, pageContent: string) {
  const text = `${question.question_type} ${question.prompt ?? ""} ${question.instruction ?? ""} ${sectionDesc} ${pageContent}`.toLowerCase();
  return text.includes("list of people") || text.includes("list of headings") || text.includes("list of researchers") || text.includes("answers from the box") || text.includes("from the box") || text.includes("move it into the gap") || text.includes("match each") || text.includes("matching");
}

function getOptionLetterValues(options: Record<string, unknown>[]) {
  return options.map((option) => stripHtml(optionText(option)).match(/^([A-Z])\s*[.)]?\s+/)?.[1] ?? "").filter(Boolean);
}

function isFillInBlankAnswerBank(question: IeltsQuestion, pageContent: string, sectionDesc: string) {
  const text = `${question.question_type} ${question.prompt ?? ""} ${question.instruction ?? ""} ${sectionDesc} ${pageContent}`.toLowerCase();
  if (hasQuestionBlanks(pageContent)) {
    return text.includes("one word") || text.includes("two words") || text.includes("three words") || text.includes("word and/or a number") || text.includes("no more than");
  }
  if (question.question_type === "11") return true;
  return text.includes("complete the") && !text.includes("choose");
}

function isEmptyLetterOption(value: string) {
  return /^[A-Z][.)]?$/i.test(stripHtml(value));
}

function stripHtml(value: string) {
  return decodeHtmlEntities(normalizeQuestionBlanks(value).replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(value: string) {
  return value.replace(/&nbsp;|&#160;|&#xA0;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, "\"").replace(/&#39;|&apos;/gi, "'");
}

function escapeHtmlAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function hasHtmlMarkup(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}
