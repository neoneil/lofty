"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ArrowUpRight, Crosshair, Eraser, Highlighter, MousePointer2, PenLine, Scan, Square, Trash2, Undo2, X } from "lucide-react";

import { useCourseCanvasEditor, type CourseCanvasAnnotation, type CourseCanvasPoint, type CourseCanvasTool } from "./CourseCanvasEditorProvider";

type CanvasSize = {
  height: number;
  width: number;
};

const compactTools: Array<{ id: CourseCanvasTool; label: string; Icon: typeof MousePointer2 }> = [
  { id: "pointer", label: "选择", Icon: MousePointer2 },
  { id: "laser", label: "激光笔", Icon: Crosshair },
  { id: "pen", label: "画笔", Icon: PenLine },
  { id: "highlighter", label: "荧光笔", Icon: Highlighter },
  { id: "arrow", label: "箭头", Icon: ArrowUpRight },
  { id: "rectangle", label: "方框", Icon: Square },
  { id: "eraser", label: "橡皮", Icon: Eraser },
  { id: "spotlight", label: "聚光灯", Icon: Scan },
];

function drawPath(context: CanvasRenderingContext2D, annotation: CourseCanvasAnnotation, size: CanvasSize) {
  const points = annotation.points.map((point) => ({ x: point.x * size.width, y: point.y * size.height }));
  if (points.length === 0) return;

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = annotation.width * Math.min(size.width, size.height);
  context.strokeStyle = annotation.color;

  if (annotation.tool === "eraser") {
    context.globalCompositeOperation = "destination-out";
    context.lineWidth *= 4;
  } else if (annotation.tool === "highlighter") {
    context.globalAlpha = 0.28;
    context.lineWidth *= 4;
  }

  if (annotation.tool === "rectangle" && points.length >= 2) {
    const start = points[0];
    const end = points[points.length - 1];
    context.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
  } else if (annotation.tool === "arrow" && points.length >= 2) {
    const start = points[0];
    const end = points[points.length - 1];
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const head = Math.max(10, context.lineWidth * 3.5);
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.moveTo(end.x, end.y);
    context.lineTo(end.x - head * Math.cos(angle - Math.PI / 6), end.y - head * Math.sin(angle - Math.PI / 6));
    context.moveTo(end.x, end.y);
    context.lineTo(end.x - head * Math.cos(angle + Math.PI / 6), end.y - head * Math.sin(angle + Math.PI / 6));
    context.stroke();
  } else {
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    for (const point of points.slice(1)) context.lineTo(point.x, point.y);
    if (points.length === 1) context.lineTo(points[0].x + 0.01, points[0].y + 0.01);
    context.stroke();
  }

  context.restore();
}

export default function CourseCanvasOverlay({ fullscreen, slideIndex }: { fullscreen: boolean; slideIndex: number }) {
  const { active, annotations, color, strokeSize, tool, addAnnotation, clearSlide, setTool, undoSlide } = useCourseCanvasEditor();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draftRef = useRef<CourseCanvasAnnotation | null>(null);
  const sizeRef = useRef<CanvasSize>({ height: 0, width: 0 });
  const [laserPoint, setLaserPoint] = useState<CourseCanvasPoint | null>(null);
  const slideAnnotations = useMemo(() => annotations[slideIndex] ?? [], [annotations, slideIndex]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const size = sizeRef.current;
    context.clearRect(0, 0, size.width, size.height);
    slideAnnotations.forEach((annotation) => drawPath(context, annotation, size));
    if (draftRef.current) drawPath(context, draftRef.current, size);
  }, [slideAnnotations]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const canvasElement = canvas;
    const parentElement = parent;

    function resize() {
      const rect = parentElement.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      sizeRef.current = { height: rect.height, width: rect.width };
      canvasElement.width = Math.max(1, Math.round(rect.width * ratio));
      canvasElement.height = Math.max(1, Math.round(rect.height * ratio));
      canvasElement.style.width = `${rect.width}px`;
      canvasElement.style.height = `${rect.height}px`;
      canvasElement.getContext("2d")?.setTransform(ratio, 0, 0, ratio, 0, 0);
      redraw();
    }

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(parentElement);
    return () => observer.disconnect();
  }, [fullscreen, redraw]);

  function pointFromEvent(event: ReactPointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)), y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)) };
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!active || tool === "pointer" || tool === "laser" || tool === "spotlight") return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointFromEvent(event);
    draftRef.current = { id: crypto.randomUUID(), tool, color, width: strokeSize / Math.min(sizeRef.current.width, sizeRef.current.height), points: [point] } as CourseCanvasAnnotation;
    redraw();
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    const point = pointFromEvent(event);
    if (tool === "laser" || tool === "spotlight") setLaserPoint(point);
    const draft = draftRef.current;
    if (!draft) return;
    draft.points = draft.tool === "arrow" || draft.tool === "rectangle" ? [draft.points[0], point] : [...draft.points, point];
    redraw();
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLCanvasElement>) {
    const draft = draftRef.current;
    if (!draft) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    draftRef.current = null;
    addAnnotation(slideIndex, draft);
  }

  const interactive = active && tool !== "pointer";
  const cursorClass = tool === "laser" || tool === "spotlight" ? "cursor-none" : "cursor-crosshair";

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[inherit]" aria-hidden={!active}>
      <canvas ref={canvasRef} className={`absolute inset-0 ${interactive ? `pointer-events-auto ${cursorClass}` : "pointer-events-none"}`} style={{ touchAction: "none" }} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} onPointerLeave={() => { if (!draftRef.current) setLaserPoint(null); }} />

      {active && tool === "laser" && laserPoint ? <div className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 shadow-[0_0_0_5px_rgba(239,68,68,0.22),0_0_18px_rgba(239,68,68,0.95)]" style={{ left: `${laserPoint.x * 100}%`, top: `${laserPoint.y * 100}%` }} /> : null}
      {active && tool === "spotlight" && laserPoint ? <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(circle 110px at ${laserPoint.x * 100}% ${laserPoint.y * 100}%, transparent 0%, transparent 48%, rgba(0,0,0,0.72) 100%)` }} /> : null}

      {fullscreen && active ? (
        <div className="pointer-events-auto absolute right-4 top-4 z-30 flex max-w-[calc(100%-2rem)] flex-wrap items-center justify-end gap-1 rounded-[var(--radius-md)] border border-white/15 bg-black/55 p-1.5 text-white shadow-lg backdrop-blur-md">
          {compactTools.map(({ id, label, Icon }) => <button key={id} type="button" onClick={() => setTool(id)} className={`flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] transition ${tool === id ? "bg-white text-slate-900" : "text-white/80 hover:bg-white/15 hover:text-white"}`} aria-label={label} title={label}><Icon size={15} /></button>)}
          <span className="mx-1 h-5 w-px bg-white/20" />
          <button type="button" onClick={() => undoSlide(slideIndex)} className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-white/80 transition hover:bg-white/15 hover:text-white" aria-label="撤销本页标注" title="撤销"><Undo2 size={15} /></button>
          <button type="button" onClick={() => clearSlide(slideIndex)} className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-white/80 transition hover:bg-red-500/30 hover:text-white" aria-label="清空本页标注" title="清空"><Trash2 size={15} /></button>
          <button type="button" onClick={() => setTool("pointer")} className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-white/80 transition hover:bg-white/15 hover:text-white" aria-label="退出画布编辑" title="退出编辑"><X size={15} /></button>
        </div>
      ) : null}
    </div>
  );
}
