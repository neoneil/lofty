"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

const data = [
  { day: "Mon", score: 45 },
  { day: "Tue", score: 58 },
  { day: "Wed", score: 64 },
  { day: "Thu", score: 71 },
  { day: "Fri", score: 68 },
  { day: "Sat", score: 82 },
  { day: "Sun", score: 88 },
];

export function StudyChart() {
  return (
    <ResponsiveContainer
      width="100%"
      height="100%"
    >
      <AreaChart data={data}>
        <defs>
          <linearGradient
            id="scoreGradient"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor="var(--primary)"
              stopOpacity={0.35}
            />

            <stop
              offset="100%"
              stopColor="var(--primary)"
              stopOpacity={0}
            />
          </linearGradient>
        </defs>

        <CartesianGrid
          stroke="var(--border)"
          vertical={false}
        />

        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tick={{
            fill: "var(--text-soft)",
            fontSize: 12,
          }}
        />

        <Tooltip />

        <Area
          type="monotone"
          dataKey="score"
          stroke="var(--primary)"
          strokeWidth={3}
          fill="url(#scoreGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}