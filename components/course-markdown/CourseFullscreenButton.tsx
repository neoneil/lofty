"use client";

import { Maximize2, TriangleAlert } from "lucide-react";

import { useCourseFullscreen } from "./CourseFullscreenProvider";

export default function CourseFullscreenButton() {
  const { error, toggleFullscreen } = useCourseFullscreen();

  return (
    <div className="relative">
      {error ? <div className="absolute right-14 top-1/2 max-w-[240px] -translate-y-1/2 whitespace-nowrap rounded-[var(--radius-sm)] border border-[var(--danger)]/35 bg-[var(--card)] px-3 py-2 text-xs font-semibold text-[var(--danger)] shadow-[var(--shadow-md)]">{error}</div> : null}
      <button type="button" onClick={(event) => { event.currentTarget.blur(); void toggleFullscreen(); }} className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] text-[var(--primary)] shadow-[var(--shadow-lg)] transition hover:bg-[var(--bg-soft)]" aria-label="进入全屏幻灯片模式" title="全屏演示">{error ? <TriangleAlert size={19} /> : <Maximize2 size={19} />}</button>
    </div>
  );
}
