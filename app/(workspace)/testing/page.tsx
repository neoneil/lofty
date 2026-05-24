"use client";

import {
  ArrowUpRight,
  Brain,
  ChartColumn,
  CircleAlert,
  Target,
  TrendingUp,
} from "lucide-react";

import { AnalyticsChart } from "@/components/dashboard-v2/analytics-chart";

import { Badge } from "@/components/ui-v2/badge";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-v2/card";

const data = [
  { day: "Mon", score: 45 },
  { day: "Tue", score: 58 },
  { day: "Wed", score: 64 },
  { day: "Thu", score: 71 },
  { day: "Fri", score: 68 },
  { day: "Sat", score: 82 },
  { day: "Sun", score: 88 },
];

const data1 = [
  { type: "WFD", accuracy: 92 },
  { type: "RS", accuracy: 76 },
  { type: "RA", accuracy: 81 },
  { type: "DI", accuracy: 68 },
];

const data2 = [
  { name: "Listening", value: 42 },
  { name: "Speaking", value: 28 },
  { name: "Reading", value: 18 },
  { name: "Writing", value: 12 },
];

const data3 = [
  { week: "Week 1", score: 52 },
  { week: "Week 2", score: 59 },
  { week: "Week 3", score: 66 },
  { week: "Week 4", score: 74 },
  { week: "Week 5", score: 81 },
];

export default function AnalyticsPreviewPage() {

  return (

    <div className="min-h-screen bg-[var(--bg)]">

      <div className="mx-auto flex w-full max-w-[1700px] flex-col gap-6 px-4 py-6 lg:px-6">

        {/* HEADER */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <Badge className="mb-3">
              Lofty AI
            </Badge>

            <h1 className="text-3xl font-semibold tracking-tight text-[var(--text)]">
              复习趋势总览
            </h1>

            <p className="mt-2 text-sm text-[var(--text-soft)]">
              Reusable analytics components designed for your AI-powered learning platform.
            </p>

          </div>

        </div>

        {/* KPI */}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

          <Card>

            <CardContent className="flex items-center justify-between">

              <div>

                <div className="mb-2 text-sm text-[var(--text-soft)]">
                  平均正确率（已练习）
                </div>

                <div className="text-3xl font-semibold text-[var(--text)]">
                  78
                </div>

                <div className="mt-2 flex items-center gap-1 text-sm text-[var(--success)]">

                  <ArrowUpRight size={15} />

                  +12%

                </div>

              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--primary-soft)] text-[var(--primary)]">

                <TrendingUp size={24} />

              </div>

            </CardContent>

          </Card>

          <Card>

            <CardContent className="flex items-center justify-between">

              <div>

                <div className="mb-2 text-sm text-[var(--text-soft)]">
                  持续复习天数
                </div>

                <div className="text-3xl font-semibold text-[var(--text)]">
                  21
                </div>

                <div className="mt-2 text-sm text-[var(--text-soft)]">
                  天
                </div>

              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--warning-soft)] text-[var(--warning)]">

                <Target size={24} />

              </div>

            </CardContent>

          </Card>

          <Card>

            <CardContent className="flex items-center justify-between">

              <div>

                <div className="mb-2 text-sm text-[var(--text-soft)]">
                  最薄弱题型（已练习）
                </div>

                <div className="text-3xl font-semibold text-[var(--text)]">
                  RS
                </div>

                <div className="mt-2 text-sm text-[var(--danger)]">
                  需尽快提升
                </div>

              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--danger-soft)] text-[var(--danger)]">

                <CircleAlert size={24} />

              </div>

            </CardContent>

          </Card>

          <Card>

            <CardContent className="flex items-center justify-between">

              <div>

                <div className="mb-2 text-sm text-[var(--text-soft)]">
                  AI 精度
                </div>

                <div className="text-3xl font-semibold text-[var(--text)]">
                  84%
                </div>

                <div className="mt-2 text-sm text-[var(--text-soft)]">
                  基于已练习题目
                </div>

              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--success-soft)] text-[var(--success)]">

                <Brain size={24} />

              </div>

            </CardContent>

          </Card>

        </div>

        {/* CHARTS */}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

          {/* AREA */}

          <Card>

            <CardHeader>

              <div>

                <Badge variant="secondary" className="mb-3">
                  Area Chart
                </Badge>

                <CardTitle>
                  周进步趋势
                </CardTitle>

                <CardDescription>
                  查看过往分数与目标分数的差距
                </CardDescription>

              </div>

            </CardHeader>

            <CardContent>

              <AnalyticsChart
                variant="area"
                data={data}
                xKey="day"
                yKey="score"
                goal={79}
                height={360}
              />

            </CardContent>

          </Card>

          {/* LINE */}

          <Card>

            <CardHeader>

              <div>

                <Badge variant="secondary" className="mb-3">
                  Line Chart
                </Badge>

                <CardTitle>
                  某个题型分数提升
                </CardTitle>

                <CardDescription>
                  可以显示某种提醒的连续进步趋势
                </CardDescription>

              </div>

            </CardHeader>

            <CardContent>

              <AnalyticsChart
                variant="line"
                data={data3}
                xKey="week"
                yKey="score"
                tone="success"
                goal={79}
                height={360}
              />

            </CardContent>

          </Card>

          {/* BAR */}

          <Card>

            <CardHeader>

              <div>

                <Badge variant="secondary" className="mb-3">
                  Bar Chart
                </Badge>

                <CardTitle>
                  题型准确率
                </CardTitle>

                <CardDescription>
                  各个题型的准确度，帮助掌握各个题型的准确率
                </CardDescription>

              </div>

            </CardHeader>

            <CardContent>

              <AnalyticsChart
                variant="bar"
                data={data1}
                xKey="type"
                yKey="accuracy"
                tone="warning"
                height={360}
              />

            </CardContent>

          </Card>

          {/* PIE */}

          <Card>

            <CardHeader>

              <div>

                <Badge variant="secondary" className="mb-3">
                  Pie Chart
                </Badge>

                <CardTitle>
                  听说读写时间分配
                </CardTitle>

                <CardDescription>
                  掌握各个部分的学习时间
                </CardDescription>

              </div>

            </CardHeader>

            <CardContent>

              <AnalyticsChart
                variant="pie"
                data={data2}
                pieDataKey="value"
                pieNameKey="name"
                showLegend
                height={360}
              />

            </CardContent>

          </Card>

        </div>

        {/* FULL WIDTH */}

        <Card>

          <CardHeader>

            <div className="flex items-center justify-between gap-4">

              <div>

                <Badge variant="secondary" className="mb-3">
                  Premium Analytics
                </Badge>

                <CardTitle>
                  AI Performance Intelligence
                </CardTitle>

                <CardDescription>
                  Enterprise-style analytics section designed for LoftyPTE.
                </CardDescription>

              </div>

              <div className="hidden h-14 w-14 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--primary-soft)] text-[var(--primary)] lg:flex">

                <ChartColumn size={26} />

              </div>

            </div>

          </CardHeader>

          <CardContent>

            <AnalyticsChart
              variant="area"
              data={data3}
              xKey="week"
              yKey="score"
              tone="primary"
              goal={79}
              height={420}
            />

          </CardContent>

        </Card>

      </div>

    </div>

  );

}