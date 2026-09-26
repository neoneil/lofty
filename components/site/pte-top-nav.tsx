"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { PendingNavigationLink as Link } from "@/components/navigation/pending-navigation-link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

import {
  PTESubTab,
  pteSubTabMap,
  MainTab,
} from "./pte-config";

type Props = {
  currentMain: MainTab;
  currentSub?: PTESubTab;
};

type NavScrollState = {
  canScrollLeft: boolean;
  canScrollRight: boolean;
  hasOverflow: boolean;
  thumbLeft: number;
  thumbWidth: number;
};

const NAV_CARD_META: Record<
  PTESubTab,
  {
    title: string;
    description: string;
    image: string;
    columns: number;
    rows: number;
    column: number;
    row: number;
    position?: string;
  }
> = {
  ra: {
    title: "Read Aloud",
    description: "Read text clearly and naturally",
    image: "/pte-nav/speaking/read-aloud.png",
    columns: 1,
    rows: 1,
    column: 0,
    row: 0,
  },
  rs: {
    title: "Repeat Sentence",
    description: "Listen and repeat the sentence",
    image: "/pte-nav/speaking/repeat-sentence.png",
    columns: 1,
    rows: 1,
    column: 0,
    row: 0,
  },
  di: {
    title: "Describe Image",
    description: "Describe the image in detail",
    image: "/pte-nav/speaking/describe-image.png",
    columns: 1,
    rows: 1,
    column: 0,
    row: 0,
  },
  rl: {
    title: "Re-tell Lecture",
    description: "Listen and summarize the lecture",
    image: "/pte-nav/speaking/retell-lecture.png",
    columns: 1,
    rows: 1,
    column: 0,
    row: 0,
  },
  asq: {
    title: "Answer Short Question",
    description: "Give a short answer",
    image: "/pte-nav/speaking/answer-short-question.png",
    columns: 1,
    rows: 1,
    column: 0,
    row: 0,
  },
  rts: {
    title: "Respond to a Situation",
    description: "Reply to a real-life prompt",
    image: "/pte-nav/speaking/respond-situation.png",
    columns: 1,
    rows: 1,
    column: 0,
    row: 0,
  },
  sgd: {
    title: "Summarize Group Discussion",
    description: "Listen and summarize the discussion",
    image: "/pte-nav/speaking/summarize-group-discussion.png",
    columns: 1,
    rows: 1,
    column: 0,
    row: 0,
  },
  swt: {
    title: "Summarize Written Text",
    description: "Condense a passage into one sentence",
    image: "/pte-nav/writing-types.png",
    columns: 2,
    rows: 1,
    column: 0,
    row: 0,
  },
  essay: {
    title: "Write Essay",
    description: "Plan and write a structured response",
    image: "/pte-nav/writing-types.png",
    columns: 2,
    rows: 1,
    column: 1,
    row: 0,
  },
  rfib: {
    title: "Reading Fill in the Blanks",
    description: "Choose words for missing blanks",
    image: "/pte-nav/reading-types.png",
    columns: 3,
    rows: 2,
    column: 0,
    row: 0,
  },
  fibrw: {
    title: "Reading & Writing Fill in the Blanks",
    description: "Complete the text with precise words",
    image: "/pte-nav/reading-types.png",
    columns: 3,
    rows: 2,
    column: 1,
    row: 0,
  },
  rmcsa: {
    title: "Multiple Choice Single",
    description: "Read and select one answer",
    image: "/pte-nav/reading-types.png",
    columns: 3,
    rows: 2,
    column: 2,
    row: 0,
  },
  rmcma: {
    title: "Multiple Choice Multiple",
    description: "Read and select all correct answers",
    image: "/pte-nav/reading-types.png",
    columns: 3,
    rows: 2,
    column: 0,
    row: 1,
  },
  ro: {
    title: "Reorder Paragraphs",
    description: "Arrange paragraphs in the right order",
    image: "/pte-nav/reading-types.png",
    columns: 3,
    rows: 2,
    column: 1,
    row: 1,
  },
  sst: {
    title: "Summarize Spoken Text",
    description: "Listen and write a clear summary",
    image: "/pte-nav/listening-types.png",
    columns: 4,
    rows: 2,
    column: 0,
    row: 0,
  },
  mcsa: {
    title: "Multiple Choice Single",
    description: "Listen and select one answer",
    image: "/pte-nav/listening-types.png",
    columns: 4,
    rows: 2,
    column: 1,
    row: 0,
  },
  mcma: {
    title: "Multiple Choice Multiple",
    description: "Listen and select all correct answers",
    image: "/pte-nav/listening-types.png",
    columns: 4,
    rows: 2,
    column: 2,
    row: 0,
  },
  fib_l: {
    title: "Fill in the Blanks",
    description: "Type the missing words",
    image: "/pte-nav/listening-types.png",
    columns: 4,
    rows: 2,
    column: 3,
    row: 0,
  },
  smw: {
    title: "Select Missing Word",
    description: "Choose the final missing word",
    image: "/pte-nav/listening-types.png",
    columns: 4,
    rows: 2,
    column: 0,
    row: 1,
  },
  hiw: {
    title: "Highlight Incorrect Words",
    description: "Find words that differ from audio",
    image: "/pte-nav/listening-types.png",
    columns: 4,
    rows: 2,
    column: 1,
    row: 1,
  },
  hcs: {
    title: "Highlight Correct Summary",
    description: "Select the best summary",
    image: "/pte-nav/listening-types.png",
    columns: 4,
    rows: 2,
    column: 2,
    row: 1,
  },
  wfd: {
    title: "Write From Dictation",
    description: "Listen and write the sentence",
    image: "/pte-nav/listening-types.png",
    columns: 4,
    rows: 2,
    column: 3,
    row: 1,
  },
};

