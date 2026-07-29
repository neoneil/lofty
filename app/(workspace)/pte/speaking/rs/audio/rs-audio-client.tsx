"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Headphones,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Square,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { SecureAudioPlayer } from "@/components/ui-v2/secure-audio-player";

type RsAudioQuestion = {
  id: string;
  question_text: string;
  source_question_id: string | null;
  is_prediction: boolean | null;
  audio_url: string;
  audio_duration_seconds: number | null;
};

type FilterMode = "all" | "prediction";

type Props = {
  questions: RsAudioQuestion[];
};

function getWordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function formatDuration(seconds: number | null) {
  if (!seconds || !Number.isFinite(seconds)) {
    return "--:--";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

export default function RsAudioClient({ questions }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [filterMode, setFilterMode] = useState<FilterMode>("prediction");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoContinue, setAutoContinue] = useState(true);
  const [shouldAutoPlay, setShouldAutoPlay] = useState(false);

  const filteredQuestions = useMemo(() => {
    if (filterMode === "prediction") {
      return questions.filter((question) => question.is_prediction);
    }

    return questions;
  }, [filterMode, questions]);

  const safeCurrentIndex =
    filteredQuestions.length > 0
      ? Math.min(currentIndex, filteredQuestions.length - 1)
      : 0;
  const currentQuestion = filteredQuestions[safeCurrentIndex] ?? null;

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !currentQuestion) {
      return;
    }

    audio.load();

    if (!shouldAutoPlay) {
      return;
    }

    void audio.play().then(
      () => setIsPlaying(true),
      () => setIsPlaying(false),
    );
  }, [currentQuestion, shouldAutoPlay]);

  const play = async () => {
    const audio = audioRef.current;

    if (!audio || !currentQuestion) {
      return;
    }

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

    if (!audio) {
      return;
    }

    audio.pause();
    setIsPlaying(false);
    setShouldAutoPlay(false);
  };

  const stop = () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setShouldAutoPlay(false);
  };

  const changeFilterMode = (mode: FilterMode) => {
    const audio = audioRef.current;

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    setFilterMode(mode);
    setCurrentIndex(0);
    setIsPlaying(false);
    setShouldAutoPlay(false);
  };

  const goToQuestion = (index: number, autoPlay = false) => {
    if (!filteredQuestions[index]) {
      return;
    }

    setCurrentIndex(index);
    setShouldAutoPlay(autoPlay);
    setIsPlaying(false);
  };

  const goToPrevious = () => {
    goToQuestion(Math.max(safeCurrentIndex - 1, 0), isPlaying || shouldAutoPlay);
  };

  const goToNext = (autoPlay = isPlaying || shouldAutoPlay) => {
    const nextIndex = safeCurrentIndex + 1;

    if (nextIndex >= filteredQuestions.length) {
      stop();
      return;
    }

    goToQuestion(nextIndex, autoPlay);
  };

  const handleEnded = () => {
    setIsPlaying(false);

    if (autoContinue) {
      goToNext(true);
    }
  };

  return (
    <section className="mx-auto w-full max-w-7xl space-y-5 px-4 sm:px-6 lg:max-w-[84%] lg:px-0">
      <div className="rounded-[var(--radius-lg)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="gap-1.5 px-2.5 py-1">
                <Headphones size={12} />
                RS Audio
              </Badge>
              <Badge variant="secondary" className="px-2.5 py-1">
                {filteredQuestions.length} / {questions.length}
              </Badge>
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-[var(--text)]">
              RS 连续音频播放
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
              选择全部或 Prediction 题目，按顺序连续播放，也可以点击列表跳转到任意题。
            </p>
          </div>

          <Link href="/pte/speaking/rs">
            <Button variant="secondary" className="gap-2">
              <ArrowLeft size={16} />
              返回 RS 列表
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-[var(--radius-lg)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant={filterMode === "all" ? "primary" : "secondary"}
              onClick={() => changeFilterMode("all")}
            >
              全部
            </Button>
            <Button
              type="button"
              variant={filterMode === "prediction" ? "primary" : "secondary"}
              onClick={() => changeFilterMode("prediction")}
              className="gap-2"
            >
              <Sparkles size={16} />
              Prediction
            </Button>

            <label className="ml-auto inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-[var(--text-soft)]">
              <input
                type="checkbox"
                checked={autoContinue}
                onChange={(event) => setAutoContinue(event.target.checked)}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              连续播放
            </label>
          </div>

          {currentQuestion ? (
            <div className="mt-6 space-y-5">
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-5">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge className="px-2.5 py-1">
                    {safeCurrentIndex + 1}
                  </Badge>
                  <Badge variant="secondary" className="px-2.5 py-1">
                    {getWordCount(currentQuestion.question_text)} Words
                  </Badge>
                  {currentQuestion.source_question_id ? (
                    <Badge variant="secondary" className="px-2.5 py-1">
                      {currentQuestion.source_question_id}
                    </Badge>
                  ) : null}
                  {currentQuestion.is_prediction ? (
                    <Badge className="gap-1.5 bg-[var(--primary-soft)] px-2.5 py-1 text-[var(--primary)]">
                      <Sparkles size={12} />
                      Prediction
                    </Badge>
                  ) : null}
                  <Badge variant="secondary" className="px-2.5 py-1">
                    {formatDuration(currentQuestion.audio_duration_seconds)}
                  </Badge>
                </div>

                <p className="text-base font-medium leading-8 text-[var(--text)]">
                  {currentQuestion.question_text}
                </p>
              </div>

              <SecureAudioPlayer
                ref={audioRef}
                src={currentQuestion.audio_url}
                title={currentQuestion.question_text}
                description="RS audio practice"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={handleEnded}
              />

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={goToPrevious}
                  disabled={safeCurrentIndex === 0}
                  className="gap-2"
                >
                  <SkipBack size={16} />
                  上一题
                </Button>

                {isPlaying ? (
                  <Button type="button" onClick={pause} className="gap-2">
                    <Pause size={16} />
                    暂停
                  </Button>
                ) : (
                  <Button type="button" onClick={play} className="gap-2">
                    <Play size={16} />
                    播放
                  </Button>
                )}

                <Button
                  type="button"
                  variant="secondary"
                  onClick={stop}
                  className="gap-2"
                >
                  <Square size={16} />
                  停止
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => goToNext(false)}
                  disabled={safeCurrentIndex >= filteredQuestions.length - 1}
                  className="gap-2"
                >
                  下一题
                  <SkipForward size={16} />
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--bg-soft)] p-8 text-center text-sm text-[var(--text-soft)]">
              当前筛选下没有可播放的 RS 音频。
            </div>
          )}
        </div>

        <div className="max-h-[720px] overflow-hidden rounded-[var(--radius-lg)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
          <div className="border-b border-[var(--border)] px-4 py-3">
            <div className="text-sm font-semibold text-[var(--text)]">
              播放列表
            </div>
            <div className="mt-1 text-xs text-[var(--text-soft)]">
              点击题目即可跳转并播放
            </div>
          </div>

          <div className="max-h-[650px] overflow-y-auto p-2">
            {filteredQuestions.map((question, index) => {
              const active = index === safeCurrentIndex;

              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => goToQuestion(index, true)}
                  className={`w-full rounded-[var(--radius-sm)] px-3 py-3 text-left transition-all duration-200 ${
                    active
                      ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                      : "text-[var(--text)] hover:bg-[var(--bg-soft)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold">
                      {index + 1}
                    </span>
                    <span className="text-xs text-[var(--text-soft)]">
                      {formatDuration(question.audio_duration_seconds)}
                    </span>
                  </div>
                  <div className="mt-1 line-clamp-2 text-sm font-medium leading-6">
                    {question.question_text}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
