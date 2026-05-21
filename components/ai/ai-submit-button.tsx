"use client";

import Lottie from "lottie-react";

import animationData from "@/public/lottie/AI.json";

type Props = {
  loading: boolean;
  onClick: () => void;
  disabled?: boolean;
  completed?: boolean;
};

export default function AiSubmitButton({
  loading,
  onClick,
  disabled,
  completed,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={` cursor-pointer
        group relative
        flex items-center
        justify-center
        transition-all duration-300

        ${
          !disabled
            ? "hover:scale-105 active:scale-95"
            : "cursor-default opacity-85"
        }
      `}
    >
      {/* glow */}
      <div
        className={`
          absolute inset-0
          rounded-full
          blur-2xl
          transition-all duration-700

          ${
            completed
              ? "bg-blue-400/8"
              : "bg-blue-400/20 group-hover:bg-blue-400/30"
          }
        `}
      />

      {/* lottie */}
      <div className="relative h-[118px] w-[118px]">
        <Lottie
          animationData={animationData}
          loop={loading}
          autoplay={loading}
        />

        {/* center text */}
        <div
          className={`
            absolute inset-0
            flex items-center justify-center
            transition-all duration-700

            ${
              loading
                ? "scale-75 opacity-0 blur-sm"
                : "scale-100 opacity-100"
            }
          `}
        >
          <span
            className={`
              select-none
              text-[11px]
              font-semibold
              tracking-[0.12em]
              drop-shadow-[0_0_14px_rgba(255,255,255,0.75)]

              ${
                completed
                  ? "text-[var(--red)]"
                  : "text-[var(--theme)]"
              }
            `}
          >
            {completed ? "已评分" : "AI评分"}
          </span>
        </div>
      </div>
    </button>
  );
}