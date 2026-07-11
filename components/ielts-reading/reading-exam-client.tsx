"use client";

import { memo, type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, ClipboardPenLine, Expand, ListChecks, PanelRightOpen, SendHorizontal, X } from "lucide-react";

import { IeltsSubmitDialog } from "@/components/ielts-practice/ielts-submit-dialog";
import { BrandMark } from "@/components/site/brand-mark";
import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { BRAND_NAME_CN } from "@/lib/brand";
import { buildIeltsSubmitResult } from "@/lib/ielts/answer-scoring";
import type { IeltsAnswer, IeltsBookPracticeData, IeltsQuestion, IeltsSection } from "@/lib/ielts/practice";
import { cn } from "@/lib/utils";

type Props = {
  data: IeltsBookPracticeData;
  selectedTestNumber: number;
  isAdmin?: boolean;
};

type Answers = Record<string, string>;

type PartModel = {
  section: IeltsSection;
  displayNumber: number;
  questions: IeltsQuestion[];
  numbers: number[];
};

type SelectionToolbarState = {
  top: number;
  left: number;
};

type SelectionFormat = "bold" | "underline" | "yellow" | "red" | "blue";
type TimeNotice = "five-minutes" | "time-up" | null;

const READING_DURATION_SECONDS = 60 * 60;
const FIVE_MINUTES_SECONDS = 5 * 60;

