"use client";

import { Fragment } from "react";
import { Award, BarChart3, BookOpen, Clock3, Headphones, Mic, PenTool } from "lucide-react";

import { Card, CardContent } from "@/components/ui-v2/card";
import { cn } from "@/lib/utils";

type SectionKey = "speaking" | "writing" | "reading" | "listening";

type Row = {
  id: number;
  type: string;
  count: string;
  time: string;
  overall?: string;
  speaking?: string;
  writing?: string;
  reading?: string;
  listening?: string;
  section: SectionKey;
};

const data: Row[] = [
  { id: 1, type: "RA", count: "6–7", time: "准备35到40s<br />答题40s", overall: "4%", speaking: "9%", section: "speaking" },
  { id: 2, type: "RS", count: "10–12", time: "无准备时间<br />答题15s", overall: "7%", speaking: "16%", listening: "17%", section: "speaking" },
  { id: 3, type: "DI", count: "5–6", time: "准备25s<br />答题40s", overall: "15%", speaking: "31%", section: "speaking" },
  { id: 4, type: "RL", count: "2–3", time: "准备10s<br />答题40s", overall: "6%", speaking: "13%", listening: "13%", section: "speaking" },
  { id: 5, type: "ASQ", count: "5–6", time: "无准备时间<br />答题10s", overall: "2%", listening: "4%", section: "speaking" },
  { id: 6, type: "SGD", count: "2–3", time: "准备10s<br />答题 2min", overall: "9%", speaking: "19%", listening: "20%", section: "speaking" },
  { id: 7, type: "RTS", count: "2–3", time: "准备10s<br />答题40s", overall: "6%", speaking: "13%", section: "speaking" },
  { id: 8, type: "SWT", count: "2", time: "每题单独计时 10 min", overall: "7%", writing: "28%", reading: "23%", section: "writing" },
  { id: 9, type: "WE", count: "1", time: "答题 20 min", overall: "7%", writing: "31%", section: "writing" },
  { id: 10, type: "FIB_R", count: "5–6", time: "建议回应时长: ≤2min", overall: "7%", reading: "25%", section: "reading" },
  { id: 11, type: "MCM_R", count: "2–3", time: "建议回应时长: ≤1.5min", overall: "1%", reading: "5%", section: "reading" },
  { id: 12, type: "RO", count: "2–3", time: "建议回应时长: ≤2min", overall: "3%", reading: "9%", section: "reading" },
  { id: 13, type: "FIB_DD", count: "4–5", time: "建议回应时长: ≤2min", overall: "6%", reading: "20%", section: "reading" },
  { id: 14, type: "MCS_R", count: "2–3", time: "建议回应时长: ≤1.5min", overall: "<1%", reading: "3%", section: "reading" },
  { id: 15, type: "SST", count: "1", time: "单独计时 10 min", overall: "4%", writing: "18%", listening: "10%", section: "listening" },
  { id: 16, type: "MCM_L", count: "2–3", time: "建议回应时长: ≤1.5min", overall: "1%", listening: "3%", section: "listening" },
  { id: 17, type: "FIB_L", count: "2–3", time: "建议回应时长: ≤2min", overall: "3%", listening: "8%", section: "listening" },
  { id: 18, type: "HCS", count: "2–3", time: "建议回应时长: ≤1.5min", overall: "<1%", listening: "2%", section: "listening" },
  { id: 19, type: "MCS_L", count: "2–3", time: "建议回应时长: ≤1.5min", overall: "<1%", listening: "2%", section: "listening" },
  { id: 20, type: "SMW", count: "1–2", time: "建议回应时长: ≤1.5min", overall: "1%", listening: "1%", section: "listening" },
  { id: 21, type: "HIW", count: "2–3", time: "建议回应时长: ≤2min", overall: "4%", reading: "13%", listening: "8%", section: "listening" },
  { id: 22, type: "WFD", count: "3–4", time: "建议时长: 每题2 min", overall: "5%", writing: "23%", listening: "13%", section: "listening" },
];

