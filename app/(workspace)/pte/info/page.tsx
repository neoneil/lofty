
"use client";
import { Fragment } from "react";
import { Card, CardContent } from "@/components/ui-v2/card";
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
    section: string;
};
// ,writing: "——", reading: "——",
const data: Row[] = [
    // Speaking & Writing
    { id: 1, type: "RA", count: "6–7", time: "准备35到40s<br />答题40s", overall: "4%", speaking: "9%", section: "speaking" },
    { id: 2, type: "RS", count: "10–12", time: "无准备时间<br />答题15s", overall: "7%", speaking: "16%", listening: "17%", section: "speaking" },
    { id: 3, type: "DI", count: "5–6", time: "准备25s<br />答题40s", overall: "15%", speaking: "31%", section: "speaking" },
    { id: 4, type: "RL", count: "2–3", time: "准备10s<br />答题40s", overall: "6%", speaking: "13%", listening: "13%", section: "speaking" },
    { id: 5, type: "ASQ", count: "5–6", time: "无准备时间<br />答题10s", overall: "2%", listening: "4%", section: "speaking" },
    { id: 6, type: "SGD", count: "2–3", time: "准备10s<br />答题 2min", overall: "9%", speaking: "19%", listening: "20%", section: "speaking" },
    { id: 7, type: "RTS", count: "2–3", time: "准备10s<br />答题40s", overall: "6%", speaking: "13%", section: "speaking" },
    { id: 8, type: "SWT", count: "2", time: "每题单独计时 10 min", overall: "7%", writing: "28%", reading: "23%", section: "writing" },
    { id: 9, type: "WE", count: "1", time: "答题 20 min", overall: "7%", writing: "31%", section: "writing" },

    // Reading
    { id: 10, type: "FIB_R", count: "5–6", time: "建议回应时长: ≤2min", overall: "7%", reading: "25%", section: "reading" },
    { id: 11, type: "MCM_R", count: "2–3", time: "建议回应时长: ≤1.5min", overall: "1%", reading: "5%", section: "reading" },
    { id: 12, type: "RO", count: "2–3", time: "建议回应时长: ≤2min", overall: "3%", reading: "9%", section: "reading" },
    { id: 13, type: "FIB_DD", count: "4–5", time: "建议回应时长: ≤2min", overall: "6%", reading: "20%", section: "reading" },
    { id: 14, type: "MCS_R", count: "2–3", time: "建议回应时长: ≤1.5min", overall: "<1%", reading: "3%", section: "reading" },

    // Listening
    { id: 15, type: "SST", count: "1", time: "单独计时 10 min", overall: "4%", writing: "18%", listening: "10%", section: "listening" },
    { id: 16, type: "MCM_L", count: "2–3", time: "建议回应时长: ≤1.5min", overall: "1%", listening: "3%", section: "listening" },
    { id: 17, type: "FIB_L", count: "2–3", time: "建议回应时长: ≤2min", overall: "3%", listening: "8%", section: "listening" },
    { id: 18, type: "HCS", count: "2–3", time: "建议回应时长: ≤1.5min", overall: "<1%", listening: "2%", section: "listening" },
    { id: 19, type: "MCS_L", count: "2–3", time: "建议回应时长: ≤1.5min", overall: "<1%", listening: "2%", section: "listening" },
    { id: 20, type: "SMW", count: "1–2", time: "建议回应时长: ≤1.5min", overall: "1%", listening: "1%", section: "listening" },
    { id: 21, type: "HIW", count: "2–3", time: "建议回应时长: ≤2min", overall: "4%", reading: "13%", listening: "8%", section: "listening" },
    { id: 22, type: "WFD", count: "3–4", time: "建议时长: 每题2 min", overall: "5%", writing: "23%", listening: "13%", section: "listening" },
];

