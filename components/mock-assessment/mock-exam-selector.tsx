"use client";

import { ArrowRight, Clock3, Headphones, Mic2 } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Card, CardContent } from "@/components/ui-v2/card";

export function MockExamSelector({ onStartPte }: { onStartPte: () => void }) {
  return (
    <section className="space-y-3">
      <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-faint)]">Mock Exams</p><h2 className="mt-1 text-xl font-semibold text-[var(--text)]">完整模考</h2></div>
      <div className="grid gap-3 md:grid-cols-2">
        <Card className="border-[var(--primary)]/30 bg-[var(--card)] shadow-[var(--shadow-sm)]"><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]"><Mic2 size={21} /></span><Badge>可测试</Badge></div><h3 className="mt-4 text-lg font-semibold text-[var(--text)]">PTE 模考</h3><p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">从设备检查、自我介绍到口语、写作、阅读和听力，完成一套本地模拟流程。</p><div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--text-faint)]"><span className="inline-flex items-center gap-1"><Clock3 size={13} />36 道题</span><span className="inline-flex items-center gap-1"><Headphones size={13} />不保存结果</span></div><Button type="button" onClick={onStartPte} className="mt-5 w-full gap-2">开始 PTE 模考<ArrowRight size={16} /></Button></CardContent></Card>
        <Card className="border-[var(--border)] bg-[var(--bg-soft)] shadow-none"><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--card)] text-[var(--text-faint)]"><Headphones size={21} /></span><Badge variant="secondary">即将开放</Badge></div><h3 className="mt-4 text-lg font-semibold text-[var(--text)]">雅思模考</h3><p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">雅思完整模考结构暂时保留，后续接入听力、阅读、写作和口语流程。</p><Button type="button" variant="secondary" disabled className="mt-5 w-full">暂未开放</Button></CardContent></Card>
      </div>
    </section>
  );
}
