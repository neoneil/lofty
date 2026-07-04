"use client";

import { useMemo, useState } from "react";
import { DndContext, DragEndEvent, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { ArrowDown, ArrowUp, GripVertical, RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import type { PteMockBlank, PteMockQuestion } from "@/lib/mock-assessment/pte-mock-types";

function ReorderQuestion({ question }: { question: PteMockQuestion }) {
  const [sentences, setSentences] = useState(() => [...(question.sentences ?? [])].sort(() => Math.random() - 0.5));
  const move = (index: number, direction: -1 | 1) => setSentences((current) => {
    const target = index + direction;
    if (target < 0 || target >= current.length) return current;
    const next = [...current];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });

  return <div className="space-y-3">{sentences.map((sentence, index) => <div key={`${sentence}-${index}`} className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary-soft)] text-sm font-semibold text-[var(--primary)]">{index + 1}</span><p className="flex-1 text-sm leading-7 text-[var(--text)]">{sentence}</p><div className="flex shrink-0 gap-1"><button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="上移" className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-soft)] hover:bg-[var(--card)] disabled:opacity-30"><ArrowUp size={15} /></button><button type="button" onClick={() => move(index, 1)} disabled={index === sentences.length - 1} aria-label="下移" className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-soft)] hover:bg-[var(--card)] disabled:opacity-30"><ArrowDown size={15} /></button></div></div>)}</div>;
}

function DropdownBlank({ blank, value, onChange }: { blank: PteMockBlank; value: string; onChange: (value: string) => void }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className="mx-1 h-10 min-w-36 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-3 text-sm font-medium text-[var(--text)] outline-none focus:border-[var(--primary)]"><option value="">Select</option>{blank.options.map((option, index) => <option key={`${option}-${index}`} value={option}>{option}</option>)}</select>;
}

function DropdownQuestion({ question }: { question: PteMockQuestion }) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const parts = question.prompt.split(/(\[\[blank_\d+\]\])/g);
  return <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 text-[15px] leading-[3] text-[var(--text)] sm:p-5">{parts.map((part, partIndex) => {
    const match = part.match(/\[\[blank_(\d+)\]\]/);
    if (!match) return <span key={`text-${partIndex}`}>{part}</span>;
    const blank = question.blanks?.find((item) => item.index === Number(match[1]));
    if (!blank) return null;
    return <DropdownBlank key={`blank-${partIndex}`} blank={blank} value={answers[blank.index] ?? ""} onChange={(value) => setAnswers((current) => ({ ...current, [blank.index]: value }))} />;
  })}</div>;
}

function DraggableWord({ word }: { word: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `word:${word}`, data: { word } });
  return <button ref={setNodeRef} type="button" {...attributes} {...listeners} style={{ transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined, touchAction: "none" }} className={`inline-flex min-h-10 cursor-grab items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-3 text-sm font-medium text-[var(--text)] shadow-[var(--shadow-sm)] ${isDragging ? "z-20 opacity-50" : ""}`}><GripVertical size={14} />{word}</button>;
}

function BlankTarget({ blank, value }: { blank: PteMockBlank; value?: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: `blank:${blank.index}` });
  return <span ref={setNodeRef} className={`mx-1 inline-flex min-h-10 min-w-28 items-center justify-center rounded-[var(--radius-sm)] border px-2 align-middle ${isOver ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "border-dashed border-[var(--border-strong)] bg-[var(--card)]"}`}>{value || "Drop here"}</span>;
}

function DragQuestion({ question }: { question: PteMockQuestion }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const parts = question.prompt.split(/(\[\[blank_\d+\]\])/g);
  const optionPool = useMemo(() => Array.from(new Set((question.blanks ?? []).flatMap((blank) => blank.options))), [question.blanks]);
  const used = new Set(Object.values(answers));
  const available = optionPool.filter((word) => !used.has(word));
  const handleDragEnd = (event: DragEndEvent) => {
    const word = event.active.data.current?.word as string | undefined;
    const target = String(event.over?.id ?? "");
    if (!word || !target.startsWith("blank:")) return;
    const index = Number(target.slice(6));
    setAnswers((current) => ({ ...Object.fromEntries(Object.entries(current).filter(([, value]) => value !== word)), [index]: word }));
  };

  return <DndContext sensors={sensors} onDragEnd={handleDragEnd}><div className="flex flex-wrap gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-3">{available.map((word) => <DraggableWord key={word} word={word} />)}<Button type="button" variant="ghost" size="sm" onClick={() => setAnswers({})} className="ml-auto gap-2"><RotateCcw size={14} />重置</Button></div><div className="mt-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 text-[15px] leading-[3] text-[var(--text)] sm:p-5">{parts.map((part, partIndex) => { const match = part.match(/\[\[blank_(\d+)\]\]/); if (!match) return <span key={`text-${partIndex}`}>{part}</span>; const blank = question.blanks?.find((item) => item.index === Number(match[1])); return blank ? <BlankTarget key={`blank-${partIndex}`} blank={blank} value={answers[blank.index]} /> : null; })}</div></DndContext>;
}

export function PteMockReadingQuestion({ question }: { question: PteMockQuestion }) {
  return <div className="space-y-5"><div className="flex flex-wrap items-center gap-2"><Badge>{question.type}</Badge><Badge variant="secondary">Reading</Badge></div><div><h2 className="text-xl font-semibold text-[var(--text)] sm:text-2xl">{question.title}</h2><p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">{question.type === "RO" ? "调整段落顺序。" : question.type === "FIBRW" ? "根据上下文从下拉列表选择答案。" : "将备选词拖入对应空格。"}</p></div>{question.type === "RO" ? <ReorderQuestion question={question} /> : question.type === "FIBRW" ? <DropdownQuestion question={question} /> : <DragQuestion question={question} />}</div>;
}
