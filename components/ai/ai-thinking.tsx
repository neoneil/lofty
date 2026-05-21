"use client";

import Lottie from "lottie-react";

import animationData from "@/public/lottie/AI.json";

export default function AiThinking() {
  return (
    <div
      className="
        flex flex-col items-center
        justify-center py-10
      "
    >
      <div className="w-[180px]">
        <Lottie
          animationData={animationData}
          loop
        />
      </div>

      <p
        className="
          -mt-2 text-sm
          tracking-[0.25em]
          text-white/45
          uppercase
        "
      >
        AI ANALYZING
      </p>
    </div>
  );
}