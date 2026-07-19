"use client";

import Link from "next/link";
import { AudioLines, Bot, BookOpenCheck, BookOpenText, BrainCircuit, CloudUpload, Database, Download, FileText, Gauge, Grid2X2, Headphones, History, Languages, List, MessageSquareText, PenLine, ScrollText, Users, Video } from "lucide-react";
import { useState } from "react";

import { UiSkinCard } from "@/components/admin/ui-skin-card";

const adminModules = [
  { title: "学生练习管理", desc: "查看学生练习记录、分数趋势、听说读写进步情况。", href: "/admin/dashboard", tag: "Students", icon: Users },
  { title: "文章管理", desc: "创建、编辑和管理 IELTS / PTE 文章。", href: "/admin/posts", tag: "Posts", icon: FileText },
  { title: "授课笔记", desc: "浏览 PTE 与 IELTS Markdown 课程笔记，并预览课程内容。", href: "/admin/lesson-notes", tag: "PTE / IELTS", icon: BookOpenText },
  { title: "Markdown 备忘录", desc: "查看课程 front matter、Slides、课程卡片和扩展语法示例。", href: "/admin/markdown-memo", tag: "Course Design", icon: BookOpenCheck },
  { title: "作文批改", desc: "批改学生作文。", href: "/ielts-writing", tag: "PTE / IELTS", icon: PenLine },
  { title: "PTE 题库下载管理", desc: "管理 WFD、SST、HIW 等题型与音频资源。", href: "/downloads", tag: "PTE", icon: Download },
  { title: "IELTS 题库下载管理", desc: "管理写作、口语、阅读、听力相关题目内容。", href: "/admin/ielts", tag: "IELTS", icon: Languages },
  { title: "雅思听力阅读题型技巧", desc: "根据 content JSON 渲染听力与阅读题型、技巧、陷阱和教学要点。", href: "/admin/ielts-question-types", tag: "IELTS Skills", icon: Headphones },
  { title: "IELTS 一对一课程概要", desc: "查看雅思一对一课程方案、分层课时、四项训练内容，并下载 PDF。", href: "/admin/ielts-one-on-one-course", tag: "IELTS Course", icon: BookOpenCheck },
  { title: "PTE 一对一课程概要", desc: "查看 PTE 一对一课程方案、题型训练节奏、免费测试说明，并下载 PDF。", href: "/admin/pte-one-on-one-course", tag: "PTE Course", icon: BookOpenCheck },
  { title: "留言 / 评论", desc: "查看用户留言、评论和网站互动内容。", href: "/admin/chat", tag: "Messages", icon: MessageSquareText },
  { title: "下载中心", desc: "导出 PDF、题库资料和学生学习材料。", href: "/downloads", tag: "Export", icon: Download },
  { title: "selective", desc: "selective history。", href: "/admin/selective/history", tag: "selective", icon: History },
  { title: "上课明细", desc: "各学生上课次数。", href: "/admin/start-classroom", tag: "Zoom 会议", icon: Video },
  { title: "学生作文AI批改", desc: "AI - PTE - IELTS writing", href: "/admin/analyze_answer", tag: "AI response", icon: Bot },
  { title: "AI Demo", desc: "试听 OpenAI 人声样本，管理课程和练习中的语音模型选择。", href: "/admin/ai-demo", tag: "OpenAI Voice", icon: AudioLines },
  { title: "PTE 音频生成", desc: "为 RS / WFD 生成 Marin、Cedar、Alloy、Ash 四音色题库音频。", href: "/admin/pte-ai-audio", tag: "PTE Audio", icon: AudioLines },
  { title: "生成PTE 作文答案与句子库", desc: "AI 反馈", href: "/admin/generate_essay_answer", tag: "AI response", icon: BrainCircuit },
  { title: "PTE大作文范文", desc: "查看 WE 范文与逐句中文翻译，并自动补齐缺失范文。", href: "/admin/pte-essay-samples", tag: "PTE Essay", icon: ScrollText },
  { title: "PTE SWT 范文", desc: "查看 SWT 一句话范文、原文翻译、答案翻译与句子合并拆解。", href: "/admin/pte-swt-samples", tag: "PTE SWT", icon: FileText },
  { title: "AI 使用额度管理", desc: "查看用户 AI 使用量，调整每日/月度额度和无限额度。", href: "/admin/ai-usage", tag: "AI Usage", icon: Gauge },
  { title: "课程上传", desc: "上传 TED 或 LoftyPTE 视频、缩略图和字幕到 R2，并创建课程记录。", href: "/admin/course-upload", tag: "Courses", icon: CloudUpload },
  { title: "WFD操作", desc: "活跃题目待定", href: "/admin/db-playground", tag: "WFD", icon: Database },
];

