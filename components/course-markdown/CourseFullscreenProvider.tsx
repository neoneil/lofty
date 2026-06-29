"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type CourseFullscreenContextValue = {
  error: string | null;
  isFullscreen: boolean;
  registerPresentationElement: (element: HTMLElement | null) => void;
  toggleFullscreen: () => Promise<void>;
};

const CourseFullscreenContext = createContext<CourseFullscreenContextValue | null>(null);

export function CourseFullscreenProvider({ children }: { children: ReactNode }) {
  const elementRef = useRef<HTMLElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerPresentationElement = useCallback((element: HTMLElement | null) => {
    elementRef.current = element;
  }, []);

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === elementRef.current);
      setError(null);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (elementRef.current?.requestFullscreen) {
        await elementRef.current.requestFullscreen();
      } else {
        setError("当前浏览器不支持全屏演示。");
      }
    } catch (fullscreenError) {
      setError(fullscreenError instanceof Error ? fullscreenError.message : "无法进入全屏演示。");
    }
  }, []);

  const value = useMemo<CourseFullscreenContextValue>(() => ({ error, isFullscreen, registerPresentationElement, toggleFullscreen }), [error, isFullscreen, registerPresentationElement, toggleFullscreen]);
  return <CourseFullscreenContext.Provider value={value}>{children}</CourseFullscreenContext.Provider>;
}

export function useCourseFullscreen() {
  const context = useContext(CourseFullscreenContext);
  if (!context) throw new Error("useCourseFullscreen must be used inside CourseFullscreenProvider");
  return context;
}
