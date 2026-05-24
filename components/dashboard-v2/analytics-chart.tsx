"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Variant =
  | "area"
  | "line"
  | "bar"
  | "pie";

type Tone =
  | "primary"
  | "success"
  | "warning"
  | "danger";

type Props = {
  variant?: Variant;

  data: Record<string, any>[];

  xKey?: string;

  yKey?: string;

  height?: number;

  showGrid?: boolean;

  showTooltip?: boolean;

  showLegend?: boolean;

  smooth?: boolean;

  goal?: number;

  tone?: Tone;

  pieDataKey?: string;

  pieNameKey?: string;
};

const toneMap = {

  primary: {
    stroke: "var(--primary)",
    fill: "var(--primary)",
    soft: "var(--primary-soft)",
  },

  success: {
    stroke: "var(--success)",
    fill: "var(--success)",
    soft: "var(--success-soft)",
  },

  warning: {
    stroke: "var(--warning)",
    fill: "var(--warning)",
    soft: "var(--warning-soft)",
  },

  danger: {
    stroke: "var(--danger)",
    fill: "var(--danger)",
    soft: "var(--danger-soft)",
  },

};

const pieColors = [
  "var(--primary)",
  "var(--success)",
  "var(--warning)",
  "var(--danger)",
  "#8b5cf6",
  "#06b6d4",
];

export function AnalyticsChart({
  variant = "area",
  data,
  xKey = "label",
  yKey = "value",
  height = 320,
  showGrid = true,
  showTooltip = true,
  showLegend = false,
  smooth = true,
  goal,
  tone = "primary",
  pieDataKey = "value",
  pieNameKey = "name",
}: Props) {

  const colors =
    toneMap[tone];

  const chartType =
    smooth
      ? "monotone"
      : "linear";

  return (

    <div
      className="w-full"
      style={{ height }}
    >

      <ResponsiveContainer width="100%" height="100%">

        {/* AREA */}

        {variant === "area" && (

          <AreaChart data={data}>

            <defs>

              <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">

                <stop offset="0%" stopColor={colors.fill} stopOpacity={0.35} />

                <stop offset="100%" stopColor={colors.fill} stopOpacity={0} />

              </linearGradient>

            </defs>

            {showGrid && (
              <CartesianGrid stroke="var(--border)" vertical={false} />
            )}

            <XAxis
              dataKey={xKey}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#9ea3b5", fontSize: 12 }}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#9ea3b5", fontSize: 12 }}
            />

            {showTooltip && <Tooltip />}

            {showLegend && <Legend />}

            {goal && (

              <Line
                type="linear"
                dataKey={() => goal}
                stroke="var(--danger)"
                strokeDasharray="6 6"
                dot={false}
                strokeWidth={2}
              />

            )}

            <Area
              type={chartType}
              dataKey={yKey}
              stroke={colors.stroke}
              strokeWidth={3}
              fill="url(#analyticsGradient)"
            />

          </AreaChart>

        )}

        {/* LINE */}

        {variant === "line" && (

          <LineChart data={data}>

            {showGrid && (
              <CartesianGrid stroke="var(--border)" vertical={false} />
            )}

            <XAxis
              dataKey={xKey}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#9ea3b5", fontSize: 12 }}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#9ea3b5", fontSize: 12 }}
            />

            {showTooltip && <Tooltip />}

            {showLegend && <Legend />}

            {goal && (

              <Line
                type="linear"
                dataKey={() => goal}
                stroke="var(--danger)"
                strokeDasharray="6 6"
                dot={false}
                strokeWidth={2}
              />

            )}

            <Line
              type={chartType}
              dataKey={yKey}
              stroke={colors.stroke}
              strokeWidth={3}
              dot={{
                r: 4,
                fill: colors.fill,
                strokeWidth: 0,
              }}
              activeDot={{
                r: 6,
              }}
            />

          </LineChart>

        )}

        {/* BAR */}

        {variant === "bar" && (

          <BarChart data={data}>

            {showGrid && (
              <CartesianGrid stroke="var(--border)" vertical={false} />
            )}

            <XAxis
              dataKey={xKey}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#9ea3b5", fontSize: 12 }}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#9ea3b5", fontSize: 12 }}
            />

            {showTooltip && <Tooltip />}

            {showLegend && <Legend />}

            <Bar
              dataKey={yKey}
              fill={colors.fill}
              radius={[10, 10, 0, 0]}
            />

          </BarChart>

        )}

        {/* PIE */}

        {variant === "pie" && (

          <PieChart>

            {showTooltip && <Tooltip />}

            {showLegend && <Legend />}

            <Pie
              data={data}
              dataKey={pieDataKey}
              nameKey={pieNameKey}
              innerRadius={70}
              outerRadius={110}
              paddingAngle={4}
            >

              {data.map((_, index) => (

                <Cell
                  key={index}
                  fill={pieColors[index % pieColors.length]}
                />

              ))}

            </Pie>

          </PieChart>

        )}

      </ResponsiveContainer>

    </div>

  );

}