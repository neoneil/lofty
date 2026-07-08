"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Headphones, Pause, Play, RotateCcw, SkipBack, SkipForward, Sparkles, Square, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui-v2/card";

export type AudioCollectionType = "sst" | "rl" | "wfd" | "rs";

export type AudioCollectionItem = {
  id: string;
  type: AudioCollectionType;
  label: string;
  text: string;
  sourceQuestionId: string | null;
  isPrediction: boolean;
  audioUrl: string;
  durationSeconds: number | null;
  wordCount: number;
};

export type AudioCollectionGroup = {
  id: AudioCollectionType;
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
  const [questionFilter, setQuestionFilter] = useState<QuestionFilter>("prediction");
  const [repeatCount, setRepeatCount] = useState<(typeof PLAY_COUNTS)[number]>(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shouldAutoPlay, setShouldAutoPlay] = useState(false);

  const activeGroup = useMemo(() => groups.find((group) => group.id === activeType) ?? groups[0], [activeType, groups]);
  const questions = useMemo(() => {
    const items = activeGroup?.items ?? [];
    if (questionFilter === "prediction") return items.filter((item) => item.isPrediction);
    return items;
  }, [activeGroup, questionFilter]);
  const safeCurrentIndex = questions.length > 0 ? Math.min(currentIndex, questions.length - 1) : 0;
  const currentQuestion = questions[safeCurrentIndex] ?? null;
  const totalQuestions = groups.reduce((total, group) => total + group.items.length, 0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentQuestion) return;

    playRoundRef.current = 1;
    setCurrentRound(1);
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
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    if (replayTimerRef.current) {
      window.clearTimeout(replayTimerRef.current);
      replayTimerRef.current = null;
    }

    setActiveType(type);
    setCurrentIndex(0);
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

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 pb-10 pt-4 sm:pb-14 sm:pt-6">
      <Card className="overflow-hidden border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-md)]">
        <CardContent className="relative grid gap-5 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="absolute right-[-8%] top-[-55%] h-64 w-64 rounded-full bg-[var(--primary-soft)] blur-3xl" />
          <div className="relative min-w-0">
            <Badge className="gap-1.5"><Headphones size={13} />Audio Collection</Badge>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">PTE 音频合集训练</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)] sm:text-base">集中播放 SST、RL、WFD、RS 的音频题。选择题型和每题播放次数后，可以连续自动训练，也可以点击列表里的任意题直接跳转播放。</p>
          </div>
          <div className="relative grid grid-cols-2 gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-3 text-center sm:min-w-[260px]">
            <div><div className="text-xl font-bold text-[var(--text)]">{totalQuestions}</div><div className="mt-1 text-xs text-[var(--text-faint)]">可播放音频</div></div>
            <div><div className="text-xl font-bold text-[var(--primary)]">{questions.length}</div><div className="mt-1 text-xs text-[var(--text-faint)]">当前题型</div></div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {groups.map((group) => (
                <Button key={group.id} type="button" variant={activeType === group.id ? "primary" : "secondary"} size="sm" onClick={() => changeType(group.id)} className="gap-1.5">
                  {group.label}<span className="rounded-full bg-current/10 px-2 py-0.5 text-xs">{group.items.length}</span>
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant={questionFilter === "prediction" ? "primary" : "secondary"} size="sm" onClick={() => changeQuestionFilter("prediction")} className="gap-1.5"><Sparkles size={13} />Prediction</Button>
              <Button type="button" variant={questionFilter === "all" ? "primary" : "secondary"} size="sm" onClick={() => changeQuestionFilter("all")}>所有题目</Button>
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
                    <Badge>{currentQuestion.label} #{safeCurrentIndex + 1}</Badge>
                    {currentQuestion.sourceQuestionId ? <Badge variant="secondary">{currentQuestion.sourceQuestionId}</Badge> : null}
                    {currentQuestion.isPrediction ? <Badge className="gap-1.5 bg-[var(--primary-soft)] text-[var(--primary)]"><Sparkles size={12} />Prediction</Badge> : null}
                    <Badge variant="secondary">{currentQuestion.wordCount} Words</Badge>
                    <Badge variant="secondary">{formatDuration(currentQuestion.durationSeconds)}</Badge>
                  </div>
                  <p className="text-base font-semibold leading-8 text-[var(--text)]">{currentQuestion.text}</p>
                </div>

                <audio ref={audioRef} controls className="w-full" src={currentQuestion.audioUrl} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={handleEnded} />

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
              <div><CardTitle className="text-base">播放列表</CardTitle><CardDescription>点击题目即可跳转并播放</CardDescription></div>
              <Badge variant="secondary">{questions.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div ref={listRef} className="h-[58vh] overflow-y-auto p-2 sm:h-[62vh] lg:h-[680px]">
              {questions.map((question, index) => {
                const active = index === safeCurrentIndex;

                return (
                  <button key={question.id} ref={(node) => { itemRefs.current[question.id] = node; }} type="button" onClick={() => goToQuestion(index, true)} className={`group w-full rounded-[var(--radius-md)] border border-transparent px-3 py-3 text-left transition-colors duration-150 ${active ? "text-[var(--primary)]" : "text-[var(--text)] hover:bg-[var(--bg-soft)]"}`}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-bold">#{index + 1}</span>
                      <span className="text-xs text-[var(--text-soft)]">{formatDuration(question.durationSeconds)}</span>
                    </div>
                    <div className={`mt-1 line-clamp-3 text-sm leading-6 ${active ? "font-semibold" : "font-medium"}`}>{question.text}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-faint)]">
                      <span>{question.wordCount} words</span>
                      {question.sourceQuestionId ? <span>{question.sourceQuestionId}</span> : null}
                      {active ? <span className="inline-flex items-center gap-1 font-semibold text-[var(--primary)]"><RotateCcw size={12} />active</span> : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