const sections: Array<{ key: SectionKey; title: string; subtitle: string; duration: string; Icon: typeof Mic; tone: string }> = [
  { key: "speaking", title: "口语部分", subtitle: "Speaking", duration: "35-45分钟", Icon: Mic, tone: "text-[var(--danger)] bg-[var(--danger-soft)]" },
  { key: "writing", title: "写作部分", subtitle: "Writing", duration: "40分钟", Icon: PenTool, tone: "text-[var(--primary)] bg-[var(--primary-soft)]" },
  { key: "reading", title: "阅读部分", subtitle: "Reading", duration: "25-30分钟", Icon: BookOpen, tone: "text-[var(--success)] bg-[var(--success-soft)]" },
  { key: "listening", title: "听力部分", subtitle: "Listening", duration: "30-40分钟", Icon: Headphones, tone: "text-[var(--warning)] bg-[var(--warning-soft)]" },
];

const scoreColumns: Array<{ key: "speaking" | "writing" | "reading" | "listening"; label: string; className: string }> = [
  { key: "speaking", label: "Speaking", className: "text-[var(--danger)]" },
  { key: "writing", label: "Writing", className: "text-[var(--primary)]" },
  { key: "reading", label: "Reading", className: "text-[var(--success)]" },
  { key: "listening", label: "Listening", className: "text-[var(--warning)]" },
];

function getRows(sectionKey: SectionKey) {
  return data.filter((row) => row.section === sectionKey);
}

function getTimeLines(time: string) {
  return time.replace(/<br\s*\/?>/gi, "\n").split("\n").map((line) => line.trim()).filter(Boolean);
}

function ScoreValue({ value, className }: { value?: string; className: string }) {
  return <span className={cn("font-bold", value ? className : "text-[var(--text-faint)]")}>{value || "-"}</span>;
}

