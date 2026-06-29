"use client";

import { createContext, type CSSProperties, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

import { COURSE_GRADIENT_PRESETS, type CourseGradientDirection, type CourseGradientStops } from "./course-gradient-presets";

export type { CourseGradientDirection, CourseGradientStops } from "./course-gradient-presets";

type CourseGradientConfig = {
  enabled: boolean;
  direction: CourseGradientDirection;
  stops: CourseGradientStops;
  colors: [string, string, string];
};

type CourseAppearanceContextValue = {
  gradient: CourseGradientConfig;
  gradientStyle: CSSProperties | undefined;
  setDirection: (direction: CourseGradientDirection) => void;
  setStops: (stops: CourseGradientStops) => void;
  setColor: (index: number, color: string) => void;
  resetGradient: () => void;
};

const DEFAULT_GRADIENT: CourseGradientConfig = {
  enabled: false,
  direction: "to-bottom-right",
  stops: 2,
  colors: ["#dbeafe", "#f5f3ff", "#fce7f3"],
};

const CourseAppearanceContext = createContext<CourseAppearanceContextValue | null>(null);

export function CourseAppearanceProvider({ children }: { children: ReactNode }) {
  const [gradient, setGradient] = useState<CourseGradientConfig>(DEFAULT_GRADIENT);

  useEffect(() => {
    function syncGradientWithTheme() {
      if (document.documentElement.dataset.theme === "dark") {
        setGradient(DEFAULT_GRADIENT);
        return;
      }

      const preset = COURSE_GRADIENT_PRESETS[Math.floor(Math.random() * COURSE_GRADIENT_PRESETS.length)];
      setGradient({ enabled: true, direction: preset.direction, stops: preset.stops, colors: [...preset.light] });
    }

    const timer = window.setTimeout(syncGradientWithTheme, 0);
    const observer = new MutationObserver(syncGradientWithTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  const gradientStyle = useMemo<CSSProperties | undefined>(() => {
    if (!gradient.enabled) return undefined;
    const direction = gradient.direction === "to-bottom-right" ? "to bottom right" : "to top right";
    const colors = gradient.stops === 2 ? [gradient.colors[0], gradient.colors[1]] : gradient.colors;
    return { backgroundImage: `linear-gradient(${direction}, ${colors.join(", ")})` };
  }, [gradient]);

  const value = useMemo<CourseAppearanceContextValue>(() => ({
    gradient,
    gradientStyle,
    setDirection: (direction) => setGradient((current) => ({ ...current, enabled: true, direction })),
    setStops: (stops) => setGradient((current) => ({ ...current, enabled: true, stops })),
    setColor: (index, color) => setGradient((current) => {
      const colors: [string, string, string] = [...current.colors];
      colors[index] = color;
      return { ...current, enabled: true, colors };
    }),
    resetGradient: () => setGradient(DEFAULT_GRADIENT),
  }), [gradient, gradientStyle]);

  return <CourseAppearanceContext.Provider value={value}>{children}</CourseAppearanceContext.Provider>;
}

export function useCourseAppearance() {
  const context = useContext(CourseAppearanceContext);
  if (!context) throw new Error("useCourseAppearance must be used inside CourseAppearanceProvider");
  return context;
}
