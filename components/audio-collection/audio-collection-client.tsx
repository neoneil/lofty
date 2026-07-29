"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Headphones, Pause, Play, RotateCcw, SkipBack, SkipForward, Sparkles, Square, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui-v2/card";
import { SecureAudioPlayer } from "@/components/ui-v2/secure-audio-player";

export type AudioCollectionType = "sst" | "rl" | "wfd" | "rs" | `ielts-book-${number}`;
export type AudioCollectionKind = "pte" | "ielts";

export type AudioCollectionItem = {
  id: string;
  type: AudioCollectionType;
  collection: AudioCollectionKind;
  label: string;
  text: string;
  sourceQuestionId: string | null;
  isPrediction: boolean;
  audioUrl: string;
  audioUrls?: string[];
  durationSeconds: number | null;
  wordCount: number | null;
  bookNumber?: number;
  testNumber?: number;
  partNumber?: number;
  bookTitle?: string;
};

export type AudioCollectionGroup = {
  id: AudioCollectionType;
  collection: AudioCollectionKind;
  label: string;
  title: string;
  href: string;
  items: AudioCollectionItem[];
  error: string | null;
};

type Props = {
  groups: AudioCollectionGroup[];
};

const PLAY_COUNTS = [1, 2, 3] as const;
type QuestionFilter = "prediction" | "all";
const COLLECTION_TABS: Array<{ id: AudioCollectionKind; label: string; subtitle: string }> = [
  { id: "pte", label: "PTE", subtitle: "SST / RL / WFD / RS" },
  { id: "ielts", label: "IELTS", subtitle: "剑桥 21-16 听力" },
];

