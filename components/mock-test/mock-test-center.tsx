"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BarChart3, BookOpenCheck, ClipboardList, FileText, Headphones, History, Lock, Mic2, Printer, RotateCcw } from "lucide-react";

import AbilityAssessment from "@/components/mock-assessment/ability-assessment";
import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Card, CardContent } from "@/components/ui-v2/card";
import type { AbilityAssessmentData } from "@/lib/mock-assessment/types";
import type { MockTestDashboardData } from "@/lib/mock-test/types";

type View = "center" | "assessment";

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MockTestCenter({ dashboard, assessment }: { dashboard: MockTestDashboardData; assessment: AbilityAssessmentData }) {
  const [view, setView] = useState<View>("center");
  const mockStartDisabled = !dashboard.access.canStartNewAttempt;

  if (view === "assessment") {
    return (
      <div className="space-y-4">
        <Button type="button" variant="secondary" onClick={() => setView("center")} className="gap-2"><ArrowRight size={16} className="rotate-180" />返回模考中心</Button>
        <AbilityAssessment data={assessment} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="border-[var(--border-strong)]">
        <CardContent className="p-5 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge><ClipboardList size={13} className="mr-1.5" />Mock Test Center</Badge>
              {dashboard.access.isUnlimited ? <Badge variant="success" className="ml-2">无限模考</Badge> : null}
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">模考中心</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">选择 IELTS、PTE 或综合能力评估。正式模考提交后不会立即显示答案，老师发布成绩后，你可以在账户里查看完整报告并打印保存。</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              <Metric icon={<BarChart3 size={15} />} label="总次数" value={dashboard.totalAttempts} />
              <Metric icon={<BookOpenCheck size={15} />} label="IELTS" value={dashboard.ieltsAttempts} />
              <Metric icon={<Mic2 size={15} />} label="PTE" value={dashboard.pteAttempts} />
              <Metric icon={<RotateCcw size={15} />} label="未完成" value={dashboard.inProgressAttempts.length} />
              <Metric icon={<History size={15} />} label="最近提交" value={formatDate(dashboard.latestSubmittedAt)} wide />
            </div>
          </div>
        </CardContent>
      </Card>

      {mockStartDisabled ? (
        <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--card)] text-[var(--text-soft)]"><Lock size={16} /></span>
            <div>
              <h2 className="font-bold text-[var(--text)]">新模考入口已锁定</h2>
              <p className="mt-1 text-sm leading-7 text-[var(--text-soft)]">{dashboard.access.message}</p>
            </div>
          </div>
        </section>
      ) : null}

      {dashboard.inProgressAttempts.length > 0 ? (
        <section className="rounded-[var(--radius-lg)] border border-[var(--warning)]/30 bg-[var(--warning-soft)] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-[var(--text)]">未完成模考</h2>
              <p className="mt-1 text-sm text-[var(--text-soft)]">你可以从上次保存的位置继续。</p>
            </div>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {dashboard.inProgressAttempts.map((attempt) => {
              const testNumber = typeof attempt.metadata.testNumber === "number" ? attempt.metadata.testNumber : 1;
              const href = attempt.examType === "ielts" ? `/mock-test/ielts?test=${testNumber}` : "/mock-test/pte";
              return (
                <Link key={attempt.id} href={href} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-3 transition hover:border-[var(--primary)]/40">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-[var(--text)]">{attempt.title}</div>
                      <div className="mt-1 text-xs text-[var(--text-soft)]">保存于 {formatDate(attempt.updatedAt)}</div>
                    </div>
                    <Badge>继续</Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3">
        <ExamEntry
          icon={<Headphones size={24} />}
          label="IELTS Mock"
          title="雅思模考"
          description="第一版开放 Cambridge IELTS 21 Test 1-4，按机考流程完成听力、阅读、写作和口语预览。"
          footer="静态剑桥题源 · 自动保存 · 成绩邮件发布"
          href="/mock-test/ielts?test=1"
          disabled={mockStartDisabled}
        />
        <ExamEntry
          icon={<Mic2 size={24} />}
          label="PTE Mock"
          title="PTE 模考"
          description="沿用当前 PTE 模考/题型详情体验，按 36 题蓝图完成口语、写作、阅读和听力。"
          footer="section 间断点 · R2 录音 · 分批评分"
          href="/mock-test/pte"
          disabled={mockStartDisabled}
        />
        <button type="button" onClick={() => setView("assessment")} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] p-5 text-left shadow-[var(--shadow-sm)] transition hover:border-[var(--primary)]/40 hover:bg-[var(--card-hover)]">
          <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--warning-soft)] text-[var(--warning)]"><FileText size={24} /></span>
          <Badge variant="secondary" className="mt-5">Assessment</Badge>
          <h2 className="mt-3 text-xl font-bold text-[var(--text)]">英语综合能力评估</h2>
          <p className="mt-2 min-h-20 text-sm leading-7 text-[var(--text-soft)]">保留原来的词汇、语法、听说读写综合评估，适合非正式模考前快速定位能力。</p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[var(--primary)]">进入评估<ArrowRight size={16} /></span>
        </button>
      </section>

      {dashboard.publishedReports.length > 0 ? (
        <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-[var(--text)]">已发布成绩报告</h2>
              <p className="mt-1 text-sm text-[var(--text-soft)]">老师发送成绩邮件后，完整报告会显示在这里。</p>
            </div>
            <Printer size={18} className="text-[var(--text-soft)]" />
          </div>
          <div className="mt-3 space-y-2">
            {dashboard.publishedReports.map((attempt) => (
              <Link key={attempt.id} href={`/mock-test/report/${attempt.id}`} className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-3 transition hover:border-[var(--primary)]/40">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-[var(--text)]">{attempt.title}</span>
                  <span className="mt-1 block text-xs text-[var(--text-soft)]">发布于 {formatDate(attempt.studentReportPublishedAt)}</span>
                </span>
                <Badge variant="success">查看</Badge>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Metric({ icon, label, value, wide = false }: { icon: React.ReactNode; label: string; value: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`min-w-0 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-3 ${wide ? "col-span-2 sm:col-span-1" : ""}`}>
      <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--text-faint)]">{icon}{label}</div>
      <div className="mt-1 truncate text-center text-base font-semibold text-[var(--text)]">{value}</div>
    </div>
  );
}

function ExamEntry({ icon, label, title, description, footer, href, disabled = false }: { icon: React.ReactNode; label: string; title: string; description: string; footer: string; href: string; disabled?: boolean }) {
  const content = (
    <>
      <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]">{icon}</span>
      <Badge className="mt-5">{label}</Badge>
      <h2 className="mt-3 text-xl font-bold text-[var(--text)]">{title}</h2>
      <p className="mt-2 min-h-20 text-sm leading-7 text-[var(--text-soft)]">{description}</p>
      <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-2 text-xs font-semibold text-[var(--text-soft)]">{footer}</div>
      <span className={`mt-5 inline-flex items-center gap-2 text-sm font-bold ${disabled ? "text-[var(--text-faint)]" : "text-[var(--primary)]"}`}>
        {disabled ? "已锁定" : "开始"}{disabled ? <Lock size={16} /> : <ArrowRight size={16} />}
      </span>
    </>
  );

  if (disabled) {
    return (
      <div aria-disabled="true" className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] p-5 opacity-70 shadow-[var(--shadow-sm)]">
        {content}
      </div>
    );
  }

  return (
    <Link href={href} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] transition hover:border-[var(--primary)]/40 hover:bg-[var(--card-hover)]">
      {content}
    </Link>
  );
}
