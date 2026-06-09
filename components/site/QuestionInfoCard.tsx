"use client";

import Image from "next/image";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
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

const highImportanceQuestionTypes = new Set([
    "SST",
    "WFD",
    "FIBRW",
    "FIBR",
    "RA",
    "RS",
    "RL",
    "DI",
    "ESSAY",
    "WE",
    "SWT",
]);

const mediumImportanceQuestionTypes = new Set([
    "FIBL",
    "RO",
    "SGD",
    "RTS",
]);

function normalizeQuestionType(value: string | null) {
    return (value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function getImportanceColor(...questionTypes: Array<string | null>) {
    const normalizedTypes = questionTypes.map(normalizeQuestionType);

    if (normalizedTypes.some((type) => highImportanceQuestionTypes.has(type))) {
        return "#ef4444";
    }

    if (normalizedTypes.some((type) => mediumImportanceQuestionTypes.has(type))) {
        return "#f59e0b";
    }

    return undefined;
}

function ProgressBar({
    label,
    value,
    color,
    helper,
}: {
    label: string;
    value: number;
    color: string;
    helper: string;
}) {

    const safeValue = Math.max(0, Math.min(value, 100));

    return (

        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-3">

            <div className="mb-2.5 flex items-start justify-between gap-3">

                <div>

                    <div className="text-sm font-semibold leading-tight text-[var(--text)]">

                        {label}

                    </div>

                    <div className="mt-1 text-xs leading-4 text-[var(--text-soft)]">

                        {helper}

                    </div>

                </div>

                <div
                    className="shrink-0 whitespace-nowrap rounded-full bg-[var(--card)] px-2.5 py-1 text-xs font-semibold"
                    style={{ color }}
                >

                    {safeValue}%

                </div>

            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--card)]">

                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                        width: `${safeValue}%`,
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
    featured = false,
}: {
    title: string;
    value?: string | null;
    svg: string;
    featured?: boolean;
}) {

    return (

        <div
            className={`rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-3 ${
                featured ? "sm:col-span-2" : ""
            }`}
        >

            <div className="mb-2 flex items-center gap-2">

                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)]">

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
                    className="whitespace-nowrap px-2 py-0.5 text-[10px] font-semibold tracking-[0.04em]"
                >

                    {title}

                </Badge>

            </div>

            <div className="text-[13px] font-medium leading-5 text-[var(--text)]">

                {value || "-"}

            </div>

        </div>

    );

}

function MetricCard({
    label,
    value,
    valueColor,
}: {
    label: string;
    value: number | null;
    valueColor?: string;
}) {

    const safeValue = Math.max(0, Math.min(value ?? 0, 100));

    return (

        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card-soft)] p-4">

            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-soft)]">

                {label}

            </div>

            <div className="mt-2 flex items-end gap-1">

                <span
                    className="text-2xl font-semibold tracking-tight text-[var(--text)]"
                    style={valueColor ? { color: valueColor } : undefined}
                >

                    {safeValue}

                </span>

                <span
                    className="pb-1 text-xs font-semibold text-[var(--text-soft)]"
                    style={valueColor ? { color: valueColor } : undefined}
                >

                    %

                </span>

            </div>

        </div>

    );

}

export function QuestionInfoCard({
    questionInfo,
}: Props) {

    if (!questionInfo) return null;

    const importanceColor = getImportanceColor(
        questionInfo.questions,
        questionInfo.info,
    );

    return (

        <section className="bg-transparent">

            <Card className="overflow-hidden rounded-[var(--radius-lg)] border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">

                <CardHeader className="flex-col items-start gap-3 border-b border-[var(--border)] bg-[var(--card-soft)] px-5 py-4 sm:px-6">

                    <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

                        <div className="min-w-0">

                            <div className="mb-3 flex flex-wrap items-center gap-2">

                                <Badge>Question Guide</Badge>

                                {questionInfo.questions ? (

                                    <Badge variant="outline">

                                        {questionInfo.questions}

                                    </Badge>

                                ) : null}

                            </div>

                            <CardTitle className="text-xl sm:text-2xl">

                                题型详细信息

                            </CardTitle>

                            <CardDescription className="max-w-2xl leading-5">

                                了解题型定位、评分方式、屏幕说明与备考重点，快速判断当前题型在备考中的优先级。

                            </CardDescription>

                        </div>

                        <div className="grid w-full gap-3 sm:grid-cols-3 lg:max-w-md">

                            <MetricCard
                                label="重要性"
                                value={questionInfo.importance}
                                valueColor={importanceColor}
                            />

                            <MetricCard
                                label="命中率"
                                value={questionInfo.hitting_rate}
                            />

                            <MetricCard
                                label="更新率"
                                value={questionInfo.stability}
                            />

                        </div>

                    </div>

                </CardHeader>

                <CardContent className="p-4 sm:p-5">

                    <div className="grid gap-4 xl:grid-cols-[1fr_350px]">

                        <div className="space-y-3">

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

                            <div className="grid gap-3 sm:grid-cols-2">

                                <SectionItem
                                    title="作答说明"
                                    value={questionInfo.screen_instruction}
                                    svg="/SVG/104.svg"
                                    featured
                                />

                                <SectionItem
                                    title="官方要求"
                                    value={questionInfo.official_requirements}
                                    svg="/SVG/105.svg"
                                    featured
                                />

                            </div>

                            <SectionItem
                                title="学习建议"
                                value={questionInfo.suggestion}
                                svg="/SVG/106.svg"
                                featured
                            />

                        </div>

                        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card-soft)] p-3.5">

                            <div className="mb-3 flex items-start justify-between gap-3">

                                <div>

                                    <div className="text-base font-semibold leading-tight text-[var(--text)]">

                                        题库数据分析

                                    </div>

                                    <div className="mt-1 text-xs leading-5 text-[var(--text-soft)]">

                                        参考题型趋势与备考优先级，用于安排练习顺序。

                                    </div>

                                </div>

                                <Badge variant="secondary" className="shrink-0 whitespace-nowrap">
                                    百分比
                                </Badge>

                            </div>

                            <div className="space-y-2.5">

                                <ProgressBar
                                    label="题型优先级"
                                    value={questionInfo.importance ?? 0}
                                    color={importanceColor ?? "#f87171"}
                                    helper="反映该题型在整体备考中的优先程度"
                                />

                                <ProgressBar
                                    label="考试命中率"
                                    value={questionInfo.hitting_rate ?? 0}
                                    color="#10b981"
                                    helper="用于参考近期题库与练习价值"
                                />

                                <ProgressBar
                                    label="更新率"
                                    value={questionInfo.stability ?? 0}
                                    color="#3b82f6"
                                    helper="表示题型内容或题库变化频率"
                                />

                            </div>

                        </div>

                    </div>

                </CardContent>

            </Card>

        </section>

    );

}
