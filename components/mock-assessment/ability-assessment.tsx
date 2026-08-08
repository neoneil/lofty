"use client";

import { useState } from "react";
import { BookOpen, Brain, Headphones, Languages, Mic2, PenLine, RefreshCw, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

import { ChoiceAssessmentSection } from "@/components/mock-assessment/choice-assessment-section";
import { ListeningAssessmentSection } from "@/components/mock-assessment/listening-assessment-section";
import { SpeakingAssessmentSection, WritingAssessmentSection } from "@/components/mock-assessment/productive-assessment-sections";
import { ReadingAssessmentSection } from "@/components/mock-assessment/reading-assessment-section";
import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Card, CardContent } from "@/components/ui-v2/card";
import type { AbilityAssessmentData } from "@/lib/mock-assessment/types";

type SectionId = "vocabulary" | "grammar" | "listening" | "speaking" | "reading" | "writing";

const sections = [
  { id: "vocabulary" as const, label: "单词", english: "Vocabulary", icon: Languages, color: "text-[var(--primary)]", bg: "bg-[var(--primary-soft)]" },
  { id: "grammar" as const, label: "语法", english: "Grammar", icon: Brain, color: "text-[var(--warning)]", bg: "bg-[var(--warning-soft)]" },
  { id: "listening" as const, label: "听力", english: "Listening", icon: Headphones, color: "text-[var(--success)]", bg: "bg-[var(--success-soft)]" },
  { id: "speaking" as const, label: "口语", english: "Speaking", icon: Mic2, color: "text-[var(--danger)]", bg: "bg-[var(--danger-soft)]" },
  { id: "reading" as const, label: "阅读", english: "Reading", icon: BookOpen, color: "text-[var(--primary)]", bg: "bg-[var(--primary-soft)]" },
  { id: "writing" as const, label: "写作", english: "Writing", icon: PenLine, color: "text-[var(--warning)]", bg: "bg-[var(--warning-soft)]" },
];

export default function AbilityAssessment({ data }: { data: AbilityAssessmentData }) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<SectionId>("vocabulary");

  return <div className="space-y-6">
    <Card className="overflow-hidden"><CardContent className="p-5 sm:p-7"><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex items-center gap-2"><Badge><Sparkles size={13} className="mr-1" />Lofty Assessment</Badge><Badge variant="secondary">约 45-60 分钟</Badge></div><h1 className="mt-4 text-2xl font-bold text-[var(--text)] sm:text-3xl">英语综合能力评估</h1><p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--text-soft)] sm:text-base">不区分 IELTS 或 PTE，通过单词、语法和听说读写六项快速观察当前能力。第一版仅在本地页面作答，不保存结果。</p></div><Button type="button" variant="secondary" onClick={() => router.refresh()} className="w-full gap-2 lg:w-auto"><RefreshCw size={16} />重新随机组卷</Button></div></CardContent></Card>

    {data.warnings.length ? <div className="rounded-[var(--radius-md)] border border-[var(--warning)]/30 bg-[var(--warning-soft)] px-4 py-3 text-sm text-[var(--warning)]">{data.warnings.join("；")}</div> : null}

    <nav aria-label="能力评估模块" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">{sections.map((section) => { const Icon = section.icon; const active = activeSection === section.id; return <button key={section.id} type="button" onClick={() => setActiveSection(section.id)} className={`flex min-h-20 items-center gap-3 rounded-[var(--radius-md)] border p-3 text-left transition ${active ? "border-[var(--primary)] bg-[var(--card)] shadow-[var(--shadow-md)]" : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/40 hover:bg-[var(--bg-soft)]"}`}><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] ${section.bg} ${section.color}`}><Icon size={20} /></span><span><span className="block text-sm font-semibold text-[var(--text)]">{section.label}</span><span className="mt-0.5 block text-[10px] uppercase tracking-wide text-[var(--text-faint)]">{section.english}</span></span></button>; })}</nav>

    <div className="mx-auto w-full max-w-4xl">
      {activeSection === "vocabulary" ? <ChoiceAssessmentSection title="单词能力" description="从词汇数据库随机抽取 10 个非基础词，选择最准确的中文释义。" questions={data.vocabulary} /> : null}
      {activeSection === "grammar" ? <ChoiceAssessmentSection title="语法能力" description="从 18 个语法分类中各随机抽取 2 道单选和 1 道多选，逐题确认答案。" questions={data.grammar} /> : null}
      {activeSection === "listening" ? <ListeningAssessmentSection questions={data.listening} /> : null}
      {activeSection === "speaking" ? <SpeakingAssessmentSection assessment={data.speaking} /> : null}
      {activeSection === "reading" ? <ReadingAssessmentSection questions={data.reading} /> : null}
      {activeSection === "writing" ? <WritingAssessmentSection assessment={data.writing} /> : null}
    </div>
  </div>;
}
