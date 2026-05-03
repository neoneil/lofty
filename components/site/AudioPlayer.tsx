"use client";

import { useEffect, useRef, useState } from "react";

export default function AudioPlayer({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [waveform, setWaveform] = useState<number[]>([]);

  const isDraggingRef = useRef(false);

  // ===== 初始化 audio =====
  useEffect(() => {
    const audio = new Audio(url);
    audioRef.current = audio;

    audio.ontimeupdate = () => {
      if (!isDraggingRef.current) {
        setProgress(audio.currentTime / audio.duration);
      }
    };

    audio.onended = () => setPlaying(false);

    return () => {
      audio.pause();
    };
  }, [url]);

  // ===== 生成 waveform（核心）=====
  useEffect(() => {
    const generateWaveform = async () => {
      const res = await fetch(url);
      const buffer = await res.arrayBuffer();

      const ctx = new AudioContext();
      const audioBuffer = await ctx.decodeAudioData(buffer);

      const raw = audioBuffer.getChannelData(0);

      const samples = 60; // 控制柱子数量（越大越细）
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

  // ===== 拖动 =====
  const seek = (percent: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;

    audio.currentTime = percent * audio.duration;
  };

  return (
    <div className="w-full rounded-2xl border bg-white p-4 shadow-sm space-y-3">
      {/* ===== 控制区 ===== */}
      <div className="flex items-center gap-4">
        <button
          onClick={togglePlay}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500 text-white"
        >
          {playing ? "❚❚" : "▶"}
        </button>

        {/* ===== 波形 ===== */}
        <div
          className="flex flex-1 items-end gap-[2px] cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            seek(percent);
          }}
        >
          {waveform.map((v, i) => {
            const played = i / waveform.length < progress;

            return (
              <div
                key={i}
                style={{
                  height: `${v * 140 + 8}px`,
                  width: "3px",
                  background: played ? "#4f46e5" : "#d1d5db",
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}