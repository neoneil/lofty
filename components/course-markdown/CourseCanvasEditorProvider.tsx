"use client";

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";

export type CourseCanvasTool = "pointer" | "laser" | "pen" | "highlighter" | "arrow" | "rectangle" | "eraser" | "spotlight";

export type CourseCanvasPoint = {
  x: number;
  y: number;
};

export type CourseCanvasAnnotation = {
  id: string;
  tool: "pen" | "highlighter" | "arrow" | "rectangle" | "eraser";
  color: string;
  width: number;
  points: CourseCanvasPoint[];
};

type CourseCanvasEditorContextValue = {
  active: boolean;
  annotations: Record<number, CourseCanvasAnnotation[]>;
  color: string;
  currentSlideIndex: number;
  strokeSize: number;
  tool: CourseCanvasTool;
  addAnnotation: (slideIndex: number, annotation: CourseCanvasAnnotation) => void;
  clearSlide: (slideIndex: number) => void;
  setActive: (active: boolean) => void;
  setColor: (color: string) => void;
  setCurrentSlideIndex: (index: number) => void;
  setStrokeSize: (size: number) => void;
  setTool: (tool: CourseCanvasTool) => void;
  undoSlide: (slideIndex: number) => void;
};

const CourseCanvasEditorContext = createContext<CourseCanvasEditorContextValue | null>(null);

export function CourseCanvasEditorProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  const [tool, setToolState] = useState<CourseCanvasTool>("laser");
  const [color, setColor] = useState("#ef4444");
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [strokeSize, setStrokeSize] = useState(4);
  const [annotations, setAnnotations] = useState<Record<number, CourseCanvasAnnotation[]>>({});

  const setTool = useCallback((nextTool: CourseCanvasTool) => {
    setToolState(nextTool);
    setActive(nextTool !== "pointer");
  }, []);

  const addAnnotation = useCallback((slideIndex: number, annotation: CourseCanvasAnnotation) => {
    setAnnotations((current) => ({ ...current, [slideIndex]: [...(current[slideIndex] ?? []), annotation] }));
  }, []);

  const undoSlide = useCallback((slideIndex: number) => {
    setAnnotations((current) => ({ ...current, [slideIndex]: (current[slideIndex] ?? []).slice(0, -1) }));
  }, []);

  const clearSlide = useCallback((slideIndex: number) => {
    setAnnotations((current) => ({ ...current, [slideIndex]: [] }));
  }, []);

  const value = useMemo<CourseCanvasEditorContextValue>(() => ({ active, annotations, color, currentSlideIndex, strokeSize, tool, addAnnotation, clearSlide, setActive, setColor, setCurrentSlideIndex, setStrokeSize, setTool, undoSlide }), [active, addAnnotation, annotations, clearSlide, color, currentSlideIndex, setTool, strokeSize, tool, undoSlide]);

  return <CourseCanvasEditorContext.Provider value={value}>{children}</CourseCanvasEditorContext.Provider>;
}

export function useCourseCanvasEditor() {
  const context = useContext(CourseCanvasEditorContext);
  if (!context) throw new Error("useCourseCanvasEditor must be used inside CourseCanvasEditorProvider");
  return context;
}
