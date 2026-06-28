"use client";

import type { ReactNode } from "react";
import { motion, type TargetAndTransition, type Transition, useReducedMotion } from "framer-motion";

import type { CourseAnimationType } from "@/lib/course-markdown/markdown-transforms";

type AnimationDefinition = {
  initial: TargetAndTransition;
  animate: TargetAndTransition;
  transition: Transition;
};

const animationDefinitions: Record<CourseAnimationType, AnimationDefinition> = {
  "fade-in": { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.45 } },
  "slide-up": { initial: { opacity: 0, y: 22 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.45 } },
  "zoom-in": { initial: { opacity: 0, scale: 0.94 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.4 } },
  highlight: { initial: { backgroundColor: "rgba(250, 204, 21, 0)" }, animate: { backgroundColor: ["rgba(250, 204, 21, 0)", "rgba(250, 204, 21, 0.24)", "rgba(250, 204, 21, 0)"] }, transition: { duration: 1.2 } },
  typing: { initial: { opacity: 0, clipPath: "inset(0 100% 0 0)" }, animate: { opacity: 1, clipPath: "inset(0 0% 0 0)" }, transition: { duration: 1.1, ease: "linear" } },
};

export default function CourseAnimatedBlock({ animation, children }: { animation: CourseAnimationType; children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  const definition = animationDefinitions[animation];
  const isUnframed = animation === "slide-up" || animation === "zoom-in";
  const containerClassName = animation === "typing" ? "my-4 px-1 py-1 text-[var(--text-soft)]" : isUnframed ? "my-6 text-[var(--text-soft)]" : "my-6 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card-soft)] p-4 text-[var(--text-soft)] shadow-[var(--shadow-sm)] sm:p-5";

  return (
    <motion.div initial={reduceMotion ? false : definition.initial} animate={definition.animate} transition={reduceMotion ? { duration: 0 } : definition.transition} className={containerClassName}>
      {children}
    </motion.div>
  );
}
