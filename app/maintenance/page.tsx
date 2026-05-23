"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";

import animationData from "@/public/lottie/underConstruction.json";

export default function MaintenancePage() {
  // 100小时倒计时
  const [timeLeft, setTimeLeft] = useState(100 * 60 * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const hours = String(Math.floor(timeLeft / 3600)).padStart(2, "0");

  const minutes = String(
    Math.floor((timeLeft % 3600) / 60)
  ).padStart(2, "0");

  const seconds = String(timeLeft % 60).padStart(2, "0");

  return (
    <main
      className="
        relative flex min-h-screen
        flex-col items-center justify-center
        overflow-hidden
        bg-[#050816]
        px-6 text-white
      "
    >
      {/* 深空背景 */}
      <div
        className="
          absolute inset-0
          bg-[radial-gradient(circle_at_top,rgba(90,120,255,0.22),transparent_45%)]
        "
      />

      {/* 发光模糊 */}
      <div
        className="
          absolute left-1/2 top-1/2
          h-[600px] w-[600px]
          -translate-x-1/2 -translate-y-1/2
          rounded-full
          bg-blue-500/10 blur-3xl
        "
      />

      {/* 动画 */}
      <div className="relative z-10 w-full max-w-[520px]">
        <Lottie animationData={animationData} loop />
      </div>

      {/* 文案 */}
      <div className="relative z-10 mt-2 text-center">
        <p className="mb-3 text-sm uppercase tracking-[0.35em] text-blue-200/55">
          Maintenance Mode
        </p>

        <h1 className="text-5xl font-semibold sm:text-6xl">
          Under Construction
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/60">
          We are currently updating the website and adding
          new cosmic experiences.
          Please check back again soon.
        </p>

        {/* 倒计时 */}
        <div className="mt-14 flex items-center justify-center gap-4">
          <TimeCard label="Hours" value={hours} />

          <div className="pb-8 text-4xl font-light text-blue-200/50">
            :
          </div>

          <TimeCard label="Minutes" value={minutes} />

          <div className="pb-8 text-4xl font-light text-blue-200/50">
            :
          </div>

          <TimeCard label="Seconds" value={seconds} />
        </div>

        <p className="mt-8 text-sm tracking-wide text-white/35">
          Estimated maintenance completion countdown
        </p>
      </div>
    </main>
  );
}

function TimeCard({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div
      className="
        relative overflow-hidden
        rounded-[28px]
        border border-white/10
        bg-white/5
        px-7 py-6
        backdrop-blur-xl
      "
    >
      {/* 光效 */}
      <div
        className="
          absolute inset-0
          bg-[radial-gradient(circle_at_top,rgba(120,160,255,0.22),transparent_70%)]
        "
      />

      <div className="relative z-10">
        <div
          className="
            text-5xl font-semibold
            tracking-wider text-white
            drop-shadow-[0_0_18px_rgba(120,160,255,0.6)]
          "
        >
          {value}
        </div>

        <div className="mt-3 text-xs uppercase tracking-[0.25em] text-blue-200/50">
          {label}
        </div>
      </div>
    </div>
  );
}