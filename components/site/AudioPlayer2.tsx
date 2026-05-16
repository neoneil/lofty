"use client";

import { useEffect, useRef, useState } from "react";

export default function AudioPlayer({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [playing, setPlaying] = useState(false);

  const [progress, setProgress] = useState(0);

  const [waveform, setWaveform] = useState<number[]>([]);

  const [currentTime, setCurrentTime] = useState(0);

  const [duration, setDuration] = useState(0);

  const [volume, setVolume] = useState(1);

  const isDraggingRef = useRef(false);

  // ===== 初始化 audio =====
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

        const audioBuffer = await ctx.decodeAudioData(buffer);

        const raw = audioBuffer.getChannelData(0);

        const samples = 80;

        const blockSize = Math.floor(raw.length / samples);

        const data: number[] = [];

        for (let i = 0; i < samples; i++) {
          let sum = 0;

          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(raw[i * blockSize + j]);
          }

          data.push(sum / blockSize);
        }

        setWaveform(data);
      } catch (err) {
        console.error("waveform error", err);
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

    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className="
        w-full rounded-3xl border border-gray-200
        bg-white/90 p-4 shadow-sm backdrop-blur
      "
    >
      <div className="flex items-center gap-4">
        {/* ===== 播放按钮 ===== */}
        <button
          onClick={togglePlay}
          className="
            flex h-12 w-12 shrink-0 items-center justify-center
            rounded-full
            bg-indigo-600
            text-white
            shadow-md
            transition
            hover:bg-indigo-700
            active:scale-95
          "
        >
          {playing ? (
            <span className="text-sm">❚❚</span>
          ) : (
            <span className="ml-[2px] text-sm">▶</span>
          )}
        </button>

        {/* ===== 中间区域 ===== */}
        <div className="flex flex-1 items-center gap-4">
          {/* ===== waveform ===== */}
          <div
            className="
              flex h-16 flex-1 cursor-pointer items-end gap-[2px]
              overflow-hidden rounded-xl
              bg-gray-50 px-2 py-2
            "
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();

              const percent =
                (e.clientX - rect.left) / rect.width;

              seek(percent);
            }}
          >
            {waveform.map((v, i) => {
              const played =
                i / waveform.length < progress;

              return (
                <div
                  key={i}
                  className="
                    rounded-full
                    transition-all
                  "
                  style={{
                    height: `${v * 140 + 6}px`,
                    width: "3px",
                    background: played
                      ? "#4f46e5"
                      : "#d1d5db",
                    opacity: played ? 1 : 0.7,
                  }}
                />
              );
            })}
          </div>

          {/* ===== 时间 ===== */}
          <div
            className="
              w-24 shrink-0 whitespace-nowrap
              text-sm text-gray-500
            "
          >
            {formatTime(currentTime)} /{" "}
            {formatTime(duration)}
          </div>

          {/* ===== 音量 ===== */}
          <div
            className="
              hidden w-28 shrink-0 items-center gap-2
              md:flex
            "
          >
            <span className="text-sm text-gray-500">
              🔊
            </span>

            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => {
                const v = Number(e.target.value);

                setVolume(v);

                if (audioRef.current) {
                  audioRef.current.volume = v;
                }
              }}
              className="w-full cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}