const SECTION_META: Record<
  MainTab,
  {
    title: string;
    eyebrow: string;
    description: string;
    metric: string;
    heroImage: string;
  }
> = {
  speaking: {
    title: "Speaking",
    eyebrow: "PTE Practice",
    description: "Build confident responses with focused question sets, clear pacing, and AI-supported practice.",
    metric: "Voice-first training",
    heroImage: "/pte-nav/speaking-hero.png",
  },
  writing: {
    title: "Writing",
    eyebrow: "PTE Practice",
    description: "Plan, structure, and refine high-scoring written answers with a calm practice workflow.",
    metric: "Structure and clarity",
    heroImage: "/pte-nav/writing-hero.png",
  },
  reading: {
    title: "Reading",
    eyebrow: "PTE Practice",
    description: "Train comprehension, grammar, and answer selection with question types arranged for quick scanning.",
    metric: "Accuracy-focused drills",
    heroImage: "/pte-nav/reading-hero.png",
  },
  listening: {
    title: "Listening",
    eyebrow: "PTE Practice",
    description: "Strengthen listening precision across summaries, dictation, choices, and missing-word tasks.",
    metric: "Audio-ready practice",
    heroImage: "/pte-nav/listening-hero.png",
  },
};

const SPRITE_RATIOS: Record<string, number> = {
  "/pte-nav/speaking-types.png": 1536 / 1024,
  "/pte-nav/writing-types.png": 1774 / 887,
  "/pte-nav/reading-types.png": 1536 / 1024,
  "/pte-nav/listening-types.png": 1536 / 1024,
};

function backgroundPosition(column: number, row: number, columns: number, rows: number) {
  const x = columns === 1 ? 0 : (column / (columns - 1)) * 100;
  const y = rows === 1 ? 0 : (row / (rows - 1)) * 100;

  return `${x}% ${y}%`;
}

function getBackgroundPosition(meta: (typeof NAV_CARD_META)[PTESubTab]) {
  return meta.position ?? backgroundPosition(meta.column, meta.row, meta.columns, meta.rows);
}

function getSpriteCellAspect(meta: (typeof NAV_CARD_META)[PTESubTab]) {
  const imageRatio =
    SPRITE_RATIOS[meta.image] ?? 1;

  return Number((imageRatio * meta.rows / meta.columns).toFixed(4));
}

