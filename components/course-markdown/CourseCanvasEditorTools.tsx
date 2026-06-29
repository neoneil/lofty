"use client";

import { ArrowUpRight, Crosshair, Eraser, Highlighter, MousePointer2, PanelRightClose, PenLine, PencilRuler, Scan, Square, Trash2, Undo2 } from "lucide-react";

import { useCourseCanvasEditor, type CourseCanvasTool } from "./CourseCanvasEditorProvider";

type CourseCanvasEditorToolsProps = {
  expanded: boolean;
  showCollapsed: boolean;
  onExpandedChange: (expanded: boolean) => void;
};

const tools: Array<{ id: CourseCanvasTool; label: string; Icon: typeof MousePointer2 }> = [
  { id: "pointer", label: "选择", Icon: MousePointer2 },
  { id: "laser", label: "激光笔", Icon: Crosshair },
  { id: "pen", label: "画笔", Icon: PenLine },
  { id: "highlighter", label: "荧光笔", Icon: Highlighter },
  { id: "arrow", label: "箭头", Icon: ArrowUpRight },
  { id: "rectangle", label: "方框", Icon: Square },
  { id: "eraser", label: "橡皮", Icon: Eraser },
  { id: "spotlight", label: "聚光灯", Icon: Scan },
];

export default function CourseCanvasEditorTools({ expanded, showCollapsed, onExpandedChange }: CourseCanvasEditorToolsProps) {
  const { active, annotations, color, currentSlideIndex, strokeSize, tool, clearSlide, setActive, setColor, setStrokeSize, setTool, undoSlide } = useCourseCanvasEditor();
  const annotationCount = annotations[currentSlideIndex]?.length ?? 0;

  if (!expanded) {
    return showCollapsed ? <button type="button" onClick={() => { if (tool === "pointer") setTool("laser"); else setActive(true); onExpandedChange(true); }} className={`flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] border shadow-[var(--shadow-lg)] transition hover:bg-[var(--bg-soft)] ${active ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]" : "border-[var(--border)] bg-[var(--card)] text-[var(--primary)]"}`} aria-label="展开画布编辑模式" title="编辑模式"><PencilRuler size={19} /></button> : null;
  }

  return (
    <div className="fixed bottom-4 right-3 z-50 max-h-[82vh] w-[calc(100vw-1.5rem)] max-w-[350px] overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-lg)] sm:bottom-auto sm:top-1/2 sm:w-[330px] sm:-translate-y-1/2">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div><div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]"><PencilRuler size={17} className="text-[var(--primary)]" />编辑模式</div><p className="mt-1 text-xs text-[var(--text-faint)]">讲课标注仅保留在当前页面会话</p></div>
        <button type="button" onClick={() => onExpandedChange(false)} className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-soft)] transition hover:bg-[var(--bg-soft)] hover:text-[var(--text)]" aria-label="折叠编辑模式" title="折叠"><PanelRightClose size={17} /></button>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {tools.map(({ id, label, Icon }) => <button key={id} type="button" onClick={() => setTool(id)} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-[var(--radius-sm)] border text-[10px] font-semibold transition ${tool === id && (active || id === "pointer") ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]" : "border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text-soft)] hover:border-[var(--primary)]"}`} title={label}><Icon size={17} /><span>{label}</span></button>)}
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto] gap-3">
        <label className="flex h-11 cursor-pointer items-center justify-between rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] px-3 text-xs font-semibold text-[var(--text-soft)]"><span>标注颜色</span><input type="color" value={color} onChange={(event) => setColor(event.target.value)} className="h-7 w-9 cursor-pointer border-0 bg-transparent p-0" aria-label="选择画布标注颜色" /></label>
        <div className="flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] p-1">{[2, 4, 8].map((size) => <button key={size} type="button" onClick={() => setStrokeSize(size)} className={`flex h-8 w-8 items-center justify-center rounded-[var(--radius-xs)] text-[10px] font-bold transition ${strokeSize === size ? "bg-[var(--card)] text-[var(--primary)] shadow-[var(--shadow-sm)]" : "text-[var(--text-faint)]"}`}>{size}</button>)}</div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[var(--border)] pt-3">
        <button type="button" onClick={() => undoSlide(currentSlideIndex)} disabled={annotationCount === 0} className="inline-flex h-9 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] text-xs font-semibold text-[var(--text-soft)] transition hover:bg-[var(--bg-soft)] disabled:cursor-not-allowed disabled:opacity-40"><Undo2 size={15} />撤销</button>
        <button type="button" onClick={() => clearSlide(currentSlideIndex)} disabled={annotationCount === 0} className="inline-flex h-9 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] text-xs font-semibold text-[var(--danger)] transition hover:bg-[var(--danger-soft)] disabled:cursor-not-allowed disabled:opacity-40"><Trash2 size={15} />清空本页</button>
      </div>
    </div>
  );
}
