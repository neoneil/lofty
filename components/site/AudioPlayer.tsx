"use client";

import { useEffect, useRef, useState } from "react";

export default function AudioPlayer({
  url,
  autoPlay = false,
  countdown = 0,
}: {
  url: string;
  autoPlay?: boolean;
  countdown?: number;
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

  // ===== 初始化 =====
  useEffect(() => {

    const audio = new Audio(url);

    audioRef.current = audio;

    audio.volume = volume;

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
    };

    return () => {
      audio.pause();
    };

  }, [url]);
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

      audio.play();

      setPlaying(true);

      return;
    }

    setCountdownLeft(countdown);

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

        audio.play();

        setPlaying(true);

      }, 1000);

    return () => {

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

        } catch (err) {

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
      className="
        w-full lg:w-[80%]
        relative overflow-hidden
        rounded-3xl

        border border-[#14b8a6]/15

        bg-white/85

        p-5

        shadow-[0_12px_40px_rgba(20,184,166,0.08)]

        backdrop-blur-xl
      "
    >

      {/* 背景柔光 */}
      <div
        className="
          pointer-events-none
          absolute inset-0

          bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.08),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.08),transparent_35%)]
        "
      />

      <div
        className="
          relative
          flex items-center gap-5
        "
      >

        {/* ===== 播放按钮 ===== */}
        <div
          className="
            flex h-16 w-16 shrink-0
            flex-col items-center justify-center

            rounded-2xl

            border border-[#14b8a6]/15

            bg-[#14b8a6]

            text-white

            shadow-[0_10px_30px_rgba(20,184,166,0.25)]

            transition-all duration-300

            hover:scale-[1.03]
          "
        >

          {countdownLeft !== null ? (

            <>

              <div
                className="
                  text-xl
                  font-bold
                  leading-none
                "
              >
                {countdownLeft}
              </div>

              <button
                type="button"
                onClick={skipCountdown}
                className="
                  mt-1
                  cursor-pointer
                  text-[12px]
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

            </>

          ) : (

            <button
              type="button"
              onClick={togglePlay}
              className="
                flex h-full w-full
                items-center justify-center

                text-lg
                font-semibold
              "
            >
              {playing
                ? "❚❚"
                : "▶"}
            </button>

          )}

        </div>

        {/* ===== 中间区域 ===== */}
        <div
          className="
            flex flex-1
            items-center gap-5
          "
        >

          {/* ===== 波形 ===== */}
          <div
            className="
              relative
              flex h-16 flex-1

              cursor-pointer
              items-end gap-[2px]

              overflow-hidden

              rounded-2xl

              border border-[#14b8a6]/10

              bg-[#14b8a6]/5

              px-3 py-2
            "
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

                from-[#14b8a6]/5
                via-[#3b82f6]/5
                to-[#3b82f6]/5
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
                      ? "bg-[#14b8a6]"
                      : "bg-[#14b8a6]/15"
                    }
                  `}
                  style={{
                    height: `${v * 90 + 10}px`,
                    width: "3px",
                    opacity: played ? 1 : 0.45,

                    boxShadow: played
                      ? "0 0 10px rgba(20,184,166,0.35)"
                      : "none",
                  }}
                />

              );

            })}

          </div>

          {/* ===== 时间 ===== */}
          <div
            className="
              w-28 shrink-0
              whitespace-nowrap

              text-sm
              font-medium

              tracking-wide

              text-[#0f172a]/70

              font-mono
            "
          >
            {formatTime(currentTime)}
            {" / "}
            {formatTime(duration)}
          </div>

          {/* ===== 音量 ===== */}
          <div
            className="
              hidden
              w-32 shrink-0
              items-center gap-3

              md:flex
            "
          >

            <span
              className="
                text-[#14b8a6]
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

                bg-[#14b8a6]/15

                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:h-3
                [&::-webkit-slider-thumb]:w-3
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-[#14b8a6]
                [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(20,184,166,0.35)]
              "
            />

          </div>

        </div>

      </div>

    </div>

  );

}