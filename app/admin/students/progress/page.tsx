"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function generateData() {
  return Array.from({ length: 20 }).map((_, i) => {
    const week = i + 1;

    return {
      week,
      label: `第${week}周`,
      examDate: `2026-05-${String(week).padStart(2, "0")}`,
      listening: Math.round(40 + week * 1.5),
      speaking: Math.round(38 + week * 1.4),
      reading: Math.round(42 + week * 1.6),
      writing: Math.round(39 + week * 1.3),
      target: 65,
    };
  });
}

export default function Page() {
  const [chartType, setChartType] = useState<"line" | "bar">("line");

  const data = useMemo(() => generateData(), []);
  const chartHeight = 380;
  const chartWidth = Math.max(data.length * 90, 900);

  const yTicks = [90, 75, 60, 45, 30, 15, 0];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="round bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.08)] md:p-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-gray-500">Student Progress</p>

            <h1 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">
              学生成绩趋势（20周）
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              左侧纵坐标固定，右侧图表可以横向滚动。
            </p>
          </div>

          <div className="flex w-fit rounded bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setChartType("line")}
              className={`rounded px-4 py-2 text-sm font-medium transition ${
                chartType === "line"
                  ? "bg-white text-gray-900 shadow"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              折线图
            </button>

            <button
              type="button"
              onClick={() => setChartType("bar")}
              className={`rounded px-4 py-2 text-sm font-medium transition ${
                chartType === "bar"
                  ? "bg-white text-gray-900 shadow"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              柱状图
            </button>
          </div>
        </div>

        <div className="rounded border border-gray-100 bg-gray-50 p-4">
          <div className="flex">
            {/* 固定纵坐标 */}
            <div
              className="relative shrink-0 bg-gray-50"
              style={{ width: 56, height: chartHeight }}
            >
              {yTicks.map((value) => (
                <span
                  key={value}
                  className="absolute right-2 -translate-y-1/2 text-xs text-gray-500"
                  style={{
                    top: `${20 + ((90 - value) / 90) * (chartHeight - 65)}px`,
                  }}
                >
                  {value}
                </span>
              ))}
            </div>

            {/* 右侧横向滚动区域 */}
            <div className="min-w-0 flex-1 overflow-x-auto">
              <div style={{ width: chartWidth, height: chartHeight }}>
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "line" ? (
                    <LineChart
                      data={data}
                      margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 12 }}
                        interval={0}
                      />
                      <YAxis domain={[0, 90]} hide />

                      <Tooltip
                        formatter={(value, name) => [`${value} 分`, name]}
                        labelFormatter={(label) => {
                          const item = data.find((i) => i.label === label);
                          return `${label} ｜ ${item?.examDate ?? ""}`;
                        }}
                      />

                      <Legend />

                      <ReferenceLine
                        y={65}
                        stroke="#ef4444"
                        strokeDasharray="5 5"
                        label="目标"
                      />

                      <Line
                        type="monotone"
                        dataKey="listening"
                        name="听力"
                        stroke="#2563eb"
                        strokeWidth={3}
                        dot={{ r: 3 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="speaking"
                        name="口语"
                        stroke="#16a34a"
                        strokeWidth={3}
                        dot={{ r: 3 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="reading"
                        name="阅读"
                        stroke="#9333ea"
                        strokeWidth={3}
                        dot={{ r: 3 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="writing"
                        name="写作"
                        stroke="#f97316"
                        strokeWidth={3}
                        dot={{ r: 3 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  ) : (
                    <BarChart
                      data={data}
                      margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 12 }}
                        interval={0}
                      />
                      <YAxis domain={[0, 90]} hide />

                      <Tooltip
                        formatter={(value, name) => [`${value} 分`, name]}
                        labelFormatter={(label) => {
                          const item = data.find((i) => i.label === label);
                          return `${label} ｜ ${item?.examDate ?? ""}`;
                        }}
                      />

                      <Legend />

                      <ReferenceLine
                        y={65}
                        stroke="#ef4444"
                        strokeDasharray="5 5"
                        label="目标"
                      />

                      <Bar
                        dataKey="listening"
                        name="听力"
                        fill="#2563eb"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="speaking"
                        name="口语"
                        fill="#16a34a"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="reading"
                        name="阅读"
                        fill="#9333ea"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="writing"
                        name="写作"
                        fill="#f97316"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}