export default function PteTable() {
    const sections = [
        { key: "speaking", title: "口语部分 Speaking 35-45分钟" },
        { key: "writing", title: "写作部分 Writing 40分钟" },
        { key: "reading", title: "阅读部分 Reading 25-30分钟" },
        { key: "listening", title: "听力部分 Listening 30-40分钟" },
    ];

    return (
        <div className="mx-auto mt-8 w-full max-w-7xl px-4 py-8">
            {/* Desktop */}
            <Card className="hidden overflow-hidden rounded-[var(--radius-lg)] border-[var(--border)] shadow-[var(--shadow-md)] md:block">
                <CardContent className="p-0">
                    <div className="max-h-[680px] overflow-auto">
                        <table className="w-full min-w-[1080px] border-collapse text-center text-[15px]">

                        {/* HEADER */}
                        <thead className="sticky top-0 z-10 bg-[var(--primary)] text-white">
                            <tr className="text-xs uppercase tracking-[0.14em]">
                                <th className="w-[70px] border-r border-white/15 p-5 font-semibold">#</th>
                                <th className="w-[130px] border-r border-white/15 px-5 font-semibold">题型</th>
                                <th className="w-[130px] border-r border-white/15 px-5 font-semibold">题目个数</th>
                                <th className="w-[210px] border-r border-white/15 px-5 font-semibold">准备与答题时间</th>
                                <th className="border-r border-white/15 px-5 font-semibold">贡献总分百分比</th>
                                <th className="border-r border-white/15 px-5 font-semibold">Speaking</th>
                                <th className="border-r border-white/15 px-5 font-semibold">Writing</th>
                                <th className="border-r border-white/15 px-5 font-semibold">Reading</th>
                                <th className="px-5 font-semibold">Listening</th>
                            </tr>
                        </thead>

                        {/* BODY */}
                        <tbody>
                            {sections.map((section) => {
                                const rows = data.filter(d => d.section === section.key);
                                if (rows.length === 0) return null;

                                return (
                                    <Fragment key={section.key}>
                                        {/* SECTION TITLE */}
                                        <tr key={section.key}>
                                            <td
                                                colSpan={9}
                                                className="border-t border-[var(--border)] bg-[var(--primary-soft)] px-5 py-4 font-semibold text-[var(--primary)]"
                                            >
                                                {section.title}
                                            </td>
                                        </tr>

                                        {rows.map((row, i) => (
                                            <tr
                                                key={row.id}
                                                className={`border-t border-[var(--border)] transition hover:bg-[var(--primary-soft)]/35 ${
                                                    i % 2 === 0 ? "bg-[var(--card)]" : "bg-[var(--bg-soft)]/75"
                                                }`}
                                            >
                                                <td className="border-r border-[var(--border)] p-5 text-[var(--text-soft)]">
                                                    {i + 1}
                                                </td>

                                                <td className="border-r border-[var(--border)] px-5 font-semibold text-[var(--text)]">
                                                    {row.type}
                                                </td>

                                                <td className="border-r border-[var(--border)] px-5 text-[var(--text)]">
                                                    {row.count}
                                                </td>

                                                <td
                                                    className="border-r border-[var(--border)] px-5 leading-7 text-[var(--text-soft)]"
                                                    dangerouslySetInnerHTML={{ __html: row.time || "" }}
                                                />

                                                <td className="border-r border-[var(--border)] px-5 font-semibold text-[var(--danger)]">
                                                    {row.overall}
                                                </td>

                                                <td className="border-r border-[var(--border)] px-5 font-semibold text-[var(--primary)]">
                                                    {row.speaking}
                                                </td>

                                                <td className="border-r border-[var(--border)] px-5 font-semibold text-[var(--success)]">
                                                    {row.writing}
                                                </td>

                                                <td className="border-r border-[var(--border)] px-5 font-semibold text-[var(--primary)]">
                                                    {row.reading}
                                                </td>

                                                <td className="px-5 font-semibold text-[var(--warning)]">
                                                    {row.listening}
                                                </td>
                                            </tr>
                                        ))}
                                    </Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                    </div>
                </CardContent>
            </Card>

            {/* Mobile */}
            <div className="space-y-4 md:hidden">
                {data.map((row) => (
                    <div
                        key={row.id}
                        className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)]"
                    >
                        <div className="flex justify-between mb-2">
                            <span className="font-semibold text-[var(--text)]">{row.type}</span>
                            <span className="text-xs text-[var(--text-soft)]">#{row.id}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-y-1 text-sm text-[var(--text)]">
                            <span className="text-[var(--text-soft)]">Count</span><span>{row.count}</span>
                            <span className="text-[var(--text-soft)]">Time</span><span>{row.time}</span>
                            <span className="text-[var(--text-soft)]">Overall</span><span className="font-semibold text-[var(--danger)]">{row.overall}</span>

                            <span className="text-[var(--text-soft)]">Speaking</span>
                            <span className="font-semibold text-[var(--primary)]">{row.speaking}</span>

                            <span className="text-[var(--text-soft)]">Writing</span>
                            <span className="font-semibold text-[var(--success)]">{row.writing}</span>

                            <span className="text-[var(--text-soft)]">Reading</span>
                            <span className="font-semibold text-[var(--primary)]">{row.reading}</span>

                            <span className="text-[var(--text-soft)]">Listening</span>
                            <span className="font-semibold text-[var(--warning)]">{row.listening}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