export default function PteTable() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <section className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--primary)]"><BarChart3 size={14} />PTE Overview</div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">PTE 题型信息总览</h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">按官方考试流程整理题型数量、答题时间与四项能力贡献比例，方便快速判断训练优先级。</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[520px]">
          {sections.map((section) => {
            const Icon = section.Icon;
            return <div key={section.key} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-3 text-center shadow-[var(--shadow-sm)]"><span className={cn("mx-auto flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)]", section.tone)}><Icon size={17} /></span><p className="mt-2 text-sm font-bold text-[var(--text)]">{section.subtitle}</p><p className="mt-0.5 text-[11px] font-medium text-[var(--text-faint)]">{getRows(section.key).length} 题型</p></div>;
          })}
        </div>
      </section>

      <Card className="hidden overflow-hidden rounded-[var(--radius-lg)] border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-md)] md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="max-h-[calc(100dvh-220px)] min-h-[520px] overflow-auto">
              <table className="w-full min-w-[1120px] border-collapse text-center text-sm">
                <thead className="sticky top-0 z-10 bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]">
                  <tr className="text-[11px] font-bold uppercase tracking-[0.14em]">
                    <th className="w-[68px] border-r border-white/15 px-4 py-4">#</th>
                    <th className="w-[120px] border-r border-white/15 px-4 py-4">题型</th>
                    <th className="w-[120px] border-r border-white/15 px-4 py-4">题目个数</th>
                    <th className="w-[230px] border-r border-white/15 px-4 py-4">准备与答题时间</th>
                    <th className="w-[150px] border-r border-white/15 px-4 py-4">总分贡献</th>
                    {scoreColumns.map((column) => <th key={column.key} className="w-[120px] border-r border-white/15 px-4 py-4 last:border-r-0">{column.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {sections.map((section) => {
                    const rows = getRows(section.key);
                    const Icon = section.Icon;
                    return (
                      <Fragment key={section.key}>
                        <tr>
                          <td colSpan={9} className="border-t border-[var(--border)] bg-[var(--bg-soft)] px-5 py-4 text-center">
                            <div className="inline-flex items-center justify-center gap-3 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 shadow-[var(--shadow-sm)]"><span className={cn("flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)]", section.tone)}><Icon size={16} /></span><span className="font-bold text-[var(--text)]">{section.title}</span><span className="text-sm font-semibold text-[var(--text-soft)]">{section.subtitle}</span><span className="rounded-full bg-[var(--primary-soft)] px-2.5 py-1 text-xs font-bold text-[var(--primary)]">{section.duration}</span></div>
                          </td>
                        </tr>
                        {rows.map((row, index) => (
                          <tr key={row.id} className={cn("border-t border-[var(--border)] transition-colors hover:bg-[var(--primary-soft)]/40", index % 2 === 0 ? "bg-[var(--card)]" : "bg-[var(--bg-soft)]/70")}>
                            <td className="border-r border-[var(--border)] px-4 py-4 font-semibold text-[var(--text-faint)]">{index + 1}</td>
                            <td className="border-r border-[var(--border)] px-4 py-4"><span className="inline-flex min-w-16 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 font-black text-[var(--text)] shadow-[var(--shadow-sm)]">{row.type}</span></td>
                            <td className="border-r border-[var(--border)] px-4 py-4 font-semibold text-[var(--text)]">{row.count}</td>
                            <td className="border-r border-[var(--border)] px-4 py-4 text-[var(--text-soft)]">{getTimeLines(row.time).map((line) => <span key={line} className="block leading-6">{line}</span>)}</td>
                            <td className="border-r border-[var(--border)] px-4 py-4"><span className="inline-flex items-center justify-center rounded-full bg-[var(--danger-soft)] px-3 py-1.5 font-bold text-[var(--danger)]">{row.overall || "-"}</span></td>
                            {scoreColumns.map((column) => <td key={column.key} className="border-r border-[var(--border)] px-4 py-4 last:border-r-0"><ScoreValue value={row[column.key]} className={column.className} /></td>)}
                          </tr>
                        ))}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4 md:hidden">
        {sections.map((section) => {
          const Icon = section.Icon;
          return (
            <section key={section.key} className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
              <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--bg-soft)] p-4">
                <div className="flex min-w-0 items-center gap-3"><span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)]", section.tone)}><Icon size={18} /></span><div className="min-w-0"><h2 className="truncate text-base font-bold text-[var(--text)]">{section.title}</h2><p className="text-xs font-semibold text-[var(--text-soft)]">{section.subtitle} · {section.duration}</p></div></div>
                <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--card)] px-2.5 py-1 text-xs font-bold text-[var(--primary)]">{getRows(section.key).length} 项</span>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {getRows(section.key).map((row, index) => (
                  <article key={row.id} className={cn("p-4", index % 2 === 0 ? "bg-[var(--card)]" : "bg-[var(--bg-soft)]/70")}>
                    <div className="flex items-start justify-between gap-3 text-center">
                      <div className="min-w-0 text-left"><p className="text-lg font-black text-[var(--text)]">{row.type}</p><p className="mt-1 text-xs font-semibold text-[var(--text-faint)]">#{index + 1} · {row.count} 题</p></div>
                      <div className="rounded-[var(--radius-sm)] bg-[var(--danger-soft)] px-3 py-2 text-center"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--danger)]">Overall</p><p className="mt-1 text-base font-black text-[var(--danger)]">{row.overall || "-"}</p></div>
                    </div>
                    <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-3 text-center">
                      <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-faint)]"><Clock3 size={13} />Time</div>
                      <div className="mt-2 text-sm font-semibold leading-6 text-[var(--text)]">{getTimeLines(row.time).map((line) => <span key={line} className="block">{line}</span>)}</div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {scoreColumns.map((column) => <div key={column.key} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-center"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-faint)]">{column.label}</p><p className={cn("mt-1 text-sm font-black", row[column.key] ? column.className : "text-[var(--text-faint)]")}>{row[column.key] || "-"}</p></div>)}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-4 text-sm leading-7 text-[var(--text-soft)] shadow-[var(--shadow-sm)]">
        <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary-soft)] text-[var(--primary)]"><Award size={16} /></span>
        <p><span className="font-semibold text-[var(--text)]">提示：</span>百分比用于判断备考投入优先级，具体题量和时间会随考试版本与题库批次略有变化。</p>
      </div>
    </main>
  );
}
