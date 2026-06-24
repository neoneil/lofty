"use client";

import { useEffect, useRef, useState } from "react";

export default function AudioPlayer({
  url,
  autoPlay = false,
  countdown = 0,
  size = "default",
  onEnded,
}: {
  url: string;
  autoPlay?: boolean;
  countdown?: number;
  size?: "default" | "compact";
  onEnded?: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [playing, setPlaying] = useState(false);

  const [progress, setProgress] = useState(0);

  const [waveform, setWaveform] = useState<number[]>([]);

  const [currentTime, setCurrentTime] = useState(0);

  const [duration, setDuration] = useState(0);

  const [volume, setVolume] = useState(1);

  const [countdownLeft, setCountdownLeft] = useState<number | null>(
    autoPlay && countdown > 0
      ? countdown
      : null
  );

  const countdownTimerRef =
    useRef<NodeJS.Timeout | null>(null);

  const isDraggingRef = useRef(false);

  const compact = size === "compact";

  const pauseAudio = () => {
    const audio = audioRef.current;

    if (!audio) return;

    audio.pause();
    setPlaying(false);

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    setCountdownLeft(null);
  };

  // ===== 初始化 =====
  useEffect(() => {

    const audio = new Audio(url);

    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      setDuration(audio.duration || 0);
    };

    audio.ontimeupdate = () => {

      if (
        !isDraggingRef.current &&
        audio.duration
      ) {
        setProgress(
          audio.currentTime / audio.duration
        );
      }

      setCurrentTime(audio.currentTime);
    };

    audio.onended = () => {
      setPlaying(false);
      onEnded?.();
    };

    return () => {
      audio.pause();
    };

  }, [url, onEnded]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        pauseAudio();
      }
    };

    window.addEventListener("pagehide", pauseAudio);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", pauseAudio);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  });
  // ===== 音量同步 =====
  useEffect(() => {

    if (!audioRef.current) return;

    audioRef.current.volume = volume;

  }, [volume]);
  // ===== 自动播放倒计时 =====
  useEffect(() => {

    if (!autoPlay) return;

    const audio = audioRef.current;

    if (!audio) return;

    // 无倒计时
    if (countdown <= 0) {

      void audio.play().then(() => {
        setPlaying(true);
      });

      return;
    }

    const setInitialCountdown = window.setTimeout(() => {
      setCountdownLeft(countdown);
    }, 0);

    let current = countdown;

    countdownTimerRef.current =
      setInterval(() => {

        if (
          !countdownTimerRef.current
        ) {
          return;
        }

        current -= 1;

        if (current > 0) {

          setCountdownLeft(current);

          return;
        }

        clearInterval(
          countdownTimerRef.current
        );

        countdownTimerRef.current =
          null;

        setCountdownLeft(null);

        if (!audio.paused) {
          return;
        }

        void audio.play().then(() => {
          setPlaying(true);
        });

      }, 1000);

    return () => {
      clearTimeout(setInitialCountdown);

      if (
        countdownTimerRef.current
      ) {

        clearInterval(
          countdownTimerRef.current
        );

        countdownTimerRef.current =
          null;
      }

    };

  }, [autoPlay, countdown, url]);

  // ===== waveform =====
  useEffect(() => {

    const generateWaveform =
      async () => {

        try {

          const res =
            await fetch(url);

          const buffer =
            await res.arrayBuffer();

          const ctx =
            new AudioContext();

          const audioBuffer =
            await ctx.decodeAudioData(
              buffer
            );

          const raw =
            audioBuffer.getChannelData(0);

          const samples = 80;

          const blockSize =
            Math.floor(
              raw.length / samples
            );

          const data: number[] = [];

          for (
            let i = 0;
            i < samples;
            i++
          ) {

            let sum = 0;

            for (
              let j = 0;
              j < blockSize;
              j++
            ) {

              sum += Math.abs(
                raw[
                i * blockSize + j
                ]
              );
            }

            data.push(sum / blockSize);
          }

          setWaveform(data);

        } catch {

          console.warn(
            "waveform disabled for this audio"
          );

          setWaveform(
            Array.from(
              { length: 60 },
              () =>
                Math.random() * 0.6 + 0.2
            )
          );
        }

      };

    generateWaveform();

  }, [url]);

  // ===== skip =====
  const skipCountdown = () => {

    const audio = audioRef.current;

    if (!audio) return;

    if (
      countdownTimerRef.current
    ) {

      clearInterval(
        countdownTimerRef.current
      );

      countdownTimerRef.current =
        null;
    }

    setCountdownLeft(null);

    if (!audio.paused) {
      return;
    }

    audio.play();

    setPlaying(true);

  };

  // ===== 播放 =====
  const togglePlay = () => {

    const audio = audioRef.current;

    if (!audio) return;

    if (playing) {

      audio.pause();

      setPlaying(false);

    } else {

      audio.play();

      setPlaying(true);
    }

  };

  // ===== 跳转 =====
  const seek = (percent: number) => {

    const audio = audioRef.current;

    if (
      !audio ||
      !audio.duration
    ) return;

    audio.currentTime =
      percent * audio.duration;

    setProgress(percent);

  };

  // ===== 时间格式 =====
  const formatTime = (
    time: number
  ) => {

    if (
      !time ||
      isNaN(time)
    ) {
      return "0:00";
    }

    const mins =
      Math.floor(time / 60);

    const secs =
      Math.floor(time % 60);

    return `${mins}:${secs
      .toString()
      .padStart(2, "0")}`;

  };

  return (

    <div
      className={`
        w-full
        relative overflow-hidden
        ${compact ? "rounded-2xl p-3" : "rounded-3xl p-5"}

        border border-[var(--border)]

        bg-[color:var(--card)]/90

        shadow-[var(--shadow-md)]

        backdrop-blur-xl
      `}
    >

      {/* 背景柔光 */}
      <div
        className="
          pointer-events-none
          absolute inset-0

          bg-[radial-gradient(circle_at_top_right,var(--primary-soft),transparent_35%),radial-gradient(circle_at_bottom_left,var(--bg-soft),transparent_35%)]
        "
      />

      <div
        className={`
          relative
          flex items-center ${compact ? "gap-3" : "gap-4"}
        `}
      >

        {/* ===== 播放按钮 ===== */}
        <div
          className={`
            flex shrink-0
            flex-col items-center justify-center

            ${compact ? "h-10 w-10 rounded-xl" : "h-16 w-16 rounded-2xl"}

            border border-[var(--primary)]/20

            bg-[var(--primary)]

            text-white

            shadow-[var(--shadow-md)]

            transition-all duration-300

            hover:scale-[1.03]
          `}
        >

          {countdownLeft !== null ? (

            <div className="flex translate-y-0.5 flex-col items-center">

              <div
                className={`
                  ${compact ? "text-sm" : "text-xl"}
                  font-bold
                  leading-none
                `}
              >
                {countdownLeft}
              </div>

              <button
                type="button"
                onClick={skipCountdown}
                className="
                  mt-1
                  cursor-pointer
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-wider

                  text-white/80

                  transition

                  hover:text-white
                "
              >
                Skip
              </button>

            </div>

          ) : (

            <button
              type="button"
              onClick={togglePlay}
              className={`
                flex h-full w-full
                items-center justify-center

                ${compact ? "text-sm" : "text-lg"}
                font-semibold
              `}
            >
              {playing
                ? "❚❚"
                : "▶"}
            </button>

          )}

        </div>

        {/* ===== 中间区域 ===== */}
        <div
          className={`
            flex min-w-0 flex-1
            items-center ${compact ? "gap-3" : "gap-4"}
          `}
        >

          {/* ===== 波形 ===== */}
          <div
            className={`
              relative
              flex min-w-[120px] flex-1
              ${compact ? "h-10 rounded-xl px-2 py-1.5" : "h-16 rounded-2xl px-3 py-2"}

              cursor-pointer
              items-end gap-[2px]

              overflow-hidden

              border border-[var(--border)]

              bg-[var(--bg-soft)]
            `}
            onClick={(e) => {

              const rect =
                e.currentTarget.getBoundingClientRect();

              const percent =
                (e.clientX - rect.left) /
                rect.width;

              seek(percent);

            }}
          >

            {/* glow */}
            <div
              className="
                pointer-events-none
                absolute inset-0

                bg-gradient-to-r

                from-[var(--primary-soft)]
                via-transparent
                to-[var(--bg-soft)]
              "
            />

            {waveform.map((v, i) => {

              const played =
                i / waveform.length <
                progress;

              return (

                <div
                  key={i}
                  className={`
                    relative rounded
                    transition-all duration-150

                    ${played
                      ? "bg-[var(--primary)]"
                      : "bg-[var(--primary-soft)]"
                    }
                  `}
                  style={{
                    height: `${v * (compact ? 52 : 90) + (compact ? 6 : 10)}px`,
                    width: compact ? "2px" : "3px",
                    opacity: played ? 1 : 0.45,

                    boxShadow: played
                      ? "0 0 10px color-mix(in srgb, var(--primary) 35%, transparent)"
                      : "none",
                  }}
                />

              );

            })}

          </div>

          {/* ===== 时间 ===== */}
          <div
            className={`
              ${compact ? "w-20 text-xs" : "w-28 text-sm"} shrink-0
              whitespace-nowrap

              font-medium

              tracking-wide

              text-[var(--text-soft)]

              font-mono
            `}
          >
            {formatTime(currentTime)}
            {" / "}
            {formatTime(duration)}
          </div>

          {/* ===== 音量 ===== */}
          <div
            className={`
              hidden
              ${compact ? "w-20 gap-2" : "w-24 gap-3"} shrink-0
              items-center

              md:flex
            `}
          >

            <span
              className="
                text-[var(--primary)]
              "
            >
              🔊
            </span>

            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => {

                const v =
                  Number(
                    e.target.value
                  );

                setVolume(v);

                if (
                  audioRef.current
                ) {
                  audioRef.current.volume =
                    v;
                }

              }}
              className="
                h-[4px]
                w-full

                cursor-pointer

                appearance-none

                rounded-full

                bg-[var(--primary-soft)]

                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:h-3
                [&::-webkit-slider-thumb]:w-3
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-[var(--primary)]
                [&::-webkit-slider-thumb]:shadow-[0_0_10px_color-mix(in_srgb,var(--primary)_35%,transparent)]
              "
            />

          </div>

        </div>

      </div>

    </div>

  );

}
