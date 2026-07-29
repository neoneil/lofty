"use client";

import Lottie from "lottie-react";

import aiAnimation from "@/public/lottie/AI.json";
import { cn } from "@/lib/utils";

type Props = {
  text: string;
  className?: string;
};

export function AiLoadingLabel({ text, className }: Props) {
  return (
    <span className={cn("inline-flex items-center justify-center gap-3", className)}>
      <span className="relative -ml-1 flex h-8 w-8 shrink-0 items-center justify-center overflow-visible">
        <Lottie animationData={aiAnimation} loop autoplay className="h-full w-full" />
      </span>
      <span className="font-semibold tracking-wide">{text}</span>
    </span>
  );
}