type ViewMode = "grid" | "list";

export function AdminModuleSwitcher() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  return (
    <div>
      <div className="mb-5 flex flex-col gap-4 sm:ml-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text)]">管理模块</h2>
          <p className="mt-1 text-sm text-[var(--text-soft)]">选择一个模块开始管理。</p>
        </div>
        <div className="flex w-fit rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-1 shadow-[var(--shadow-sm)]">
          <button type="button" onClick={() => setViewMode("grid")} aria-label="铺开视图" className={`flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] transition-colors ${viewMode === "grid" ? "bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]" : "text-[var(--text-soft)] hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"}`}><Grid2X2 size={17} /></button>
          <button type="button" onClick={() => setViewMode("list")} aria-label="列表视图" className={`flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] transition-colors ${viewMode === "list" ? "bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]" : "text-[var(--text-soft)] hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"}`}><List size={18} /></button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <UiSkinCard />
          {adminModules.map((item) => <AdminModuleGridCard key={item.title} item={item} />)}
        </div>
      ) : (
        <div className="space-y-3">
          <UiSkinCard variant="list" />
          {adminModules.map((item) => <AdminModuleListCard key={item.title} item={item} />)}
        </div>
      )}
    </div>
  );
}

function AdminModuleGridCard({ item }: { item: (typeof adminModules)[number] }) {
  const Icon = item.icon;
  return (
    <Link href={item.href} className="group rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--primary)]/40 hover:bg-[var(--card-hover)] hover:shadow-[var(--shadow-md)]">
      <div className="mb-4 flex items-center justify-between">
        <span className="rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-soft)]">{item.tag}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary)] text-white shadow-[var(--shadow-sm)] transition-all duration-300 group-hover:translate-x-0.5 group-hover:bg-[var(--primary-hover)]"><Icon size={16} /></span>
      </div>
      <h3 className="text-base font-bold tracking-tight text-[var(--text)]">{item.title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{item.desc}</p>
      <p className="mt-3 truncate rounded-[var(--radius-sm)] bg-[var(--bg-soft)] px-2.5 py-1.5 font-mono text-xs text-[var(--text-faint)] opacity-0 transition-opacity duration-200 group-hover:opacity-100">{item.href}</p>
    </Link>
  );
}

function AdminModuleListCard({ item }: { item: (typeof adminModules)[number] }) {
  const Icon = item.icon;
  return (
    <Link href={item.href} className="group flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)] transition-all duration-300 hover:border-[var(--primary)]/40 hover:bg-[var(--card-hover)] hover:shadow-[var(--shadow-md)] sm:flex-row sm:items-center">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]"><Icon size={17} /></span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2"><h3 className="text-base font-bold text-[var(--text)]">{item.title}</h3><span className="rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-soft)]">{item.tag}</span></div>
        <p className="mt-1 text-sm leading-6 text-[var(--text-soft)]">{item.desc}</p>
      </div>
      <span className="truncate rounded-[var(--radius-sm)] bg-[var(--bg-soft)] px-2.5 py-1.5 font-mono text-xs text-[var(--text-faint)] opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:max-w-[220px]">{item.href}</span>
    </Link>
  );
}
