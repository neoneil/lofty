"use client";

import { createContext, type CSSProperties, type ReactNode, useContext, useMemo, useState } from "react";

export type CourseGradientDirection = "to-bottom-right" | "to-top-right";
export type CourseGradientStops = 2 | 3;

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