function getScrollState(scroller: HTMLDivElement): NavScrollState {
  const maxScrollLeft =
    Math.max(0, scroller.scrollWidth - scroller.clientWidth);
  const hasOverflow =
    maxScrollLeft > 1;
  const scrollLeft =
    Math.min(maxScrollLeft, Math.max(0, scroller.scrollLeft));
  const thumbWidth =
    hasOverflow ? Math.max(18, (scroller.clientWidth / scroller.scrollWidth) * 100) : 100;
  const thumbTravel =
    100 - thumbWidth;
  const thumbLeft =
    hasOverflow && maxScrollLeft > 0 ? (scrollLeft / maxScrollLeft) * thumbTravel : 0;

  return {
    canScrollLeft: scrollLeft > 1,
    canScrollRight: scrollLeft < maxScrollLeft - 1,
    hasOverflow,
    thumbLeft,
    thumbWidth,
  };
}

function PTEPracticeHero({ currentMain }: { currentMain: MainTab }) {
  const meta = SECTION_META[currentMain];

  return (
    <section className="mb-4 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[linear-gradient(112deg,#f7fbff_0%,#eef6ff_48%,#fff8f0_100%)] shadow-[var(--shadow-sm)]">
      <div className="grid gap-4 px-5 py-5 sm:grid-cols-[minmax(0,1fr)_340px] sm:px-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:px-7">
        <div className="flex min-h-[156px] flex-col justify-center">
          <span className="mb-4 w-fit rounded-full border border-[var(--primary)]/15 bg-white/75 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--primary)]">
            {meta.eyebrow}
          </span>
          <h1 className="text-3xl font-black leading-tight text-[var(--text)] sm:text-4xl lg:text-5xl">
            {meta.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-[var(--text-soft)] sm:text-base">
            {meta.description}
          </p>
          <span className="mt-5 w-fit rounded-[var(--radius-sm)] bg-white/80 px-3 py-2 text-xs font-bold text-[var(--text)] shadow-[var(--shadow-sm)]">
            {meta.metric}
          </span>
        </div>
        <div className="relative hidden min-h-[178px] items-end justify-end overflow-hidden rounded-[var(--radius-lg)] bg-[#dfeeff] sm:flex">
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-cover bg-no-repeat"
            style={{
              backgroundImage: `url(${meta.heroImage})`,
              backgroundPosition: "center",
            }}
          />
          <span className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-[#eef6ff] via-[#eef6ff]/65 to-transparent" />
        </div>
      </div>
    </section>
  );
}

function SubTabItem({
  tabKey,
  href,
  active,
}: {
  tabKey: PTESubTab;
  href: string;
  active: boolean;
}) {
  const meta = NAV_CARD_META[tabKey];

  return (

    <Link
      href={href}
      compactPending
      aria-current={active ? "page" : undefined}
      className={`group relative flex h-[210px] w-[146px] flex-shrink-0 flex-col overflow-hidden rounded-[var(--radius-md)] border bg-[var(--card)] text-left shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] sm:h-[218px] sm:w-[150px] ${
        active
          ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/10"
          : "border-[var(--border)] hover:border-[var(--primary)]/45"
      }`}
    >
      <span className="m-2 mb-0 flex h-[104px] items-center justify-center rounded-[var(--radius-sm)] bg-[var(--bg-soft)] sm:h-[108px]">
        <span
          aria-hidden="true"
          className="block h-[var(--nav-image-h)] max-w-full bg-no-repeat [--nav-image-h:94px] sm:[--nav-image-h:98px]"
          style={{
            width: `min(100%, calc(var(--nav-image-h) * ${getSpriteCellAspect(meta)}))`,
            backgroundImage: `url(${meta.image})`,
            backgroundSize: `auto ${meta.rows * 100}%`,
            backgroundPosition: getBackgroundPosition(meta),
          }}
        />
      </span>
      <span className="flex flex-1 flex-col px-3.5 pb-4 pt-3">
        <span className="line-clamp-2 text-[14px] font-bold leading-5 text-[var(--text)]">{meta.title}</span>
        <span className="mt-1.5 line-clamp-2 text-[12px] font-medium leading-5 text-[var(--text-soft)]">
          {meta.description}
        </span>
      </span>
      <span
        className={`absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center rounded-full transition ${
          active
            ? "bg-[var(--primary)] text-white"
            : "bg-[var(--bg-soft)] text-[var(--text-soft)] group-hover:bg-[var(--primary-soft)] group-hover:text-[var(--primary)]"
        }`}
      >
        <ArrowRight size={15} />
      </span>

    </Link>

  );

}

export default function PTETopNav({
  currentMain,
  currentSub,
}: Props) {

  const pathname =
    usePathname();
  const searchParams = useSearchParams();
  const scrollerRef =
    useRef<HTMLDivElement>(null);
  const railRef =
    useRef<HTMLDivElement>(null);
  const dragStateRef =
    useRef({
      active: false,
      moved: false,
      pointerId: -1,
      scrollLeft: 0,
      startX: 0,
    });
  const thumbDragStateRef =
    useRef({
      active: false,
      pointerId: -1,
      scrollLeft: 0,
      startX: 0,
    });
  const [scrollState, setScrollState] =
    useState<NavScrollState>({
      canScrollLeft: false,
      canScrollRight: false,
      hasOverflow: false,
      thumbLeft: 0,
      thumbWidth: 100,
    });

  const subTabs =
    pteSubTabMap[currentMain];

  useEffect(() => {
    const scroller =
      scrollerRef.current;

    if (!scroller) return;

    const update =
      () => setScrollState(getScrollState(scroller));

    update();

    const resizeObserver =
      new ResizeObserver(update);

    resizeObserver.observe(scroller);

    return () => {
      resizeObserver.disconnect();
    };
  }, [currentMain, subTabs.length]);

  if (searchParams.get("embed") === "course") return null;

  const updateScrollState = () => {
    const scroller =
      scrollerRef.current;

    if (!scroller) return;

    setScrollState(getScrollState(scroller));
  };

  const scrollNav = (direction: -1 | 1) => {
    const scroller =
      scrollerRef.current;

    if (!scroller) return;

    scroller.scrollBy({
      behavior: "smooth",
      left: direction * Math.max(220, scroller.clientWidth * 0.72),
    });
  };

  const handleThumbPointerDown = (event: PointerEvent<HTMLSpanElement>) => {
    const scroller =
      scrollerRef.current;

    if (!scroller) return;

    event.preventDefault();
    event.stopPropagation();

    thumbDragStateRef.current = {
      active: true,
      pointerId: event.pointerId,
      scrollLeft: scroller.scrollLeft,
      startX: event.clientX,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleThumbPointerMove = (event: PointerEvent<HTMLSpanElement>) => {
    const dragState =
      thumbDragStateRef.current;
    const scroller =
      scrollerRef.current;
    const rail =
      railRef.current;

    if (!dragState.active || !scroller || !rail) return;

    const maxScrollLeft =
      Math.max(0, scroller.scrollWidth - scroller.clientWidth);
    const thumbTravel =
      Math.max(1, rail.clientWidth * (1 - scrollState.thumbWidth / 100));
    const deltaX =
      event.clientX - dragState.startX;

    scroller.scrollLeft =
      dragState.scrollLeft + (deltaX / thumbTravel) * maxScrollLeft;
  };

  const stopThumbDragging = (event: PointerEvent<HTMLSpanElement>) => {
    const dragState =
      thumbDragStateRef.current;

    if (!dragState.active) return;

    dragState.active = false;

    if (event.currentTarget.hasPointerCapture(dragState.pointerId)) {
      event.currentTarget.releasePointerCapture(dragState.pointerId);
    }
  };

  const handleRailPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const scroller =
      scrollerRef.current;
    const rail =
      railRef.current;

    if (!scroller || !rail || event.target !== event.currentTarget) return;

    const rect =
      rail.getBoundingClientRect();
    const clickRatio =
      (event.clientX - rect.left) / rect.width;
    const maxScrollLeft =
      Math.max(0, scroller.scrollWidth - scroller.clientWidth);

    scroller.scrollTo({
      behavior: "smooth",
      left: clickRatio * maxScrollLeft,
    });
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const scroller =
      scrollerRef.current;

    if (!scroller || scroller.scrollWidth <= scroller.clientWidth) return;

    dragStateRef.current = {
      active: true,
      moved: false,
      pointerId: event.pointerId,
      scrollLeft: scroller.scrollLeft,
      startX: event.clientX,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const dragState =
      dragStateRef.current;
    const scroller =
      scrollerRef.current;

    if (!dragState.active || !scroller) return;

    const deltaX =
      event.clientX - dragState.startX;

    if (Math.abs(deltaX) > 6) {
      if (!dragState.moved && scroller.hasPointerCapture?.(event.pointerId) === false) {
        scroller.setPointerCapture(event.pointerId);
      }

      dragState.moved = true;
    }

    if (!dragState.moved) return;

    scroller.scrollLeft =
      dragState.scrollLeft - deltaX;
  };

  const stopDragging = () => {
    const dragState =
      dragStateRef.current;
    const scroller =
      scrollerRef.current;

    if (!dragState.active) return;

    dragState.active = false;

    if (scroller?.hasPointerCapture(dragState.pointerId)) {
      scroller.releasePointerCapture(dragState.pointerId);
    }
  };

  return (

    <div className="mx-auto mb-4 mt-3 max-w-7xl sm:mb-6 sm:mt-4">

      <PTEPracticeHero currentMain={currentMain} />

      <div className="relative">
        {scrollState.hasOverflow ? (
          <button
            type="button"
            aria-label="Scroll question types left"
            disabled={!scrollState.canScrollLeft}
            onClick={() => scrollNav(-1)}
            className="absolute left-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border)] bg-white/95 text-[var(--text)] shadow-[var(--shadow-md)] transition hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:pointer-events-none disabled:opacity-35"
          >
            <ChevronLeft size={18} />
          </button>
        ) : null}

        <div
          ref={scrollerRef}
          className={`flex max-w-full cursor-grab gap-2.5 overflow-x-auto overscroll-x-contain pb-2 scrollbar-hide active:cursor-grabbing ${
            scrollState.hasOverflow ? "px-11" : ""
          }`}
          onClickCapture={(event) => {
            if (!dragStateRef.current.moved) return;

            event.preventDefault();
            event.stopPropagation();
            dragStateRef.current.moved = false;
          }}
          onPointerCancel={stopDragging}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDragging}
          onScroll={updateScrollState}
        >

          {subTabs.map((tab) => (

            <SubTabItem
              key={tab.href}
              tabKey={tab.key}
              href={tab.href}
              active={currentSub ? currentSub === tab.key : pathname === tab.href || pathname.startsWith(`${tab.href}/`)}
            />

          ))}

        </div>

        {scrollState.hasOverflow ? (
          <button
            type="button"
            aria-label="Scroll question types right"
            disabled={!scrollState.canScrollRight}
            onClick={() => scrollNav(1)}
            className="absolute right-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border)] bg-white/95 text-[var(--text)] shadow-[var(--shadow-md)] transition hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:pointer-events-none disabled:opacity-35"
          >
            <ChevronRight size={18} />
          </button>
        ) : null}
      </div>

      {scrollState.hasOverflow ? (
        <div
          ref={railRef}
          aria-hidden="true"
          className="mx-12 mt-1 h-2 cursor-pointer rounded-full bg-[var(--bg-soft)] p-[3px]"
          onPointerDown={handleRailPointerDown}
        >
          <span
            className="block h-full cursor-grab rounded-full bg-[var(--primary)]/60 active:cursor-grabbing"
            style={{
              marginLeft: `${scrollState.thumbLeft}%`,
              width: `${scrollState.thumbWidth}%`,
            }}
            onPointerCancel={stopThumbDragging}
            onPointerDown={handleThumbPointerDown}
            onPointerMove={handleThumbPointerMove}
            onPointerUp={stopThumbDragging}
          />
        </div>
      ) : null}

    </div>

  );

}
