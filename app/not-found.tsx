"use client";

import Link from "next/link";
import Lottie from "lottie-react";

import animationData from "@/public/lottie/404.json";

export default function NotFound() {
  return (
    <main
      className="
        flex min-h-screen flex-col items-center
        justify-center overflow-hidden
        bg-[#050816] px-6 text-white
      "
    >
      {/* 背景光 */}
      <div
        className="
          absolute inset-0
          bg-[radial-gradient(circle_at_top,rgba(76,110,245,0.22),transparent_40%)]
        "
      />

      {/* 动画 */}
      <div className="relative z-10 w-full max-w-[520px]">
        <Lottie animationData={animationData} loop />
      </div>

      {/* 文字 */}
      <div className="relative z-10 mt-2 text-center">
        <p className="mb-3 text-sm uppercase tracking-[0.35em] text-blue-200/55">
          404 Error
        </p>

        <h1 className="text-5xl font-semibold sm:text-6xl">
          Lost In The Stars
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-white/60">
          The page you are looking for drifted away somewhere in the universe.
        </p>

        <Link
          href="/"
          className="
            mt-10 inline-flex items-center justify-center
            rounded-2xl bg-white px-6 py-4
            text-lg font-semibold text-black
            transition hover:scale-[1.02]
            hover:bg-blue-100
          "
        >
          Return Home
        </Link>
      </div>
    </main>
  );
}
