"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, FileText, Printer, XCircle } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui-v2/card";
import type { AdminMockAttemptDetail } from "@/lib/mock-test/admin";

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function scoreLabel(detail: AdminMockAttemptDetail) {
  if (detail.examType === "ielts") return detail.overallBand ? `Overall Band ${detail.overallBand}` : `${detail.correctCount}/${detail.answeredCount || detail.questionCount}`;
  return detail.pteOverallScore ? `PTE Overall ${detail.pteOverallScore}` : "老师已发布";
}

export function MockTestReportPage({ detail }: { detail: AdminMockAttemptDetail }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 print:hidden sm:flex-row sm:items-center sm:justify-between">
        <Link href="/mock-test" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-soft)] transition hover:text-[var(--primary)]"><ArrowLeft size={16} />返回模考中心</Link>
        <Button type="button" variant="secondary" onClick={() => window.print()} className="gap-2"><Printer size={16} />打印 / 保存 PDF</Button>
      </div>

      <Card className="border-[var(--border-strong)]">
        <CardContent className="p-5 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2"><Badge>{detail.examType.toUpperCase()}</Badge><Badge variant="success">已发布</Badge></div>
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">{detail.title}</h1>
              <p className="mt-2 text-sm text-[var(--text-soft)]">{detail.studentName} · 发布于 {formatDate(detail.studentReportPublishedAt)}</p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-5 py-4 text-center">
              <div className="text-2xl font-bold text-[var(--primary)]">{scoreLabel(detail)}</div>
              <div className="mt-1 text-xs text-[var(--text-faint)]">Answered {detail.answeredCount} / {detail.questionCount}</div>
            </div>
          </div>
          {detail.adminReportNote ? <div className="mt-5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 text-sm leading-7 text-[var(--text-soft)]">{detail.adminReportNote}</div> : null}
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <JsonPanel title="Section Scores" data={detail.sectionScores} />
        <JsonPanel title="Score Summary" data={detail.scoreSummary} />
      </section>

      <Card>
        <CardHeader className="px-4 pt-4"><CardTitle>逐题报告</CardTitle></CardHeader>
        <CardContent className="space-y-3 p-4">
          {detail.answers.map((answer, index) => (
            <article key={answer.id} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">#{index + 1}</Badge>
                <Badge>{answer.sectionKey}</Badge>
                <Badge variant="secondary">{answer.questionType}</Badge>
                {answer.score?.isCorrect === true ? <Badge variant="success"><CheckCircle2 size={12} className="mr-1" />正确</Badge> : answer.score?.isCorrect === false ? <Badge variant="danger"><XCircle size={12} className="mr-1" />错误</Badge> : <Badge variant="warning">待评分</Badge>}
              </div>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <TextBlock title="原题全文" value={answer.prompt || stringifyShort(answer.questionSnapshot)} />
                <TextBlock title="学生答案" value={answer.responseText || stringifyShort(answer.response)} />
                <TextBlock title="正确答案" value={stringifyShort(answer.score?.answerKeySnapshot)} />
                <TextBlock title="AI / 老师反馈" value={stringifyShort(answer.score?.feedback)} />
              </div>
              {answer.responseFiles.length > 0 ? <RecordingList files={answer.responseFiles} /> : null}
            </article>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function TextBlock({ title, value }: { title: string; value: string }) {
  return <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-3"><div className="text-xs font-bold uppercase tracking-wide text-[var(--text-faint)]">{title}</div><div className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-[var(--text)]">{value || "-"}</div></div>;
}

function JsonPanel({ title, data }: { title: string; data: unknown }) {
  return <Card><CardContent className="p-4"><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[var(--text-soft)]"><FileText size={13} />{title}</div><pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-[var(--text)]">{JSON.stringify(data ?? {}, null, 2)}</pre></CardContent></Card>;
}

function RecordingList({ files }: { files: Array<Record<string, unknown>> }) {
  return (
    <div className="mt-3 space-y-2">
      {files.map((file, index) => {
        const url = typeof file.playbackUrl === "string" ? file.playbackUrl : "";
        return <div key={`${String(file.key ?? index)}`} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-3">{url ? <audio src={url} controls className="w-full" /> : null}<div className="mt-2 break-all text-xs text-[var(--text-faint)]">{String(file.key ?? "recording")}</div></div>;
      })}
    </div>
  );
}

function stringifyShort(value: unknown) {
  if (!value) return "-";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}
