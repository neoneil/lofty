"use client";

import { useState } from "react";

import CourseLanguageTools from "./CourseLanguageTools";
import CourseTextStyleToolbar from "./CourseTextStyleToolbar";
import CourseGradientTools from "./CourseGradientTools";
import CoursePptxExportButton from "./CoursePptxExportButton";

type ActiveTool = "gradient" | "language" | "text-style" | null;

export default function CourseToolsDock({ showGradientTool = false }: { showGradientTool?: boolean }) {
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);
  const showDock = activeTool === null;

  return (
    <div className={showDock ? "fixed bottom-4 right-3 z-50 flex flex-col gap-2 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2" : undefined}>
      <CourseLanguageTools expanded={activeTool === "language"} showCollapsed={showDock} onExpandedChange={(expanded) => setActiveTool(expanded ? "language" : null)} />
      <CourseTextStyleToolbar expanded={activeTool === "text-style"} showCollapsed={showDock} onExpandedChange={(expanded) => setActiveTool(expanded ? "text-style" : null)} />
      {showGradientTool ? <CourseGradientTools expanded={activeTool === "gradient"} showCollapsed={showDock} onExpandedChange={(expanded) => setActiveTool(expanded ? "gradient" : null)} /> : null}
      {showGradientTool && showDock ? <CoursePptxExportButton /> : null}
    </div>
  );
}
