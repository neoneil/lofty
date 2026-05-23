"use client";

// components/site/QuestionInfoCard.tsx

import Image from "next/image";

import {
    Card,
    CardContent,
} from "@/components/ui-v2/card";

import {
    Badge,
} from "@/components/ui-v2/badge";

type QuestionInfo = {
    info: string | null;
    questions: string | null;
    contributing: string | null;
    examiner: string | null;
    suggestion: string | null;
    screen_instruction: string | null;
    official_requirements: string | null;

    hitting_rate: number | null;
    stability: number | null;
    importance: number | null;
};

type Props = {
    questionInfo: QuestionInfo | null;
};

function ProgressBar({
    label,
    value,
    color,
}: {
    label: string;
    value: number;
    color: string;
}) {

    return (

        <div className="space-y-1.5">

            <div className="flex items-center justify-between">

                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-soft)]">

                    {label}

                </span>

                <span
                    className="text-xs font-semibold"
                    style={{ color }}
                >

                    {value}%

                </span>

            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-soft)]">

                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                        width: `${Math.min(value, 100)}%`,
                        backgroundColor: color,
                    }}
                />

            </div>

        </div>

    );

}

function SectionItem({
    title,
    value,
    svg,
}: {
    title: string;
    value?: string | null;
    svg: string;
}) {

    return (

        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-2.5">

            <div className="mb-1.5 flex items-center gap-1.5">

                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-[var(--primary-soft)]">

                    <Image
                        src={svg}
                        alt={title}
                        width={13}
                        height={13}
                        className="opacity-90"
                    />

                </div>

                <Badge
                    variant="secondary"
                    className="px-2.5 py-0 text-[9px] font-semibold tracking-[0.04em]"
                >

                    {title}

                </Badge>

            </div>

            <div className="pl-0.5 text-[12.5px] font-medium leading-5 tracking-tight text-[var(--text)]">

                {value || "-"}

            </div>

        </div>

    );

}

export function QuestionInfoCard({
    questionInfo,
}: Props) {

    if (!questionInfo) return null;

    return (

        <section className="bg-transparent">

            <div className="grid gap-3 xl:grid-cols-[1.5fr_0.65fr]">

                {/* LEFT BIG CARD */}

                <Card className="border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">

                    <CardContent className="p-5 sm:p-6">

                        <div className="mb-5 flex items-center justify-between">

                            <div>

                                <div className="mb-1 text-lg font-semibold tracking-tight text-[var(--text)]">

                                    题型详细信息

                                </div>

                                <div className="text-xs font-medium tracking-tight text-[var(--text-soft)]">

                                    题型介绍、评分规则与作答要求

                                </div>

                            </div>

                            <Badge className="px-2.5 text-[10px] tracking-[0.08em]">

                                Detail

                            </Badge>

                        </div>

                        {/* 第一行 */}

                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

                            <SectionItem
                                title="题型"
                                value={questionInfo.info}
                                svg="/SVG/100.svg"
                            />

                            <SectionItem
                                title="缩写"
                                value={questionInfo.questions}
                                svg="/SVG/101.svg"
                            />

                            <SectionItem
                                title="分数贡献"
                                value={questionInfo.contributing}
                                svg="/SVG/102.svg"
                            />

                            <SectionItem
                                title="阅卷方式"
                                value={questionInfo.examiner}
                                svg="/SVG/103.svg"
                            />

                        </div>

                        {/* 第二行 */}

                        <div className="mt-3 grid gap-3 xl:grid-cols-2">

                            <SectionItem
                                title="作答说明"
                                value={questionInfo.screen_instruction}
                                svg="/SVG/104.svg"
                            />

                            <SectionItem
                                title="官方要求"
                                value={questionInfo.official_requirements}
                                svg="/SVG/105.svg"
                            />

                        </div>

                        {/* 学习建议 */}

                        <div className="mt-3">

                            <SectionItem
                                title="学习建议"
                                value={questionInfo.suggestion}
                                svg="/SVG/106.svg"
                            />

                        </div>

                    </CardContent>

                </Card>

                {/* RIGHT AI */}

                <Card className="border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">

                    <CardContent className="flex h-full flex-col p-5 sm:p-6">

                        <div className="mb-5 flex items-center justify-between">

                            <div>

                                <div className="mb-1 text-lg font-semibold tracking-tight text-[var(--text)]">

                                    题库数据分析

                                </div>

                                <div className="text-xs font-medium tracking-tight text-[var(--text-soft)]">

                                    题型趋势预测

                                </div>

                            </div>

                            <Badge className="px-2.5 text-[10px] tracking-[0.08em]">

                                百分比

                            </Badge>

                        </div>

                        <div className="flex-1 space-y-5">

                            <ProgressBar
                                label="题型重要性"
                                value={questionInfo.importance ?? 0}
                                color="#f87171"
                            />

                            <ProgressBar
                                label="考试命中率"
                                value={questionInfo.hitting_rate ?? 0}
                                color="#10b981"
                            />

                            <ProgressBar
                                label="更新率"
                                value={questionInfo.stability ?? 0}
                                color="#3b82f6"
                            />

                        </div>

                    </CardContent>

                </Card>

            </div>

        </section>

    );

}