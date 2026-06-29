"use client";

import { useEffect, useRef, useState } from "react";

import CourseLanguageTools from "./CourseLanguageTools";
import CourseTextStyleToolbar from "./CourseTextStyleToolbar";
import CourseGradientTools from "./CourseGradientTools";
import CoursePptxExportButton from "./CoursePptxExportButton";
import CourseCanvasEditorTools from "./CourseCanvasEditorTools";
import CourseFullscreenButton from "./CourseFullscreenButton";

type ActiveTool = "canvas-editor" | "gradient" | "language" | "text-style" | null;

export default function CourseToolsDock({ showGradientTool = false }: { showGradientTool?: boolean }) {
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const showDock = activeTool === null;

  useEffect(() => {
    if (!activeTool) return;

    function handlePointerDown(event: PointerEvent) {
      if (dockRef.current?.contains(event.target as Node)) return;
      setActiveTool(null);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [activeTool]);

  return (
    <div ref={dockRef} className={showDock ? "fixed bottom-4 right-3 z-50 flex flex-col gap-2 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2" : undefined}>
      <CourseLanguageTools expanded={activeTool === "language"} showCollapsed={showDock} onExpandedChange={(expanded) => setActiveTool(expanded ? "language" : null)} />
      <CourseTextStyleToolbar expanded={activeTool === "text-style"} showCollapsed={showDock} showSelectionPopover={showGradientTool} onExpandedChange={(expanded) => setActiveTool(expanded ? "text-style" : null)} />
      {showGradientTool ? <CourseGradientTools expanded={activeTool === "gradient"} showCollapsed={showDock} onExpandedChange={(expanded) => setActiveTool(expanded ? "gradient" : null)} /> : null}
      {showGradientTool && showDock ? <CoursePptxExportButton /> : null}
      {showGradientTool ? <CourseCanvasEditorTools expanded={activeTool === "canvas-editor"} showCollapsed={showDock} onExpandedChange={(expanded) => setActiveTool(expanded ? "canvas-editor" : null)} /> : null}
      {showGradientTool && showDock ? <CourseFullscreenButton /> : null}
    </div>
  );
}
