"use client";

import { useEffect, useRef, useState } from "react";

export default function AudioPlayer({
  url,
}: {
  url: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [playing, setPlaying] = useState(false);

  const [progress, setProgress] = useState(0);

  const [waveform, setWaveform] = useState<number[]>([]);

  const [currentTime, setCurrentTime] = useState(0);

  const [duration, setDuration] = useState(0);

  const [volume, setVolume] = useState(1);

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
      if (!isDraggingRef.current && audio.duration) {
        setProgress(audio.currentTime / audio.duration);
      }

      setCurrentTime(audio.currentTime);
    };

    audio.onended = () => {
      setPlaying(false);
    };

    return () => {
      audio.pause();
    };
  }, [url, volume]);

  // ===== waveform =====
  useEffect(() => {
    const generateWaveform = async () => {
      try {
        const res = await fetch(url);

        const buffer = await res.arrayBuffer();

        const ctx = new AudioContext();

        const audioBuffer =
          await ctx.decodeAudioData(buffer);

        const raw = audioBuffer.getChannelData(0);

        const samples = 80;

        const blockSize = Math.floor(
          raw.length / samples
        );

        const data: number[] = [];

        for (let i = 0; i < samples; i++) {
          let sum = 0;

          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(
              raw[i * blockSize + j]
            );
          }

          data.push(sum / blockSize);
        }

        setWaveform(data);
      }


      catch (err) {

        console.warn(
          "waveform disabled for this audio"
        );

        setWaveform(
          Array.from({ length: 60 }, () =>
            Math.random() * 0.6 + 0.2
          )
        );
      }

    };

    generateWaveform();
  }, [url]);

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

    if (!audio || !audio.duration) return;

    audio.currentTime = percent * audio.duration;

    setProgress(percent);
  };

  // ===== 时间格式 =====
  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";

    const mins = Math.floor(time / 60);

    const secs = Math.floor(time % 60);

    return `${mins}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div
      className={`
        w-full lg:w-[80%]
        relative overflow-hidden round
        border border-white/10
        bg-[var(--theme)]
        p-5
        shadow-[0_0_50px_rgba(79,70,229,0.18)]
        backdrop-blur-2xl
        transition-all duration-300

      `}
    >
      {/* ===== 背景发光 ===== */}
      <div
        className="
          pointer-events-none absolute inset-0
          bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.22),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.18),transparent_35%)]
        "
      />

      <div className="relative flex items-center gap-5">
        {/* ===== 播放按钮 ===== */}
        <button
          onClick={togglePlay}
          className={`
            flex h-14 w-14 shrink-0 items-center justify-center cursor-pointer
            rounded
            bg-gradient-to-br
            from-indigo-400
            via-violet-500
            to-fuchsia-500
            text-white
            shadow-[0_0_30px_rgba(139,92,246,0.65)]
            transition-all duration-300
            hover:scale-105
            hover:shadow-[0_0_45px_rgba(139,92,246,0.9)]
            active:scale-95
          `}
        >
          {playing ? (
            <span className="text-sm">
              ❚❚
            </span>
          ) : (
            <span className="ml-[2px] text-sm">
              ▶
            </span>
          )}
        </button>

        {/* ===== 中间区域 ===== */}
        <div className="flex flex-1 items-center gap-5">
          {/* ===== 波形 ===== */}
          <div
            className="
              relative flex h-16 flex-1
              cursor-pointer items-end gap-[2px]
              overflow-hidden rounded
              border border-white/5
              bg-white/[0.03]
              px-3 py-2
              backdrop-blur-xl
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
            {/* ===== 波形 glow ===== */}
            <div
              className="
                pointer-events-none absolute inset-0
                bg-gradient-to-r
                from-cyan-500/5
                via-indigo-500/5
                to-fuchsia-500/5
              "
            />

            {waveform.map((v, i) => {
              const played =
                i / waveform.length < progress;

              return (
                <div
                  key={i}
                  className={`
                    relative rounded
                    transition-all duration-150
                    ${played
                      ? "bg-gradient-to-t from-cyan-400 to-indigo-500"
                      : "bg-white/10"
                    }
                  `}
                  style={{
                    height: `${v * 90 + 10
                      }px`,
                    width: "3px",
                    opacity: played ? 1 : 0.55,
                    boxShadow: played
                      ? "0 0 12px rgba(99,102,241,0.55)"
                      : "none",
                  }}
                />
              );
            })}
          </div>

          {/* ===== 时间 ===== */}
          <div
            className="
              w-28 shrink-0 whitespace-nowrap
              text-sm font-medium
              tracking-wide text-white/70
              font-mono
            "
          >
            {formatTime(currentTime)} /{" "}
            {formatTime(duration)}
          </div>

          {/* ===== 音量 ===== */}
          <div
            className="
              hidden w-32 shrink-0 items-center gap-3
              md:flex
            "
          >
            <span className="text-white/60">
              🔊
            </span>

            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => {
                const v = Number(
                  e.target.value
                );

                setVolume(v);

                if (audioRef.current) {
                  audioRef.current.volume = v;
                }
              }}
              className="
                h-[3px] w-full cursor-pointer
                appearance-none rounded
                bg-white/15

                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:h-3
                [&::-webkit-slider-thumb]:w-3
                [&::-webkit-slider-thumb]:rounded
                [&::-webkit-slider-thumb]:bg-cyan-400
                [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(34,211,238,0.9)]
              "
            />
          </div>
        </div>
      </div>
    </div>
  );
}