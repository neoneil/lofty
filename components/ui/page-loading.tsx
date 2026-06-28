"use client";

import Lottie from "lottie-react";

import animationData from "@/public/lottie/loading.json";

export default function PageLoading() {
  return (
    <div className="flex min-h-[70vh] w-full items-center justify-center bg-[var(--bg)]" role="status" aria-label="页面加载中">
      <div className="w-[120px] sm:w-[140px]">
        <Lottie animationData={animationData} loop autoplay />
      </div>
      <span className="sr-only">页面加载中</span>
    </div>
  );
}
