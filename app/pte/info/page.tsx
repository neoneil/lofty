
"use client";

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
        <div className="w-full max-w-6xl mx-auto px-4 py-10 mt-20">

            {/* 🟦 Desktop */}
            <div className="hidden md:block bg-white rounded-2xl shadow-xl border border-gray-400 overflow-hidden">
                <div className="max-h-[600px] overflow-auto">
                    <table className="w-full text-sm text-center border-collapse">

                        {/* HEADER */}
                        <thead className="sticky top-0 bg-gray-900 text-white z-10">
                            <tr className="text-xs uppercase tracking-wider">
                                <th className="p-4 border-r border-gray-700 w-[60px]">#</th>
                                <th className="px-4 border-r border-gray-700 w-[120px]">题型</th>
                                <th className="px-4 border-r border-gray-700 w-[120px]">题目个数</th>
                                <th className="px-4 border-r border-gray-700 w-[180px]">准备与答题时间</th>
                                <th className="px-4 border-r border-gray-700">贡献总分百分比</th>
                                <th className="px-4 border-r border-gray-700">Speaking</th>
                                <th className="px-4 border-r border-gray-700">Writing</th>
                                <th className="px-4 border-r border-gray-700">Reading</th>
                                <th className="px-4">Listening</th>
                            </tr>
                        </thead>

                        {/* BODY */}
                        <tbody>
                            {sections.map((section) => {
                                const rows = data.filter(d => d.section === section.key);
                                if (rows.length === 0) return null;

                                return (
                                    <>
                                        {/* SECTION TITLE */}
                                        <tr key={section.key}>
                                            <td
                                                colSpan={9}
                                                className="bg-gray-100 text-gray-700 font-semibold px-4 py-3 border-t border-gray-400"
                                            >
                                                {section.title}
                                            </td>
                                        </tr>

                                        {rows.map((row, i) => (
                                            <tr
                                                key={row.id}
                                                className="border-t border-gray-200 hover:bg-gray-50 even:bg-gray-50 transition"
                                            >
                                                <td className="p-4 border-r border-gray-200 text-gray-500">
                                                    {i + 1}
                                                </td>

                                                <td className="px-4 border-r border-gray-200 font-semibold text-gray-800">
                                                    {row.type}
                                                </td>

                                                <td className="px-4 border-r border-gray-200">
                                                    {row.count}
                                                </td>

                                                <td
                                                    className="px-4 border-r border-gray-200 text-gray-500"
                                                    dangerouslySetInnerHTML={{ __html: row.time || "" }}
                                                />

                                                <td className="px-4 border-r border-gray-200 font-medium text-red-600">
                                                    {row.overall}
                                                </td>

                                                <td className="px-4 border-r border-gray-200 text-blue-600 font-medium">
                                                    {row.speaking}
                                                </td>

                                                <td className="px-4 border-r border-gray-200 text-green-600 font-medium">
                                                    {row.writing}
                                                </td>

                                                <td className="px-4 border-r border-gray-200 text-purple-600 font-medium">
                                                    {row.reading}
                                                </td>

                                                <td className="px-4 text-orange-600 font-medium">
                                                    {row.listening}
                                                </td>
                                            </tr>
                                        ))}
                                    </>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 🟨 Mobile（稍微也优化了一点） */}
            <div className="md:hidden space-y-4">
                {data.map((row) => (
                    <div
                        key={row.id}
                        className="bg-white rounded-xl shadow-md border border-gray-200 p-4"
                    >
                        <div className="flex justify-between mb-2">
                            <span className="font-semibold text-gray-800">{row.type}</span>
                            <span className="text-xs text-gray-400">#{row.id}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-y-1 text-sm">
                            <span className="text-gray-500">Count</span><span>{row.count}</span>
                            <span className="text-gray-500">Time</span><span>{row.time}</span>
                            <span className="text-gray-500">Overall</span><span>{row.overall}</span>

                            <span className="text-gray-500">Speaking</span>
                            <span className="text-blue-600">{row.speaking}</span>

                            <span className="text-gray-500">Writing</span>
                            <span className="text-green-600">{row.writing}</span>

                            <span className="text-gray-500">Reading</span>
                            <span className="text-purple-600">{row.reading}</span>

                            <span className="text-gray-500">Listening</span>
                            <span className="text-orange-600">{row.listening}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}