export function IeltsReadingExamClient({ data, selectedTestNumber, isAdmin = false }: Props) {
  const examRef = useRef<HTMLDivElement | null>(null);
  const splitRef = useRef<HTMLDivElement | null>(null);
  const passagePanelRef = useRef<HTMLElement | null>(null);
  const questionPanelRef = useRef<HTMLDivElement | null>(null);
  const navFadeTimerRef = useRef<number | null>(null);
  const selectionRangeRef = useRef<Range | null>(null);
  const formatHistoryRef = useRef<HTMLElement[][]>([]);
  const fiveMinuteWarningShownRef = useRef(false);
  const timeUpShownRef = useRef(false);
  const [answers, setAnswers] = useState<Answers>({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timeNotice, setTimeNotice] = useState<TimeNotice>(null);
  const [splitPercent, setSplitPercent] = useState(50);
  const [activePartIndex, setActivePartIndex] = useState(0);
  const [notesOpen, setNotesOpen] = useState(false);
  const [selectionToolbar, setSelectionToolbar] = useState<SelectionToolbarState | null>(null);
  const [canUndoFormat, setCanUndoFormat] = useState(false);
  const [navActive, setNavActive] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [submitDialogMode, setSubmitDialogMode] = useState<"confirm" | "result" | null>(null);
  const [submitNotice, setSubmitNotice] = useState("");

  const readingModule = data.modules.find((module) => module.module_type === "reading");
  const sections = useMemo(() => readingModule ? data.sections.filter((section) => section.module_id === readingModule.id).sort((a, b) => a.sort_order - b.sort_order) : [], [data.sections, readingModule]);
  const parts = useMemo<PartModel[]>(() => sections.map((section, index) => {
    const questions = data.questions.filter((question) => question.section_id === section.id).sort((a, b) => a.sort_order - b.sort_order);
    const numbers = [...new Set(questions.flatMap(questionNumbers))].sort((a, b) => a - b);
    return { section, displayNumber: index + 1, questions, numbers };
  }), [data.questions, sections]);
  const activePart = useMemo(() => parts[activePartIndex] ?? parts[0] ?? null, [activePartIndex, parts]);
  const officialAnswerByNumber = useMemo(() => {
    const readingQuestions = parts.flatMap((part) => part.questions);
    const questionById = new Map(readingQuestions.map((question) => [question.id, question]));
    const rows = data.answers.flatMap((answer) => {
      const question = questionById.get(answer.question_id);
      return question ? getOfficialAnswerRows(question, answer) : [];
    });
    return Object.fromEntries(rows.map((row) => [row.questionNumber, row.answerText]));
  }, [data.answers, parts]);
  const remainingSeconds = Math.max(0, READING_DURATION_SECONDS - elapsedSeconds);
  const overtimeSeconds = Math.max(0, elapsedSeconds - READING_DURATION_SECONDS);
  const isOvertime = elapsedSeconds >= READING_DURATION_SECONDS;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsedSeconds((value) => {
        const next = value + 1;
        const nextRemaining = Math.max(0, READING_DURATION_SECONDS - next);
        if (!fiveMinuteWarningShownRef.current && nextRemaining <= FIVE_MINUTES_SECONDS && nextRemaining > 0) {
          fiveMinuteWarningShownRef.current = true;
          setTimeNotice("five-minutes");
        }
        if (!timeUpShownRef.current && next >= READING_DURATION_SECONDS) {
          timeUpShownRef.current = true;
          setTimeNotice("time-up");
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    passagePanelRef.current?.scrollTo({ top: 0 });
    questionPanelRef.current?.scrollTo({ top: 0 });
    selectionRangeRef.current = null;
    const frame = window.requestAnimationFrame(() => setSelectionToolbar(null));
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
    setAnswers((current) => ({ ...current, [questionNumber]: value }));
  }

  async function toggleFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    await examRef.current?.requestFullscreen();
  }

  function startResize(event: React.PointerEvent<HTMLButtonElement>) {
    const container = splitRef.current;
    if (!container) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = container.getBoundingClientRect();
    const update = (clientX: number) => {
      const next = ((clientX - rect.left) / rect.width) * 100;
      setSplitPercent(Math.min(66, Math.max(34, next)));
    };
    update(event.clientX);
  }

  function resizeMove(event: React.PointerEvent<HTMLButtonElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const rect = splitRef.current?.getBoundingClientRect();
    if (!rect) return;
    const next = ((event.clientX - rect.left) / rect.width) * 100;
    setSplitPercent(Math.min(66, Math.max(34, next)));
  }

  function scrollToPart(partIndex: number) {
    const part = parts[partIndex];
    if (!part) return;
    setActivePartIndex(partIndex);
  }

  function scrollToQuestion(questionNumber: number) {
    const partIndex = parts.findIndex((item) => item.numbers.includes(questionNumber));
    const part = partIndex >= 0 ? parts[partIndex] : null;
    if (part) setActivePartIndex(partIndex);
    window.setTimeout(() => {
      document.getElementById(`reading-question-${questionNumber}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (part) document.getElementById(`reading-passage-${part.displayNumber}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  function scrollQuestionStep(direction: 1 | -1) {
    pulseQuestionNav();
    const panel = questionPanelRef.current;
    if (!panel) return;
    const items = [...panel.querySelectorAll<HTMLElement>("[data-reading-question]")];
    if (items.length === 0) return;
    const panelRect = panel.getBoundingClientRect();
    const center = panelRect.top + panelRect.height / 2;
    const closestIndex = items.reduce((best, item, index) => Math.abs(item.getBoundingClientRect().top - center) < Math.abs(items[best].getBoundingClientRect().top - center) ? index : best, 0);
    items[Math.min(items.length - 1, Math.max(0, closestIndex + direction))]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function showSelectionToolbar() {
    const selection = document.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      hideSelectionToolbar();
      return;
    }
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    if (!examRef.current?.contains(container) || isInteractiveSelection(container)) {
      hideSelectionToolbar();
      return;
    }
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      hideSelectionToolbar();
      return;
    }
    selectionRangeRef.current = range.cloneRange();
    setSelectionToolbar({
      top: Math.min(window.innerHeight - 58, rect.bottom + 8),
      left: Math.min(window.innerWidth - 132, Math.max(12, rect.left + rect.width / 2)),
    });
  }

  function hideSelectionToolbar() {
    selectionRangeRef.current = null;
    setSelectionToolbar(null);
  }

  function applySelectionFormat(format: SelectionFormat) {
    const range = selectionRangeRef.current;
    if (!range) return;
    let changed: HTMLElement[] = [];
    if (format === "bold") changed = applyTextFormat(range, { tagName: "strong" });
    if (format === "underline") changed = applyTextFormat(range, { textDecoration: "underline" });
    if (format === "yellow") changed = applyTextFormat(range, { backgroundColor: "#fef08a" });
    if (format === "red") changed = applyTextFormat(range, { backgroundColor: "#fecaca" });
    if (format === "blue") changed = applyTextFormat(range, { backgroundColor: "#bfdbfe" });
    if (changed.length > 0) {
      formatHistoryRef.current.push(changed);
      setCanUndoFormat(true);
    }
    document.getSelection()?.removeAllRanges();
    hideSelectionToolbar();
  }

  function undoLastSelectionFormat() {
    const last = formatHistoryRef.current.pop();
    if (!last) return;
    last.slice().reverse().forEach(unwrapFormatElement);
    setCanUndoFormat(formatHistoryRef.current.length > 0);
    hideSelectionToolbar();
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

  function handleSubmit() {
    const result = buildIeltsSubmitResult("reading", answers, officialAnswerByNumber);
    setSubmitDialogMode(result.unanswered.length > 0 ? "confirm" : "result");
  }

  const splitStyle = { "--left-width": `${splitPercent}%`, "--right-width": `${100 - splitPercent}%` } as CSSProperties & Record<"--left-width" | "--right-width", string>;

  if (!data.book || !readingModule) {
    return (
      <main className="container-main py-6">
        <Link href="/ielts/reading" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-soft)] transition hover:text-[var(--primary)]"><ArrowLeft size={16} />返回阅读练习</Link>
        <div className="mt-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-6 text-sm text-[var(--text-soft)]">这套书暂时没有阅读数据。</div>
      </main>
    );
  }

  return (
    <div ref={examRef} onPointerDownCapture={closeNotesFromOutside} onMouseUp={showSelectionToolbar} onTouchEnd={showSelectionToolbar} onKeyUp={showSelectionToolbar} className={cn("min-h-screen bg-[var(--bg)] text-[var(--text)] transition-[padding] duration-300 ease-out", notesOpen && "lg:pr-[28rem]")}>
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--card)]/95 shadow-[var(--shadow-sm)] backdrop-blur">
        <div className="grid min-h-16 gap-3 px-3 py-3 sm:px-5 lg:grid-cols-[minmax(220px,1fr)_auto_minmax(420px,1fr)] lg:items-center">
          <div className="flex items-center gap-3">
            <Link href={`/ielts/reading?book=${data.book.book_number}`} className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text-soft)] transition hover:text-[var(--primary)]"><ArrowLeft size={17} /></Link>
            <BrandMark size="sm" />
            <div>
              <div className="text-sm font-semibold text-[var(--text)]">{BRAND_NAME_CN} IELTS Reading</div>
              <div className="text-xs text-[var(--text-soft)]">Cambridge {data.book.book_number} · Test {selectedTestNumber}</div>
            </div>
          </div>
          <div className="justify-self-center text-center">
            <div className="text-sm font-bold text-[var(--text)]">Part {activePart?.displayNumber ?? 1}</div>
            <div className="mt-0.5 text-xs text-[var(--text-soft)]">Read and answer questions {activePart?.numbers[0] ?? ""}-{activePart?.numbers.at(-1) ?? ""}</div>
          </div>
          <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
            <span data-notes-toggle><ExamIconButton label="记笔记" onClick={() => setNotesOpen(true)}><ClipboardPenLine size={18} /></ExamIconButton></span>
            <ExamIconButton label="全屏模式" onClick={() => void toggleFullscreen()}><Expand size={18} /></ExamIconButton>
            <Button type="button" variant="secondary" size="sm" onClick={() => setReviewOpen(true)} className="gap-2 rounded-full"><ListChecks size={17} />Review</Button>
            <div className={cn("flex h-9 w-32 shrink-0 items-center justify-center gap-1.5 rounded-full border px-3 text-sm text-[var(--text-soft)] sm:w-36", isOvertime ? "border-red-400/45 bg-red-500/10" : "border-[var(--border)] bg-[var(--bg-soft)]")}>
              <span className={isOvertime ? "text-red-500" : "text-[var(--success)]"}>◷</span>
              {isOvertime ? (
                <span className="font-bold tabular-nums text-red-500">超时 +{formatTimer(overtimeSeconds)}</span>
              ) : (
                <span className="font-bold tabular-nums text-[var(--success)]">{formatTimer(remainingSeconds)}</span>
              )}
            </div>
            <Button type="button" size="sm" onClick={handleSubmit} className="gap-2 rounded-full">Submit <SendHorizontal size={17} /></Button>
          </div>
        </div>
      </header>

      <main ref={splitRef} style={splitStyle} className="relative flex min-h-[calc(100vh-150px)] flex-col overflow-hidden md:h-[calc(100vh-150px)] md:flex-row">
        <section ref={passagePanelRef} className="h-[50vh] overflow-y-auto bg-[linear-gradient(180deg,var(--bg-soft),var(--bg))] px-4 py-5 md:h-auto md:w-[var(--left-width)] md:px-7">
          {activePart && <ReadingPassage key={activePart.section.id} section={activePart.section} partNumber={activePart.displayNumber} />}
        </section>

        <button type="button" onPointerDown={startResize} onPointerMove={resizeMove} className="hidden w-3 cursor-col-resize items-center justify-center border-x border-[var(--border)] bg-[var(--bg-soft)] text-[var(--primary)] transition hover:bg-[var(--primary-soft)] md:flex" aria-label="拖拽调整文章和题目宽度">
          <span className="h-9 w-1 rounded-full bg-[var(--primary)]/45" />
        </button>

        <section ref={questionPanelRef} className="h-[50vh] overflow-y-auto bg-[var(--card)] px-4 py-5 md:h-auto md:w-[var(--right-width)] md:px-7">
          {activePart && <ReadingQuestionPart key={activePart.section.id} part={activePart} answers={answers} officialAnswers={data.answers} isAdmin={isAdmin} onAnswerChange={setAnswer} />}
        </section>

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
      {selectionToolbar && <SelectionFormatToolbar top={selectionToolbar.top} left={selectionToolbar.left} canUndo={canUndoFormat} onFormat={applySelectionFormat} onUndo={undoLastSelectionFormat} />}
      {timeNotice === "five-minutes" && <TimeNoticePopup type="warning" seconds={remainingSeconds} onClose={() => setTimeNotice(null)} />}
      {timeNotice === "time-up" && <TimeNoticePopup type="time-up" seconds={overtimeSeconds} onClose={() => setTimeNotice(null)} />}
      {submitDialogMode && <IeltsSubmitDialog moduleType="reading" answers={answers} officialAnswers={officialAnswerByNumber} mode={submitDialogMode} onCancel={() => setSubmitDialogMode(null)} onConfirm={() => setSubmitDialogMode("result")} onClose={() => setSubmitDialogMode(null)} />}
      {submitNotice && <div className="fixed right-5 top-24 z-50 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm font-medium text-[var(--text)] shadow-[var(--shadow-lg)]">{submitNotice}</div>}
    </div>
  );
}

