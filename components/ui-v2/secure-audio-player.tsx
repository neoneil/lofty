"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type AudioHTMLAttributes } from "react";
import { Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";

import { cn } from "@/lib/utils";

type SecureAudioPlayerProps = Omit<AudioHTMLAttributes<HTMLAudioElement>, "controls" | "src"> & {
  src?: string;
  title?: string;
  description?: string;
  compact?: boolean;
  countdown?: number;
  seekTo?: number | null;
  autoPlayKey?: string | number;
  showMeta?: boolean;
  onPlayError?: (error: unknown) => void;
};

function formatTime(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export const SecureAudioPlayer = forwardRef<HTMLAudioElement, SecureAudioPlayerProps>(function SecureAudioPlayer({
  src,
  title = "Audio",
  description,
  compact = false,
  countdown = 0,
  seekTo = null,
  preload = "metadata",
  autoPlay = false,
  autoPlayKey,
  showMeta = true,
  className,
  onLoadedMetadata,
  onTimeUpdate,
  onPlay,
  onPause,
  onEnded,
  onError,
  onContextMenu,
  onPlayError,
  ...audioProps
}, ref) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [countdownLeft, setCountdownLeft] = useState<number | null>(autoPlay && countdown > 0 ? countdown : null);
  const audioSrc = src?.trim() ? src : undefined;

  useImperativeHandle(ref, () => audioRef.current as HTMLAudioElement, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setCountdownLeft(autoPlay && countdown > 0 ? countdown : null);
    audio.load();
  }, [autoPlay, countdown, src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioSrc || !autoPlay) return;

    if (countdownTimerRef.current) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    if (countdown <= 0) {
      void audio.play().catch((error) => {
        setPlaying(false);
        onPlayError?.(error);
      });
      return;
    }

    let current = countdown;
    setCountdownLeft(current);
    countdownTimerRef.current = window.setInterval(() => {
      current -= 1;

      if (current > 0) {
        setCountdownLeft(current);
        return;
      }

      if (countdownTimerRef.current) {
        window.clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      setCountdownLeft(null);

      void audio.play().catch((error) => {
        setPlaying(false);
        onPlayError?.(error);
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) {
        window.clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, [audioSrc, autoPlay, autoPlayKey, countdown, onPlayError]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || seekTo == null) return;

    const nextTime = Math.max(0, seekTo);
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  }, [seekTo]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = muted;
  }, [muted, volume]);

  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current);
    };
  }, []);

  async function togglePlay() {
    const audio = audioRef.current;
    if (!audio || !audioSrc) return;

    if (!audio.paused) {
      audio.pause();
      if (countdownTimerRef.current) {
        window.clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      setCountdownLeft(null);
      return;
    }

    if (countdownTimerRef.current) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdownLeft(null);

    try {
      await audio.play();
    } catch (error) {
      setPlaying(false);
      onPlayError?.(error);
    }
  }

  function seek(value: number) {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    audio.currentTime = value;
    setCurrentTime(value);
  }

  function restart() {
    const audio = audioRef.current;
    if (!audio) return;
    if (countdownTimerRef.current) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdownLeft(null);
    audio.currentTime = 0;
    setCurrentTime(0);
  }

  const progress = duration ? Math.min(Math.max((currentTime / duration) * 100, 0), 100) : 0;

  return (
    <div className={cn("overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]", compact ? "p-3" : "p-4", className)}>
      <audio
        ref={audioRef}
        src={audioSrc}
        preload={preload}
        controlsList="nodownload noplaybackrate noremoteplayback"
        onLoadedMetadata={(event) => {
          setDuration(event.currentTarget.duration || 0);
          onLoadedMetadata?.(event);
        }}
        onTimeUpdate={(event) => {
          setCurrentTime(event.currentTarget.currentTime);
          onTimeUpdate?.(event);
        }}
        onPlay={(event) => {
          setPlaying(true);
          onPlay?.(event);
        }}
        onPause={(event) => {
          setPlaying(false);
          onPause?.(event);
        }}
        onEnded={(event) => {
          setPlaying(false);
          onEnded?.(event);
        }}
        onError={(event) => {
          setPlaying(false);
          onError?.(event);
        }}
        onContextMenu={(event) => {
          event.preventDefault();
          onContextMenu?.(event);
        }}
        className="hidden"
        {...audioProps}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="button" onClick={togglePlay} disabled={!audioSrc} className={cn("flex shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary)] text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50", compact ? "h-10 w-10" : "h-12 w-12")} aria-label={playing ? "暂停音频" : "播放音频"}>
          {countdownLeft !== null ? <span className="text-sm font-bold tabular-nums">{countdownLeft}</span> : playing ? <Pause size={compact ? 17 : 20} /> : <Play size={compact ? 17 : 20} />}
        </button>

        <div className="min-w-0 flex-1">
          <div className={cn("mb-2 flex items-center gap-3", showMeta ? "justify-between" : "justify-end")}>
            {showMeta ? <div className="min-w-0"><div className={cn("truncate font-semibold text-[var(--text)]", compact ? "text-sm" : "text-base")}>{title}</div>{description ? <div className="mt-0.5 truncate text-xs text-[var(--text-soft)]">{description}</div> : null}</div> : null}
            <div className="shrink-0 font-mono text-xs text-[var(--text-soft)]">{formatTime(currentTime)} / {formatTime(duration)}</div>
          </div>

          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={duration ? currentTime : 0}
            onChange={(event) => seek(Number(event.target.value))}
            disabled={!audioSrc || !duration}
            aria-label="音频进度"
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[var(--bg-soft)] disabled:cursor-not-allowed [&::-moz-range-progress]:h-2 [&::-moz-range-progress]:rounded-full [&::-moz-range-progress]:bg-[var(--primary)] [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[var(--primary)] [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-thumb]:mt-[-4px] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--primary)]"
            style={{ background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${progress}%, var(--bg-soft) ${progress}%, var(--bg-soft) 100%)` }}
          />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={restart} disabled={!audioSrc} className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text-soft)] transition hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50" aria-label="重新播放">
            <RotateCcw size={15} />
          </button>
          <button type="button" onClick={() => setMuted((value) => !value)} disabled={!audioSrc} className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text-soft)] transition hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50" aria-label={muted ? "取消静音" : "静音"}>
            {muted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
            disabled={!audioSrc}
            aria-label="音量"
            className="hidden h-2 w-20 cursor-pointer appearance-none rounded-full bg-[var(--bg-soft)] disabled:cursor-not-allowed md:block [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-thumb]:mt-[-4px] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--primary)]"
            style={{ background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${volume * 100}%, var(--bg-soft) ${volume * 100}%, var(--bg-soft) 100%)` }}
          />
        </div>
      </div>
    </div>
  );
});
