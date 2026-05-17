// components/site/QuestionInfoCard.tsx

import Image from "next/image";

type QuestionInfo = {
    info: string | null;
    questions: string | null;
    contributing: string | null;
    examiner: string | null;
    suggestion: string | null;

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
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                    {label}
                </span>

                <span
                    className="text-sm font-semibold"
                    style={{ color }}
                >
                    {value}%
                </span>
            </div>

            <div className="h-1.5 overflow-hidden rounded bg-gray-100">
                <div
                    className="h-full rounded transition-all duration-500"
                    style={{
                        width: `${Math.min(value, 100)}%`,
                        backgroundColor: color,
                    }}
                />
            </div>
        </div>
    );
}

function InfoItem({
    title,
    value,
    svg,
}: {
    title: string;
    value?: string | null;
    svg: string;
}) {
    return (
        <div
            className="
                rounded
                bg-white/92
                p-4

                shadow-[0_2px_12px_rgba(0,0,0,0.03)]

                transition
                hover:bg-white
            "
        >
            <div className="flex items-start gap-3">
                <div className="mt-1 flex-shrink-0">
                    <Image
                        src={svg}
                        alt={title}
                        width={16}
                        height={16}
                        className="opacity-80"
                    />
                </div>

                <div className="min-w-0">
                    <div className="mb-1 text-base font-semibold uppercase tracking-[0.22em] text-[var(--theme)]">
                        {title}
                    </div>

                    <div className="text-[16px] leading-7 text-[var(--theme)]">
                        {value || "-"}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function QuestionInfoCard({
    questionInfo,
}: Props) {
    if (!questionInfo) return null;

    return (
        <section
            className="
                round
                bg-transparent
                p-0
                shadow-none
            "
        >
            <div
                className="
                    grid
                    gap-8
                    xl:grid-cols-[1.2fr_0.8fr_1fr]
                "
            >
                {/* COLUMN 1 */}
                <div className="grid grid-cols-2 gap-4 bg-transparent">
                    <InfoItem
                        title="题型"
                        value={questionInfo.info}
                        svg="/SVG/100.svg"
                    />

                    <InfoItem
                        title="缩写"
                        value={questionInfo.questions}
                        svg="/SVG/101.svg"
                    />

                    <InfoItem
                        title="分数贡献"
                        value={questionInfo.contributing}
                        svg="/SVG/102.svg"
                    />

                    <InfoItem
                        title="阅卷方式"
                        value={questionInfo.examiner}
                        svg="/SVG/103.svg"
                    />
                </div>

                {/* COLUMN 2 */}
                <div
                    className="
                        rounded
                        bg-white/92
                        p-5

                        shadow-[0_2px_12px_rgba(0,0,0,0.03)]
                    "
                >
                    <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">
                        Suggestion
                    </div>

                    <div className="text-[15px] leading-8 text-gray-700">
                        {questionInfo.suggestion}
                    </div>
                </div>

                {/* COLUMN 3 */}
                <div
                    className="
                        rounded
                        bg-white/92
                        p-5

                        shadow-[0_2px_12px_rgba(0,0,0,0.03)]
                    "
                >
                    <div className="mb-5 text-[14px] font-semibold uppercase tracking-[0.22em] text-[var(--theme)]">
                        Analysis
                    </div>

                    <div className="space-y-6">
                        <ProgressBar
                            label="Hitting Rate"
                            value={questionInfo.hitting_rate ?? 0}
                            color="#ef4444"
                        />

                        <ProgressBar
                            label="Stability"
                            value={questionInfo.stability ?? 0}
                            color="#3b82f6"
                        />

                        <ProgressBar
                            label="Importance"
                            value={questionInfo.importance ?? 0}
                            color="#22c55e"
                        />
                    </div>
                </div>

            </div>
        </section>
    );
}