function formatDuration(seconds: number | null) {
  if (!seconds || !Number.isFinite(seconds)) return "--:--";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

export default function AudioCollectionClient({ groups }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const replayTimerRef = useRef<number | null>(null);
  const playRoundRef = useRef(1);
  const [activeType, setActiveType] = useState<AudioCollectionType>(groups[0]?.id ?? "sst");
  const [activeCollection, setActiveCollection] = useState<AudioCollectionKind>(groups[0]?.collection ?? "pte");
  const [questionFilter, setQuestionFilter] = useState<QuestionFilter>("prediction");
  const [repeatCount, setRepeatCount] = useState<(typeof PLAY_COUNTS)[number]>(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shouldAutoPlay, setShouldAutoPlay] = useState(false);
  const [audioUrlIndex, setAudioUrlIndex] = useState(0);

  const activeCollectionGroups = useMemo(() => groups.filter((group) => group.collection === activeCollection), [activeCollection, groups]);
  const activeGroup = useMemo(() => activeCollectionGroups.find((group) => group.id === activeType) ?? activeCollectionGroups[0] ?? groups[0], [activeCollectionGroups, activeType, groups]);
  const questions = useMemo(() => {
    const items = activeGroup?.items ?? [];
    if (activeGroup?.collection === "pte" && questionFilter === "prediction") return items.filter((item) => item.isPrediction);
    return items;
  }, [activeGroup, questionFilter]);
  const safeCurrentIndex = questions.length > 0 ? Math.min(currentIndex, questions.length - 1) : 0;
  const currentQuestion = questions[safeCurrentIndex] ?? null;
  const currentAudioUrls = currentQuestion?.audioUrls?.length ? currentQuestion.audioUrls : currentQuestion ? [currentQuestion.audioUrl] : [];
  const currentAudioUrl = currentAudioUrls[Math.min(audioUrlIndex, currentAudioUrls.length - 1)] ?? "";
  const totalQuestions = groups.reduce((total, group) => total + group.items.length, 0);
  const pteTotalQuestions = groups.filter((group) => group.collection === "pte").reduce((total, group) => total + group.items.length, 0);
  const ieltsTotalQuestions = groups.filter((group) => group.collection === "ielts").reduce((total, group) => total + group.items.length, 0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentQuestion) return;

    playRoundRef.current = 1;
    setCurrentRound(1);
    setAudioUrlIndex(0);
    audio.load();

    if (!shouldAutoPlay) return;

    void audio.play().then(
      () => setIsPlaying(true),
      () => setIsPlaying(false),
    );
  }, [currentQuestion, shouldAutoPlay]);

  useEffect(() => {
    if (!currentQuestion) return;
    const listNode = listRef.current;
    const activeNode = itemRefs.current[currentQuestion.id];
    if (!listNode || !activeNode) return;

    const listRect = listNode.getBoundingClientRect();
    const itemRect = activeNode.getBoundingClientRect();
    const comfortTop = listRect.top + listRect.height * 0.34;
    const comfortBottom = listRect.top + listRect.height * 0.66;

    if (itemRect.top >= comfortTop && itemRect.bottom <= comfortBottom) return;

    const targetScrollTop = listNode.scrollTop + itemRect.top - listRect.top - listRect.height / 2 + itemRect.height / 2;
    listNode.scrollTo({ top: Math.max(targetScrollTop, 0), behavior: "smooth" });
  }, [currentQuestion]);

  useEffect(() => {
    const audio = audioRef.current;

    return () => {
      if (replayTimerRef.current) window.clearTimeout(replayTimerRef.current);
      if (!audio) return;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    };
  }, []);

  const play = async () => {
    const audio = audioRef.current;
    if (!audio || !currentQuestion) return;

    setShouldAutoPlay(true);

    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  };

  const pause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (replayTimerRef.current) {
      window.clearTimeout(replayTimerRef.current);
      replayTimerRef.current = null;
    }
    audio.pause();
    setIsPlaying(false);
    setShouldAutoPlay(false);
  };

  const stop = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (replayTimerRef.current) {
      window.clearTimeout(replayTimerRef.current);
      replayTimerRef.current = null;
    }
    audio.pause();
    audio.currentTime = 0;
    playRoundRef.current = 1;
    setCurrentRound(1);
    setIsPlaying(false);
    setShouldAutoPlay(false);
  };

  const goToQuestion = (index: number, autoPlay = false) => {
    if (!questions[index]) return;
    if (replayTimerRef.current) {
      window.clearTimeout(replayTimerRef.current);
      replayTimerRef.current = null;
    }
    playRoundRef.current = 1;
    setCurrentRound(1);
    setCurrentIndex(index);
    setAudioUrlIndex(0);
    setShouldAutoPlay(autoPlay);
    setIsPlaying(false);
  };

  const goToPrevious = () => {
    goToQuestion(Math.max(safeCurrentIndex - 1, 0), isPlaying || shouldAutoPlay);
  };

  const goToNext = (autoPlay = isPlaying || shouldAutoPlay) => {
    const nextIndex = safeCurrentIndex + 1;
    if (nextIndex >= questions.length) {
      stop();
      return;
    }

    goToQuestion(nextIndex, autoPlay);
  };

  const changeType = (type: AudioCollectionType) => {
    const nextGroup = groups.find((group) => group.id === type);
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    if (replayTimerRef.current) {
      window.clearTimeout(replayTimerRef.current);
      replayTimerRef.current = null;
    }

    if (nextGroup) setActiveCollection(nextGroup.collection);
    setActiveType(type);
    setCurrentIndex(0);
    setAudioUrlIndex(0);
    setCurrentRound(1);
    setIsPlaying(false);
    setShouldAutoPlay(false);
    playRoundRef.current = 1;
  };

  const changeCollection = (collection: AudioCollectionKind) => {
    const nextGroup = groups.find((group) => group.collection === collection);
    if (!nextGroup) return;

    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    if (replayTimerRef.current) {
      window.clearTimeout(replayTimerRef.current);
      replayTimerRef.current = null;
    }

    setActiveCollection(collection);
    setActiveType(nextGroup.id);
    setCurrentIndex(0);
    setAudioUrlIndex(0);
    setCurrentRound(1);
    setIsPlaying(false);
    setShouldAutoPlay(false);
    playRoundRef.current = 1;
  };

  const changeQuestionFilter = (filter: QuestionFilter) => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    if (replayTimerRef.current) {
      window.clearTimeout(replayTimerRef.current);
      replayTimerRef.current = null;
    }

    setQuestionFilter(filter);
    setCurrentIndex(0);
    setAudioUrlIndex(0);
    setCurrentRound(1);
    setIsPlaying(false);
    setShouldAutoPlay(false);
    playRoundRef.current = 1;
  };

  const changeRepeatCount = (count: (typeof PLAY_COUNTS)[number]) => {
    if (replayTimerRef.current) {
      window.clearTimeout(replayTimerRef.current);
      replayTimerRef.current = null;
    }
    setRepeatCount(count);
    setCurrentRound(1);
    playRoundRef.current = 1;
  };

  const handleEnded = () => {
    const audio = audioRef.current;
    setIsPlaying(false);

    if (playRoundRef.current < repeatCount && audio) {
      const replayDelay = repeatCount === 2 ? 3000 : 2000;
      replayTimerRef.current = window.setTimeout(() => {
        replayTimerRef.current = null;
        playRoundRef.current += 1;
        setCurrentRound(playRoundRef.current);
        audio.currentTime = 0;
        void audio.play().then(
          () => setIsPlaying(true),
          () => setIsPlaying(false),
        );
      }, replayDelay);
      return;
    }

    goToNext(true);
  };

  const handleAudioError = () => {
    if (audioUrlIndex < currentAudioUrls.length - 1) {
      setAudioUrlIndex((index) => index + 1);
      setShouldAutoPlay(true);
      return;
    }

    setIsPlaying(false);
  };

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 pb-32 pt-4 sm:pb-14 sm:pt-6">
      <Card className="overflow-hidden border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-md)]">
        <CardContent className="relative grid gap-5 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="absolute right-[-8%] top-[-55%] h-64 w-64 rounded-full bg-[var(--primary-soft)] blur-3xl" />
          <div className="relative min-w-0">
            <Badge className="gap-1.5"><Headphones size={13} />Audio Collection</Badge>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">音频合集训练</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)] sm:text-base">集中播放 PTE SST、RL、WFD、RS 和 IELTS 剑桥听力音频。选择训练合集和每题播放次数后，可以连续自动训练，也可以点击列表里的任意音频直接跳转播放。</p>
          </div>
          <div className="relative grid grid-cols-3 gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-3 text-center sm:min-w-[360px]">
            <div><div className="text-xl font-bold text-[var(--text)]">{totalQuestions}</div><div className="mt-1 text-xs text-[var(--text-faint)]">可播放音频</div></div>
            <div><div className="text-xl font-bold text-[var(--primary)]">{pteTotalQuestions}</div><div className="mt-1 text-xs text-[var(--text-faint)]">PTE</div></div>
            <div><div className="text-xl font-bold text-[var(--text)]">{ieltsTotalQuestions}</div><div className="mt-1 text-xs text-[var(--text-faint)]">IELTS</div></div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
        <CardContent className="space-y-5 p-4 sm:p-5">
          <div className="grid gap-3 md:grid-cols-2">
            {COLLECTION_TABS.map((tab) => {
              const active = activeCollection === tab.id;
              const count = groups.filter((group) => group.collection === tab.id).reduce((total, group) => total + group.items.length, 0);

              return (
                <button key={tab.id} type="button" onClick={() => changeCollection(tab.id)} className={`rounded-[var(--radius-md)] border px-4 py-3 text-left transition-all duration-200 ${active ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)] shadow-[var(--shadow-sm)]" : "border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text)] hover:border-[var(--primary)]/40 hover:bg-[var(--card)]"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-bold">{tab.label}</span>
                    <Badge variant={active ? "default" : "secondary"}>{count}</Badge>
                  </div>
                  <div className="mt-1 text-xs font-medium text-[var(--text-soft)]">{tab.subtitle}</div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {activeCollectionGroups.map((group) => (
                <Button key={group.id} type="button" variant={activeGroup?.id === group.id ? "primary" : "secondary"} size="sm" onClick={() => changeType(group.id)} className="gap-1.5">
                  {group.label}<span className="rounded-full bg-current/10 px-2 py-0.5 text-xs">{group.items.length}</span>
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {activeGroup?.collection === "pte" ? (
                <>
                  <Button type="button" variant={questionFilter === "prediction" ? "primary" : "secondary"} size="sm" onClick={() => changeQuestionFilter("prediction")} className="gap-1.5"><Sparkles size={13} />Prediction</Button>
                  <Button type="button" variant={questionFilter === "all" ? "primary" : "secondary"} size="sm" onClick={() => changeQuestionFilter("all")}>所有题目</Button>
                </>
              ) : (
                <Badge variant="secondary">剑桥听力 · 按 Book / Test / Part 连播</Badge>
              )}
              {PLAY_COUNTS.map((count) => (
                <Button key={count} type="button" variant={repeatCount === count ? "primary" : "secondary"} size="sm" onClick={() => changeRepeatCount(count)}>{count} 次</Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
        <Card className="border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
          <CardHeader className="items-start gap-4">
            <div>
              <CardTitle>{activeGroup?.label ?? "Audio"} 连续播放</CardTitle>
              <CardDescription>{activeGroup?.title ?? "Audio practice"} · 当前第 {questions.length > 0 ? safeCurrentIndex + 1 : 0} / {questions.length} 题</CardDescription>
            </div>
            {activeGroup ? (
              <Link href={activeGroup.href}>
                <Button variant="secondary" size="sm" className="gap-2"><ArrowLeft size={15} />返回题库</Button>
              </Link>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-5">
            {currentQuestion ? (
              <>
                <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 sm:p-5">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">第 {safeCurrentIndex + 1} 条</Badge>
                    <Badge>{currentQuestion.label}</Badge>
                    {currentQuestion.collection === "ielts" && currentQuestion.bookNumber ? <Badge variant="success">剑桥 {String(currentQuestion.bookNumber).padStart(2, "0")}</Badge> : null}
                    {currentQuestion.collection === "ielts" && currentQuestion.testNumber ? <Badge variant="secondary">Test {currentQuestion.testNumber}</Badge> : null}
                    {currentQuestion.collection === "ielts" && currentQuestion.partNumber ? <Badge variant="secondary">Part {currentQuestion.partNumber}</Badge> : null}
                    {currentQuestion.sourceQuestionId ? <Badge variant="secondary">{currentQuestion.sourceQuestionId}</Badge> : null}
                    {currentQuestion.isPrediction ? <Badge className="gap-1.5 bg-[var(--primary-soft)] text-[var(--primary)]"><Sparkles size={12} />Prediction</Badge> : null}
                    {currentQuestion.wordCount ? <Badge variant="secondary">{currentQuestion.wordCount} Words</Badge> : null}
                    <Badge variant="secondary">{formatDuration(currentQuestion.durationSeconds)}</Badge>
                  </div>
                  <p className="text-base font-semibold leading-8 text-[var(--text)]">{currentQuestion.text}</p>
                  {currentQuestion.collection === "ielts" && currentQuestion.bookTitle ? <p className="mt-2 text-sm text-[var(--text-soft)]">{currentQuestion.bookTitle}</p> : null}
                </div>

                <SecureAudioPlayer ref={audioRef} src={currentAudioUrl} preload="metadata" title={currentQuestion.text} description={currentQuestion.collection === "ielts" ? `${currentQuestion.label} · Test ${currentQuestion.testNumber ?? "-"} · Part ${currentQuestion.partNumber ?? "-"}` : `${currentQuestion.label} audio practice`} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={handleEnded} onError={handleAudioError} />

                <div className="flex flex-wrap items-center gap-3">
                  <Button type="button" variant="secondary" size="sm" onClick={goToPrevious} disabled={safeCurrentIndex === 0} className="gap-1.5"><SkipBack size={15} />上一题</Button>
                  {isPlaying ? <Button type="button" size="sm" onClick={pause} className="gap-1.5"><Pause size={15} />暂停</Button> : <Button type="button" size="sm" onClick={play} className="gap-1.5"><Play size={15} />播放</Button>}
                  <Button type="button" variant="secondary" size="sm" onClick={stop} className="gap-1.5"><Square size={15} />停止</Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => goToNext(false)} disabled={safeCurrentIndex >= questions.length - 1} className="gap-1.5">下一题<SkipForward size={15} /></Button>
                </div>

                <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 text-sm text-[var(--text-soft)]">
                  <Volume2 size={16} className="text-[var(--primary)]" />
                  <span>当前第 <strong className="text-[var(--text)]">{currentRound}</strong> / {repeatCount} 次；播放结束后自动进入下一题。</span>
                </div>
              </>
            ) : (
              <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] bg-[var(--bg-soft)] p-8 text-center text-sm text-[var(--text-soft)]">
                {activeGroup?.error ? `${activeGroup.label} 音频加载失败：${activeGroup.error}` : "当前题型暂无可播放音频。"}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)] lg:sticky lg:top-24 lg:self-start">
          <CardHeader className="border-b border-[var(--border)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div><CardTitle className="text-base">播放列表</CardTitle><CardDescription>点击音频即可跳转并播放</CardDescription></div>
              <Badge variant="secondary">{questions.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div ref={listRef} className="h-[58vh] overflow-y-auto p-2 sm:h-[62vh] lg:h-[680px]">
              {questions.map((question, index) => {
                const active = index === safeCurrentIndex;

                return (
                  <button key={question.id} ref={(node) => { itemRefs.current[question.id] = node; }} type="button" onClick={() => goToQuestion(index, true)} className={`group w-full rounded-[var(--radius-md)] border px-3 py-3 text-left transition-all duration-150 ${active ? "border-[var(--primary)]/40 bg-[var(--primary-soft)] text-[var(--primary)] shadow-[var(--shadow-sm)]" : "border-transparent bg-transparent text-[var(--text)] hover:border-[var(--border)] hover:bg-[var(--bg-soft)]"}`}>
                    <div className="flex items-center justify-between gap-3">
                      <Badge variant={active ? "default" : "secondary"}>第 {index + 1} 条</Badge>
                      {question.durationSeconds ? <Badge variant="secondary">{formatDuration(question.durationSeconds)}</Badge> : null}
                    </div>
                    <div className={`mt-1 line-clamp-3 text-sm leading-6 ${active ? "font-semibold" : "font-medium"}`}>{question.text}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {question.collection === "ielts" && question.bookNumber ? <Badge variant="secondary">Book {String(question.bookNumber).padStart(2, "0")}</Badge> : null}
                      {question.collection === "ielts" && question.testNumber ? <Badge variant="secondary">Test {question.testNumber}</Badge> : null}
                      {question.collection === "ielts" && question.partNumber ? <Badge variant="secondary">Part {question.partNumber}</Badge> : null}
                      {question.wordCount ? <Badge variant="secondary">{question.wordCount} words</Badge> : null}
                      {question.sourceQuestionId ? <Badge variant="secondary">{question.sourceQuestionId}</Badge> : null}
                      {active ? <Badge className="gap-1 text-[var(--primary)]"><RotateCcw size={12} />active</Badge> : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      {currentQuestion ? (
        <div className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)]/95 p-3 shadow-[var(--shadow-lg)] backdrop-blur lg:hidden">
          <div className="flex items-center gap-3">
            <button type="button" onClick={goToPrevious} disabled={safeCurrentIndex === 0} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text-soft)] disabled:opacity-40"><SkipBack size={16} /></button>
            <button type="button" onClick={isPlaying ? pause : play} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]">{isPlaying ? <Pause size={18} /> : <Play size={18} />}</button>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-[var(--text)]">{currentQuestion.text}</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--text-soft)]"><span>{safeCurrentIndex + 1}/{questions.length}</span><span>·</span><span>{currentQuestion.label}</span><span>·</span><span>{currentRound}/{repeatCount} 次</span></div>
            </div>
            <button type="button" onClick={() => goToNext(false)} disabled={safeCurrentIndex >= questions.length - 1} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text-soft)] disabled:opacity-40"><SkipForward size={16} /></button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