function ExamIconButton({ label, onClick, active = false, children }: { label: string; onClick: () => void; active?: boolean; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} title={label} aria-label={label} className={cn("inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] text-[var(--text-soft)] transition hover:bg-[var(--bg-soft)] hover:text-[var(--primary)]", active && "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]")}>{children}</button>;
}

function TimeNoticePopup({ type, seconds, onClose }: { type: "warning" | "time-up"; seconds: number; onClose: () => void }) {
  if (type === "warning") {
    return (
      <div className="fixed right-5 top-24 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-[var(--radius-lg)] border border-amber-300/70 bg-[var(--card)] p-4 shadow-[var(--shadow-lg)]">
        <div className="text-sm font-bold text-amber-600">时间提醒</div>
        <p className="mt-2 text-sm leading-6 text-[var(--text)]">还剩 5 分钟，请检查未完成的题目。</p>
        <div className="mt-3 rounded-[var(--radius-md)] bg-amber-500/10 px-3 py-2 text-2xl font-black tabular-nums text-amber-600">{formatTimer(seconds)}</div>
        <div className="mt-3 flex justify-end">
          <Button type="button" size="sm" variant="secondary" onClick={onClose} className="rounded-full">知道了</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <div className="w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-6 text-center shadow-[var(--shadow-lg)]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-xl font-black text-red-500">!</div>
        <h2 className="mt-4 text-xl font-black text-[var(--text)]">时间用尽</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">考试时间已经结束。你可以继续答题，顶部计时将显示超时正计时。</p>
        <div className="mt-4 rounded-[var(--radius-md)] bg-red-500/10 px-3 py-2 text-2xl font-black tabular-nums text-red-500">超时 +{formatTimer(seconds)}</div>
        <Button type="button" onClick={onClose} className="mt-5 w-full rounded-full">继续答题</Button>
      </div>
    </div>
  );
}

const ReadingPassage = memo(function ReadingPassage({ section, partNumber }: { section: IeltsSection; partNumber: number }) {
  const title = section.passage_title || section.title || `Reading Passage ${section.section_number}`;
  return (
    <article id={`reading-passage-${partNumber}`} className="mx-auto max-w-4xl scroll-mt-24 pb-10">
      <div className="mb-5">
        <div className="text-lg font-black uppercase tracking-[0.08em] text-[var(--text)]">Part {partNumber}</div>
        <h2 className="mt-1 text-3xl font-black uppercase tracking-tight text-[var(--text)]">Reading Passage {partNumber}</h2>
        {section.instruction && <ReadingRichText html={section.instruction} compact />}
      </div>
      <h3 className="mb-4 text-center text-2xl font-bold tracking-tight text-[var(--text)]">{stripHtml(title)}</h3>
      <ReadingRichText html={section.passage_text || stringValue(section.raw_data, "content")} />
    </article>
  );
});

function ReadingQuestionPart({ part, answers, officialAnswers, isAdmin, onAnswerChange }: { part: PartModel; answers: Answers; officialAnswers: IeltsAnswer[]; isAdmin: boolean; onAnswerChange: (questionNumber: string, value: string) => void }) {
  const shownInstructionKeys = new Set<string>();

  return (
    <section id={`reading-questions-${part.displayNumber}`} className="scroll-mt-24 pb-10">
      <div className="mb-5 flex items-center justify-between">
        <Badge className="w-fit">Part {part.displayNumber}</Badge>
        <div className="text-sm text-[var(--text-soft)]">{part.numbers.filter((number) => answers[`${number}`]).length} / {part.numbers.length}</div>
      </div>
      <div className="space-y-8">
        {part.questions.map((question) => {
          const instructionKey = questionInstructionKey(question);
          const suppressInstruction = Boolean(instructionKey && shownInstructionKeys.has(instructionKey));
          if (instructionKey) shownInstructionKeys.add(instructionKey);
          return <QuestionBlock key={question.id} question={question} answers={answers} officialAnswers={officialAnswers} isAdmin={isAdmin} onAnswerChange={onAnswerChange} suppressInstruction={suppressInstruction} />;
        })}
      </div>
    </section>
  );
}

function QuestionBlock({ question, answers, officialAnswers, isAdmin, onAnswerChange, suppressInstruction = false }: { question: IeltsQuestion; answers: Answers; officialAnswers: IeltsAnswer[]; isAdmin: boolean; onAnswerChange: (questionNumber: string, value: string) => void; suppressInstruction?: boolean }) {
  const numbers = questionNumbers(question);
  const range = numbers.length > 1 ? `${numbers[0]}-${numbers.at(-1)}` : `${numbers[0]}`;
  const sourceQuestions = arrayValue(question.content, "questions");
  const pageContent = removeDuplicateQuestionHeading(stringValue(question.content, "page_content"), range);
  const sectionDesc = suppressInstruction ? "" : stringValue(question.content, "section_desc") || question.instruction || "";
  const hasSourceQuestions = sourceQuestions.length > 0;
  const pageContentHasBlanks = hasQuestionBlanks(pageContent);
  const visibleOptions = question.options.filter((option) => !isEmptyLetterOption(optionText(option)));
  const judgementOptions = isJudgementOptions(visibleOptions) ? visibleOptions.map((option) => stripOptionLabel(optionText(option))) : [];
  const sourceQuestionsWithOptions = judgementOptions.length > 0 ? sourceQuestions.map((sourceQuestion) => ({ ...sourceQuestion, option: judgementOptions })) : sourceQuestions;
  const shouldRenderOptionBank = hasSourceQuestions && visibleOptions.length > 0 && judgementOptions.length === 0;
  const shouldShowOptionsBeforeQuestions = shouldRenderOptionBank && isMatchingOptionBank(question, sectionDesc, pageContent || "");
  const promptText = question.prompt ? stripHtml(question.prompt) : "";
  const shouldShowPrompt = Boolean(promptText && !isQuestionRangeHeading(promptText));
  const officialAnswer = officialAnswers.find((answer) => answer.question_id === question.id);

  return (
    <article id={hasSourceQuestions ? `reading-question-group-${numbers[0]}` : `reading-question-${numbers[0]}`} data-reading-question={hasSourceQuestions ? undefined : true} className="scroll-mt-24 border-b border-[var(--border)] pb-7 last:border-b-0">
      {shouldShowPrompt && <p className="mb-3 text-base font-semibold text-[var(--text)]">{promptText}</p>}
      {sectionDesc && <ReadingRichText html={sectionDesc} compact />}
      {pageContent && <ReadingAnswerHtml html={pageContent} answers={answers} onAnswerChange={onAnswerChange} />}
      {shouldShowOptionsBeforeQuestions && <QuestionOptionBank options={visibleOptions} />}
      {hasSourceQuestions && <SourceQuestionList questions={sourceQuestionsWithOptions} fallbackNumbers={numbers} answers={answers} onAnswerChange={onAnswerChange} hideTextInputs={pageContentHasBlanks} />}
      {shouldRenderOptionBank && !shouldShowOptionsBeforeQuestions && <QuestionOptionBank options={visibleOptions} />}
      {!hasSourceQuestions && visibleOptions.length > 0 && <OptionQuestion questionNumber={`${numbers[0]}`} options={visibleOptions} value={answers[`${numbers[0]}`] ?? ""} onChange={onAnswerChange} />}
      {isAdmin && officialAnswer && <AdminAnswerPanel question={question} answer={officialAnswer} />}
    </article>
  );
}

function AdminAnswerPanel({ question, answer }: { question: IeltsQuestion; answer: IeltsAnswer }) {
  const rows = getOfficialAnswerRows(question, answer);
  const hasContent = rows.length > 0 || Boolean(answer.explanation);
  if (!hasContent) return null;

  return (
    <div className="mt-5 space-y-2">
      <AdminAnswerDetails title="答案">
        <div className="grid gap-2">
          {rows.length > 0 ? rows.map((row) => <div key={`answer-${row.questionNumber}`} className="flex gap-2 px-1 py-1 text-sm text-[var(--text)]"><span className="font-semibold text-[var(--primary)]">Q{row.questionNumber}</span><span className="break-words">{row.answerText}</span></div>) : <p className="text-sm text-[var(--text-soft)]">暂无答案数据。</p>}
        </div>
      </AdminAnswerDetails>
      <AdminAnswerDetails title="答案与解析">
        <div className="space-y-3">
          {rows.length > 0 ? rows.map((row) => <div key={`explain-${row.questionNumber}`} className="px-1 py-1 text-sm leading-6 text-[var(--text)]"><div className="font-semibold text-[var(--primary)]">Q{row.questionNumber}: {row.answerText}</div><p className="mt-1 whitespace-pre-line text-[var(--text-soft)]">{row.explanation || "暂无解析"}</p></div>) : null}
          {answer.explanation && <p className="whitespace-pre-line px-1 py-1 text-sm leading-6 text-[var(--text-soft)]">{stripHtml(answer.explanation)}</p>}
        </div>
      </AdminAnswerDetails>
    </div>
  );
}

function AdminAnswerDetails({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-2 text-sm font-semibold text-[var(--text)] transition hover:text-[var(--primary)]">
        <span>{title}</span>
        <span className="text-xs text-[var(--text-faint)] transition group-open:rotate-180">⌄</span>
      </summary>
      <div className="pt-1">{children}</div>
    </details>
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
          <div key={`${label}-${index}`} id={`reading-question-${label}`} data-reading-question className="scroll-mt-24">
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

const ReadingRichText = memo(function ReadingRichText({ html, compact = false }: { html?: string | null; compact?: boolean }) {
  if (!html) return null;
  return <div className={cn("reading-rich-text max-w-none text-[15px] leading-8 text-[var(--text)] antialiased [&_*]:!border-[var(--border)] [&_*]:!bg-transparent [&_*]:!text-[var(--text)] [&_a]:!text-[var(--primary)] [&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-[var(--radius-md)] [&_li]:my-1.5 [&_p]:my-3 [&_strong]:font-semibold [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:p-2.5 [&_th]:border [&_th]:p-2.5", compact && "text-sm leading-7")} dangerouslySetInnerHTML={{ __html: normalizeQuestionBlanks(html) }} />;
});

const ReadingAnswerHtml = memo(function ReadingAnswerHtml({ html, answers, onAnswerChange }: { html: string; answers: Answers; onAnswerChange: (questionNumber: string, value: string) => void }) {
  const [markup] = useState(() => injectAnswerInputs(formatQuestionContent(html), answers));
  return <div className="reading-rich-text max-w-none text-[15px] leading-8 text-[var(--text)] antialiased [&_*]:!text-[var(--text)] [&_a]:!text-[var(--primary)] [&_figure.table]:!mx-auto [&_figure.table]:!my-5 [&_figure.table]:!w-4/5 [&_figure.table]:!max-w-[80%] [&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-[var(--radius-md)] [&_li]:my-1.5 [&_p]:my-3 [&_strong]:font-semibold [&_table]:!mx-auto [&_table]:!my-5 [&_table]:!w-full [&_table]:!table-fixed [&_table]:!border-collapse [&_table]:!border [&_table]:!border-[var(--border)] [&_td]:!border [&_td]:!border-[var(--border)] [&_td]:!p-3 [&_td]:!align-middle [&_th]:!border [&_th]:!border-[var(--border)] [&_th]:!bg-[var(--bg-soft)] [&_th]:!p-3 [&_th]:!text-left [&_th]:!font-semibold" onInputCapture={(event) => { const target = event.target as HTMLInputElement; const number = target.dataset.questionNumber; if (number) onAnswerChange(number, target.value); }} dangerouslySetInnerHTML={{ __html: markup }} />;
}, (previous, next) => previous.html === next.html);

function PartNavigator({ part, active, answers, onPartClick, onQuestionClick }: { part: PartModel; active: boolean; answers: Answers; onPartClick: () => void; onQuestionClick: (questionNumber: number) => void }) {
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

function SelectionFormatToolbar({ top, left, canUndo, onFormat, onUndo }: { top: number; left: number; canUndo: boolean; onFormat: (format: SelectionFormat) => void; onUndo: () => void }) {
  function keepSelection(event: React.MouseEvent<HTMLDivElement> | React.PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
  }

  return (
    <div style={{ top, left, transform: "translateX(-50%)" }} onPointerDown={keepSelection} onMouseDown={keepSelection} onMouseUp={keepSelection} onClick={(event) => event.stopPropagation()} className="fixed z-50 flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--card)] px-2 py-1.5 shadow-[var(--shadow-lg)]">
      <SelectionFormatButton label="加粗" onClick={() => onFormat("bold")}><span className="font-black">B</span></SelectionFormatButton>
      <SelectionFormatButton label="下划线" onClick={() => onFormat("underline")}><span className="font-bold underline underline-offset-2">U</span></SelectionFormatButton>
      <SelectionFormatButton label="黄色高亮" onClick={() => onFormat("yellow")}><span className="h-4 w-4 rounded-full border border-black/10 bg-[#fef08a]" /></SelectionFormatButton>
      <SelectionFormatButton label="红色高亮" onClick={() => onFormat("red")}><span className="h-4 w-4 rounded-full border border-black/10 bg-[#fecaca]" /></SelectionFormatButton>
      <SelectionFormatButton label="蓝色高亮" onClick={() => onFormat("blue")}><span className="h-4 w-4 rounded-full border border-black/10 bg-[#bfdbfe]" /></SelectionFormatButton>
      <span className="mx-1 h-5 w-px bg-[var(--border)]" />
      <SelectionFormatButton label="撤销" onClick={onUndo} disabled={!canUndo}><span className="text-base leading-none">↶</span></SelectionFormatButton>
    </div>
  );
}

function SelectionFormatButton({ label, onClick, disabled = false, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return <button type="button" title={label} aria-label={label} onClick={onClick} disabled={disabled} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-sm text-[var(--text)] transition hover:bg-[var(--bg-soft)] hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-35">{children}</button>;
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
          {Array.from({ length: 40 }, (_, index) => index + 1).map((number) => (
            <div key={number} className="min-h-16 overflow-hidden border-b border-r border-[var(--border)] px-3 py-2 text-sm text-[var(--text-soft)]">
              <div className="font-semibold text-[var(--primary)]">Q{number}</div>
              <div className="mt-1 flex items-start gap-1.5 text-xs leading-5">
                <span className={cn("line-clamp-2 min-w-0 flex-1 break-words", answers[`${number}`] ? "text-[var(--text)]" : "font-semibold text-red-500")}>{answers[`${number}`] || "未作答"}</span>
                {showOfficialAnswers && <><span className="text-[var(--text-faint)]">|</span><span className="line-clamp-2 min-w-0 flex-1 break-words text-[var(--text)]">{officialAnswers[`${number}`] || "暂无答案"}</span></>}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-center">
          <Button type="button" onClick={onClose} className="min-w-44 rounded-full">Close</Button>
        </div>
      </div>
    </div>
  );
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

function injectAnswerInputs(html: string, answers: Answers) {
  return normalizeQuestionBlanks(html).replace(/_____(\d{1,3})______/g, (_, number: string) => {
    const value = escapeHtmlAttribute(answers[number] ?? "");
    return `<span class="mx-1 inline-flex items-baseline align-baseline"><input data-question-number="${number}" value="${value}" placeholder="${number}" class="h-8 min-w-32 align-baseline rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-3 text-center text-sm leading-8 text-[var(--text)] outline-none placeholder:text-center placeholder:text-[var(--text-faint)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]" /></span>`;
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
  return `<div style="width:100%;overflow-x:auto;"><table class="ielts-reading-table" style="${tableStyle}">${colgroup}${titleRow}<tbody>${bodyRows}</tbody></table></div>`;
}

function formatInlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function applyTextFormat(range: Range, style: { tagName?: "strong"; backgroundColor?: string; textDecoration?: string }) {
  const textNodes = selectedTextNodes(range);
  const changed: HTMLElement[] = [];
  textNodes.forEach((node) => {
    const start = node === range.startContainer ? range.startOffset : 0;
    const end = node === range.endContainer ? range.endOffset : node.data.length;
    const element = wrapTextRange(node, start, end, style);
    if (element) changed.push(element);
  });
  return changed;
}

function selectedTextNodes(range: Range) {
  const root = range.commonAncestorContainer.nodeType === Node.TEXT_NODE ? range.commonAncestorContainer.parentNode : range.commonAncestorContainer;
  if (!root) return [];

  const nodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (isInteractiveSelection(node)) return NodeFilter.FILTER_REJECT;
      try {
        return range.intersectsNode(node) && node.textContent?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      } catch {
        return NodeFilter.FILTER_REJECT;
      }
    },
  });

  while (walker.nextNode()) {
    nodes.push(walker.currentNode as Text);
  }
  return nodes;
}

function wrapTextRange(node: Text, start: number, end: number, style: { tagName?: "strong"; backgroundColor?: string; textDecoration?: string }) {
  const safeStart = Math.max(0, Math.min(start, node.data.length));
  const safeEnd = Math.max(safeStart, Math.min(end, node.data.length));
  if (safeStart === safeEnd || !node.data.slice(safeStart, safeEnd).trim()) return null;

  let target = node;
  if (safeEnd < target.data.length) target.splitText(safeEnd);
  if (safeStart > 0) target = target.splitText(safeStart);

  const parent = target.parentNode;
  if (!parent) return null;
  const format = createFormatElement(style);
  parent.insertBefore(format, target);
  format.appendChild(target);
  return format;
}

function createFormatElement(style: { tagName?: "strong"; backgroundColor?: string; textDecoration?: string }) {
  const element = document.createElement(style.tagName ?? "span");
  if (style.backgroundColor) {
    element.style.setProperty("background-color", style.backgroundColor, "important");
    element.style.borderRadius = "0.18rem";
    element.style.boxDecorationBreak = "clone";
    element.style.setProperty("-webkit-box-decoration-break", "clone");
  }
  if (style.textDecoration) {
    element.style.textDecoration = style.textDecoration;
    element.style.textUnderlineOffset = "0.18em";
  }
  element.dataset.ieltsSelectionFormat = "true";
  return element;
}

function unwrapFormatElement(element: HTMLElement) {
  const parent = element.parentNode;
  if (!parent) return;
  while (element.firstChild) parent.insertBefore(element.firstChild, element);
  parent.removeChild(element);
  parent.normalize();
}

function isInteractiveSelection(node: Node) {
  const element = node.nodeType === Node.ELEMENT_NODE ? node as Element : node.parentElement;
  return Boolean(element?.closest("input, textarea, select, button"));
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
    .replace(new RegExp(`(?:READING\\s*)?Questions\\s+${normalizedRange}\\s*\\d*\\s*Questions\\s+${normalizedRange}`, "i"), `Questions ${range}`)
    .replace(new RegExp(`^\\s*\\*{0,2}Questions?\\s+${normalizedRange}\\*{0,2}\\s*`, "i"), "");
}

function getOfficialAnswerRows(question: IeltsQuestion, answer: IeltsAnswer) {
  const items = arrayValue(answer.answer_data as Record<string, unknown>, "answers");
  return items.map((item, index) => {
    const questionNumber = stringValue(item, "question_no") || stringValue(item, "questionNo") || `${question.question_number_start + index}`;
    return {
      questionNumber,
      answerText: resolveOfficialAnswerText(question, answer, item),
      explanation: stripHtml(stringValue(item, "answer_explain") || stringValue(item, "answerExplain") || stringValue(item, "explanation")),
    };
  });
}

function resolveOfficialAnswerText(question: IeltsQuestion, answer: IeltsAnswer, item: Record<string, unknown>) {
  const direct = stringValue(item, "answer_value") || stringValue(item, "answerValue") || stringValue(item, "answer_text") || stringValue(item, "answerText") || stringValue(item, "value");
  if (direct) return stripHtml(direct);

  const optionIds = officialOptionIds(item);
  if (optionIds.length > 0) {
    const options = [...arrayValue(answer.answer_data as Record<string, unknown>, "options"), ...question.options];
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
  return text.includes("list of people") || text.includes("list of headings") || text.includes("list of researchers") || text.includes("match each") || text.includes("matching");
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
