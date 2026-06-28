"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, ListChecks, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Button } from "@/components/ui-v2/button";
import { Card, CardContent } from "@/components/ui-v2/card";
import type { CoursePredictionQuestion } from "@/lib/pte/course-prediction-questions";
import { parseCourseSlideFooter } from "@/lib/course-markdown/parse-slide-footer";
import { exportSlidesToPptx } from "@/lib/course-markdown/export-slides-to-pptx";
import { useCourseAppearance } from "./CourseAppearanceProvider";
import CourseEmbeddedQuestion from "./CourseEmbeddedQuestion";
import CourseMarkdownBody from "./CourseMarkdownBody";
import CoursePredictionQuestionList from "./CoursePredictionQuestionList";
import CourseSlideThumbnail from "./CourseSlideThumbnail";
import CourseSlideFooter from "./CourseSlideFooter";
import { useCoursePptxExport } from "./CoursePptxExportProvider";

function getSlideDensity(content: string) {
  const plainTextLength = content.replace(/<!--.*?-->/g, "").replace(/[#>*_`=\[\]{}|:-]/g, "").replace(/\s+/g, " ").trim().length;
  const lineCount = content.split("\n").filter((line) => line.trim()).length;

  if (plainTextLength > 1200 || lineCount > 45) return "compact";
  if (plainTextLength > 700 || lineCount > 28) return "dense";
  return "normal";
}

type CourseSlidesViewProps = {
  slides: string[];
  predictionQuestions?: CoursePredictionQuestion[];
  exportFileName: string;
};

export default function CourseSlidesView({ slides, predictionQuestions = [], exportFileName }: CourseSlidesViewProps) {
  const { gradientStyle } = useCourseAppearance();
  const { isExporting, registerExportHandler } = useCoursePptxExport();
  const parsedSlides = useMemo(() => slides.map(parseCourseSlideFooter), [slides]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playbackVersion, setPlaybackVersion] = useState(0);
  const [thumbnailsCollapsed, setThumbnailsCollapsed] = useState(false);
  const [mobileQuestionsOpen, setMobileQuestionsOpen] = useState(false);
  const [sidebarView, setSidebarView] = useState<"slides" | "questions">("slides");
  const [selectedQuestion, setSelectedQuestion] = useState<CoursePredictionQuestion | null>(null);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === slides.length - 1;
  const currentSlide = parsedSlides[currentIndex];
  const density = getSlideDensity(currentSlide.content);

  const exportPptx = useCallback(async (onProgress: (completed: number, total: number) => void) => {
    await new Promise((resolve) => window.setTimeout(resolve, 1400));
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-course-export-slide="true"]'));
    await exportSlidesToPptx({ elements, fileName: exportFileName, onProgress });
  }, [exportFileName]);

  useEffect(() => {
    registerExportHandler(exportPptx);
    return () => registerExportHandler(null);
  }, [exportPptx, registerExportHandler]);

  const replayAt = useCallback((index: number) => {
    setSelectedQuestion(null);
    setCurrentIndex(Math.max(0, Math.min(slides.length - 1, index)));
    setPlaybackVersion((version) => version + 1);
  }, [slides.length]);

  const showPrevious = useCallback(() => {
    setSelectedQuestion(null);
    setCurrentIndex((index) => Math.max(0, index - 1));
    setPlaybackVersion((version) => version + 1);
  }, []);

  const showNext = useCallback(() => {
    setSelectedQuestion(null);
    setCurrentIndex((index) => Math.min(slides.length - 1, index + 1));
    setPlaybackVersion((version) => version + 1);
  }, [slides.length]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (selectedQuestion) return;
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable || ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target?.tagName ?? "")) return;

      if (["ArrowRight", "ArrowDown"].includes(event.key) || event.code === "Space") {
        event.preventDefault();
        showNext();
      } else if (["ArrowLeft", "ArrowUp"].includes(event.key)) {
        event.preventDefault();
        showPrevious();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedQuestion, showNext, showPrevious]);

  return (
    <>
      {isExporting ? (
        <div className="pointer-events-none fixed left-[-10000px] top-0 z-[-1]" aria-hidden="true">
          {parsedSlides.map((slide, index) => {
            const exportDensity = getSlideDensity(slide.content);
            return (
              <div key={`export-${index}`} data-course-export-slide="true" style={gradientStyle} className="relative h-[720px] w-[1280px] overflow-hidden bg-[var(--card)] text-[var(--text)]">
                <div className={`h-full overflow-hidden px-16 py-12 ${slide.footer ? "pb-20" : ""}`}>
                  <div className={`course-slide-content course-slide-content--${exportDensity}`} data-course-markdown-content="true"><CourseMarkdownBody content={slide.content} /></div>
                </div>
                {slide.footer ? <CourseSlideFooter footer={slide.footer} page={index + 1} totalPages={parsedSlides.length} /> : null}
              </div>
            );
          })}
        </div>
      ) : null}

      <div className={`grid gap-5 transition-[grid-template-columns,gap] duration-300 ${thumbnailsCollapsed ? "lg:grid-cols-[0_minmax(0,1fr)] lg:gap-0" : "lg:grid-cols-[280px_minmax(0,1fr)]"}`}>
      <aside className={`hidden min-w-0 overflow-hidden transition-opacity duration-200 lg:block ${thumbnailsCollapsed ? "pointer-events-none opacity-0" : "opacity-100"}`} aria-hidden={thumbnailsCollapsed}>
        <div className="sticky top-24 w-[280px] rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-2 shadow-[var(--shadow-sm)]">
          {predictionQuestions.length > 0 && (
            <div className="mb-3 grid grid-cols-2 gap-1 rounded-[var(--radius-md)] bg-[var(--bg-soft)] p-1">
              <button type="button" onClick={() => setSidebarView("slides")} className={`flex h-8 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition ${sidebarView === "slides" ? "bg-[var(--card)] text-[var(--text)] shadow-[var(--shadow-sm)]" : "text-[var(--text-soft)] hover:text-[var(--text)]"}`}><BookOpen size={14} aria-hidden="true" />课件</button>
              <button type="button" onClick={() => setSidebarView("questions")} className={`flex h-8 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition ${sidebarView === "questions" ? "bg-[var(--card)] text-[var(--text)] shadow-[var(--shadow-sm)]" : "text-[var(--text-soft)] hover:text-[var(--text)]"}`}><ListChecks size={14} aria-hidden="true" />预测题</button>
            </div>
          )}
          <div className="max-h-[calc(100vh-11rem)] space-y-3 overflow-y-auto pr-1">
            {sidebarView === "questions" && predictionQuestions.length > 0 ? <CoursePredictionQuestionList questions={predictionQuestions} selectedId={selectedQuestion?.id} onSelect={setSelectedQuestion} /> : parsedSlides.map((slide, index) => <CourseSlideThumbnail key={`${index}-${slide.content.slice(0, 24)}`} active={!selectedQuestion && currentIndex === index} backgroundStyle={gradientStyle} content={slide.content} index={index} onSelect={() => replayAt(index)} />)}
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        {predictionQuestions.length > 0 && (
          <div className="mb-3 lg:hidden">
            <button type="button" onClick={() => setMobileQuestionsOpen((open) => !open)} className="flex h-10 w-full items-center justify-between rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-3 text-sm font-semibold text-[var(--text)] shadow-[var(--shadow-sm)]">
              <span className="flex items-center gap-2"><ListChecks size={16} className="text-[var(--primary)]" aria-hidden="true" />预测题库</span>
              <span className="text-xs font-medium text-[var(--text-soft)]">{mobileQuestionsOpen ? "收起" : `${predictionQuestions.length} 题`}</span>
            </button>
            {mobileQuestionsOpen && <div className="mt-2 max-h-[360px] overflow-y-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-3"><CoursePredictionQuestionList questions={predictionQuestions} selectedId={selectedQuestion?.id} onSelect={(question) => { setSelectedQuestion(question); setMobileQuestionsOpen(false); }} /></div>}
          </div>
        )}
        <Card style={selectedQuestion ? undefined : gradientStyle} className="relative h-[520px] rounded-[var(--radius-lg)] sm:h-[600px] lg:h-[640px]">
          <button type="button" onClick={() => setThumbnailsCollapsed((collapsed) => !collapsed)} className="absolute -left-3 top-4 z-10 hidden h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] text-[var(--text-soft)] shadow-[var(--shadow-sm)] transition hover:border-[var(--primary)] hover:text-[var(--primary)] lg:flex" aria-label={thumbnailsCollapsed ? "展开左侧缩略图" : "收起左侧缩略图"} title={thumbnailsCollapsed ? "展开缩略图" : "收起缩略图"}>
            {thumbnailsCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
          {selectedQuestion ? <CourseEmbeddedQuestion question={selectedQuestion} onRestore={() => setSelectedQuestion(null)} /> : <><CardContent className={`h-full overflow-y-auto overscroll-contain p-5 sm:p-8 lg:p-10 ${currentSlide.footer ? "pb-16 sm:pb-20" : ""}`}><div className={`course-slide-content course-slide-content--${density}`} data-course-markdown-content="true"><CourseMarkdownBody key={`${currentIndex}-${playbackVersion}`} content={currentSlide.content} /></div></CardContent>{currentSlide.footer ? <CourseSlideFooter footer={currentSlide.footer} page={currentIndex + 1} totalPages={slides.length} /> : null}</>}
        </Card>

        <div className={`mt-4 flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-3 shadow-[var(--shadow-sm)] sm:flex-row sm:items-center sm:justify-between ${selectedQuestion ? "pointer-events-none opacity-45" : ""}`}>
          <Button type="button" variant="secondary" onClick={showPrevious} disabled={isFirst} className="gap-2">
            <ArrowLeft size={16} aria-hidden="true" />
            Previous
          </Button>

          <div className="flex items-center justify-center gap-3 text-sm font-semibold text-[var(--text)]">
            <span>{currentIndex + 1} / {slides.length}</span>
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--bg-soft)]">
              <div className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-300" style={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }} />
            </div>
          </div>

          <Button type="button" onClick={showNext} disabled={isLast} className="gap-2">
            Next
            <ArrowRight size={16} aria-hidden="true" />
          </Button>
        </div>
      </div>
      </div>
    </>
  );
}
