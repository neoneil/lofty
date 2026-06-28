"use client";

import { useEffect, useRef, useState } from "react";
import { Bold, Highlighter, Paintbrush, PanelRightClose, RotateCcw, Settings2, Strikethrough, Underline, Undo2 } from "lucide-react";

type FormatOperation = {
  wrappers: HTMLSpanElement[];
};

type CourseTextStyleToolbarProps = {
  expanded: boolean;
  showCollapsed: boolean;
  onExpandedChange: (expanded: boolean) => void;
};

const COURSE_CONTENT_SELECTOR = '[data-course-markdown-content="true"]';

function unwrap(element: HTMLElement) {
  const parent = element.parentNode;
  if (!parent) return;

  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element);
  }

  parent.removeChild(element);
  parent.normalize();
}

export default function CourseTextStyleToolbar({ expanded, showCollapsed, onExpandedChange }: CourseTextStyleToolbarProps) {
  const [hasSelection, setHasSelection] = useState(false);
  const [undoCount, setUndoCount] = useState(0);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const undoStackRef = useRef<FormatOperation[]>([]);

  function clearSelectionState() {
    savedRangeRef.current = null;
    setHasSelection(false);
  }

  useEffect(() => {
    function handleSelectionChange() {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

      const range = selection.getRangeAt(0);
      const root = document.querySelector<HTMLElement>(COURSE_CONTENT_SELECTOR);

      if (root?.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
        setHasSelection(true);
      } else {
        clearSelectionState();
      }
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      const root = document.querySelector<HTMLElement>(COURSE_CONTENT_SELECTOR);
      if (toolbarRef.current?.contains(target) || root?.contains(target)) return;
      clearSelectionState();
    }

    document.addEventListener("selectionchange", handleSelectionChange);
    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  function applyStyle(style: Partial<CSSStyleDeclaration>) {
    const root = document.querySelector<HTMLElement>(COURSE_CONTENT_SELECTOR);
    const range = savedRangeRef.current;
    if (!root || !range || !root.contains(range.commonAncestorContainer)) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    let current = walker.nextNode();

    while (current) {
      const textNode = current as Text;

      if (textNode.data.trim() && range.intersectsNode(textNode)) {
        textNodes.push(textNode);
      }

      current = walker.nextNode();
    }

    const wrappers: HTMLSpanElement[] = [];

    for (const textNode of [...textNodes].reverse()) {
      const start = textNode === range.startContainer ? range.startOffset : 0;
      const end = textNode === range.endContainer ? range.endOffset : textNode.length;
      if (start >= end) continue;

      const selectedNode = start > 0 ? textNode.splitText(start) : textNode;
      const selectedLength = end - start;
      if (selectedLength < selectedNode.length) selectedNode.splitText(selectedLength);

      const wrapper = document.createElement("span");
      wrapper.dataset.courseUserFormat = "true";
      Object.assign(wrapper.style, style);
      selectedNode.parentNode?.insertBefore(wrapper, selectedNode);
      wrapper.appendChild(selectedNode);
      wrappers.push(wrapper);
    }

    if (wrappers.length === 0) return;

    const orderedWrappers = wrappers.reverse();
    undoStackRef.current.push({ wrappers: orderedWrappers });
    setUndoCount(undoStackRef.current.length);

    const nextRange = document.createRange();
    nextRange.setStartBefore(orderedWrappers[0]);
    nextRange.setEndAfter(orderedWrappers[orderedWrappers.length - 1]);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(nextRange);
    savedRangeRef.current = nextRange.cloneRange();
    setHasSelection(true);
  }

  function undo() {
    let operation = undoStackRef.current.pop();

    while (operation && operation.wrappers.every((wrapper) => !wrapper.isConnected)) {
      operation = undoStackRef.current.pop();
    }

    operation?.wrappers.slice().reverse().forEach((wrapper) => {
      if (wrapper.isConnected) unwrap(wrapper);
    });

    setUndoCount(undoStackRef.current.length);
    clearSelectionState();
  }

  function reset() {
    const root = document.querySelector<HTMLElement>(COURSE_CONTENT_SELECTOR);
    const wrappers = Array.from(root?.querySelectorAll<HTMLElement>('[data-course-user-format="true"]') ?? []);
    wrappers.reverse().forEach(unwrap);
    undoStackRef.current = [];
    setUndoCount(0);
    clearSelectionState();
  }

  if (!expanded) {
    return showCollapsed ? <button type="button" onClick={() => onExpandedChange(true)} className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] text-[var(--primary)] shadow-[var(--shadow-lg)] transition hover:bg-[var(--bg-soft)]" aria-label="展开文字样式工具栏" title="文字样式"><Settings2 size={19} /></button> : null;
  }

  return (
    <div ref={toolbarRef} className="fixed bottom-4 right-3 z-50 w-[calc(100vw-1.5rem)] max-w-[320px] rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-lg)] sm:bottom-auto sm:top-1/2 sm:w-[300px] sm:-translate-y-1/2">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div><div className="text-sm font-semibold text-[var(--text)]">选区样式</div><p className="mt-0.5 text-xs text-[var(--text-faint)]">选中文字后应用，离开页面即清除</p></div>
        <button type="button" onClick={() => onExpandedChange(false)} className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-soft)] transition hover:bg-[var(--bg-soft)] hover:text-[var(--text)]" aria-label="折叠文字样式工具栏" title="折叠"><PanelRightClose size={17} /></button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <button type="button" disabled={!hasSelection} onMouseDown={(event) => event.preventDefault()} onClick={() => applyStyle({ fontWeight: "700" })} className="flex h-10 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] text-[var(--text)] transition hover:bg-[var(--bg-soft)] disabled:cursor-not-allowed disabled:opacity-40" aria-label="加粗选中文字" title="加粗"><Bold size={17} /></button>
        <button type="button" disabled={!hasSelection} onMouseDown={(event) => event.preventDefault()} onClick={() => applyStyle({ textDecorationLine: "underline" })} className="flex h-10 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] text-[var(--text)] transition hover:bg-[var(--bg-soft)] disabled:cursor-not-allowed disabled:opacity-40" aria-label="为选中文字添加下划线" title="下划线"><Underline size={17} /></button>
        <button type="button" disabled={!hasSelection} onMouseDown={(event) => event.preventDefault()} onClick={() => applyStyle({ textDecorationLine: "line-through" })} className="flex h-10 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] text-[var(--text)] transition hover:bg-[var(--bg-soft)] disabled:cursor-not-allowed disabled:opacity-40" aria-label="为选中文字添加删除线" title="删除线"><Strikethrough size={17} /></button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className={`flex h-11 items-center justify-between rounded-[var(--radius-sm)] border border-[var(--border)] px-3 text-xs font-semibold text-[var(--text-soft)] ${hasSelection ? "cursor-pointer" : "cursor-not-allowed opacity-40"}`}><span className="flex items-center gap-2"><Paintbrush size={15} />字体色</span><input type="color" disabled={!hasSelection} defaultValue="#2563eb" onChange={(event) => applyStyle({ color: event.target.value })} className="h-6 w-7 cursor-pointer border-0 bg-transparent p-0" aria-label="选择字体颜色" /></label>
        <label className={`flex h-11 items-center justify-between rounded-[var(--radius-sm)] border border-[var(--border)] px-3 text-xs font-semibold text-[var(--text-soft)] ${hasSelection ? "cursor-pointer" : "cursor-not-allowed opacity-40"}`}><span className="flex items-center gap-2"><Highlighter size={15} />背景色</span><input type="color" disabled={!hasSelection} defaultValue="#fde68a" onChange={(event) => applyStyle({ backgroundColor: event.target.value })} className="h-6 w-7 cursor-pointer border-0 bg-transparent p-0" aria-label="选择背景颜色" /></label>
      </div>

      <div className="mt-4 flex gap-2 border-t border-[var(--border)] pt-3">
        <button type="button" onClick={undo} disabled={undoCount === 0} className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] text-xs font-semibold text-[var(--text-soft)] transition hover:bg-[var(--bg-soft)] disabled:cursor-not-allowed disabled:opacity-40"><Undo2 size={15} />撤销</button>
        <button type="button" onClick={reset} disabled={undoCount === 0} className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] text-xs font-semibold text-[var(--text-soft)] transition hover:bg-[var(--bg-soft)] disabled:cursor-not-allowed disabled:opacity-40"><RotateCcw size={15} />恢复默认</button>
      </div>
    </div>
  );
}
