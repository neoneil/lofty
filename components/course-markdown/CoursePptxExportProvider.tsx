"use client";

import { createContext, type ReactNode, useCallback, useContext, useRef, useState } from "react";

type ExportProgress = {
  completed: number;
  total: number;
};

type ExportHandler = (onProgress: (completed: number, total: number) => void) => Promise<void>;

type CoursePptxExportContextValue = {
  clearResult: () => void;
  error: string | null;
  isExporting: boolean;
  progress: ExportProgress | null;
  registerExportHandler: (handler: ExportHandler | null) => void;
  startExport: () => Promise<void>;
};

const CoursePptxExportContext = createContext<CoursePptxExportContextValue | null>(null);

export function CoursePptxExportProvider({ children }: { children: ReactNode }) {
  const handlerRef = useRef<ExportHandler | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const registerExportHandler = useCallback((handler: ExportHandler | null) => {
    handlerRef.current = handler;
  }, []);

  const clearResult = useCallback(() => {
    if (isExporting) return;
    setProgress(null);
    setError(null);
  }, [isExporting]);

  const startExport = useCallback(async () => {
    if (isExporting || !handlerRef.current) return;
    setIsExporting(true);
    setProgress(null);
    setError(null);

    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      await handlerRef.current((completed, total) => setProgress({ completed, total }));
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "PPTX 导出失败，请稍后重试。");
    } finally {
      setIsExporting(false);
    }
  }, [isExporting]);

  return <CoursePptxExportContext.Provider value={{ clearResult, error, isExporting, progress, registerExportHandler, startExport }}>{children}</CoursePptxExportContext.Provider>;
}

export function useCoursePptxExport() {
  const context = useContext(CoursePptxExportContext);
  if (!context) throw new Error("useCoursePptxExport must be used inside CoursePptxExportProvider");
  return context;
}
