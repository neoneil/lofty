"use client";

import { useMemo, useState } from "react";
import AccordionCard from "@/components/site/accordion-card";

type SpeakingPart1Question = {
    id: number;
    topic_title: string;
    question_number: number;
    question_text: string;
    answer_text: string;
};

type SpeakingPart2Topic = {
    id: number;
    chinese_title: string | null;
    english_title: string | null;
    part2_question: string | null;
    cue_card_1: string | null;
    cue_card_2: string | null;
    cue_card_3: string | null;
    cue_card_4: string | null;
    part3_q1: string | null;
    part3_q2: string | null;
    part3_q3: string | null;
    part3_q4: string | null;
    part3_q5: string | null;
    part3_q6: string | null;
    part3_q7: string | null;
    part3_q8: string | null;
    part3_q9: string | null;
    part3_q10: string | null;
    category: string | null;
    difficulty: string | null;
    status: string | null;
    sort_order: number | null;
};

type Props = {
    part1Questions: SpeakingPart1Question[];
    part2Topics: SpeakingPart2Topic[];
};

export default function SpeakingBrowser({
    part1Questions,
    part2Topics,
}: Props) {
    const [activePart1Topic, setActivePart1Topic] = useState("All");
    const [activePart2Category, setActivePart2Category] = useState("All");

    const groupedPart1 = useMemo(() => {
        return Object.values(
            part1Questions.reduce<
                Record<string, { topic: string; items: SpeakingPart1Question[] }>
            >((acc, item) => {
                if (!acc[item.topic_title]) {
                    acc[item.topic_title] = {
                        topic: item.topic_title,
                        items: [],
                    };
                }
                acc[item.topic_title].items.push(item);
                return acc;
            }, {})
        ).sort((a, b) => a.topic.localeCompare(b.topic));
    }, [part1Questions]);

    const part1Filters = useMemo(() => {
        return [
            { label: "All", count: part1Questions.length },
            ...groupedPart1.map((group) => ({
                label: group.topic,
                count: group.items.length,
            })),
        ];
    }, [groupedPart1, part1Questions.length]);

    const visiblePart1Groups = useMemo(() => {
        if (activePart1Topic === "All") return groupedPart1;
        return groupedPart1.filter((group) => group.topic === activePart1Topic);
    }, [activePart1Topic, groupedPart1]);

    const part2Filters = useMemo(() => {
        const counts = part2Topics.reduce<Record<string, number>>((acc, item) => {
            const key = item.category || "Uncategorized";
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        return [
            { label: "All", count: part2Topics.length },
            ...Object.entries(counts)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([label, count]) => ({ label, count })),
        ];
    }, [part2Topics]);

    const visiblePart2Topics = useMemo(() => {
        if (activePart2Category === "All") return part2Topics;
        return part2Topics.filter(
            (item) => (item.category || "Uncategorized") === activePart2Category
        );
    }, [activePart2Category, part2Topics]);

    // 导出 pdf
    const [isExportingPart1, setIsExportingPart1] = useState(false);
    const [isExportingPart2, setIsExportingPart2] = useState(false);

    async function downloadPdf(blob: Blob, filename: string) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    }

    async function handleExportPart1() {
        try {
            setIsExportingPart1(true);

            const res = await fetch("/api/ielts/speaking/export", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    part: "part1",
                    topic: activePart1Topic,
                }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Part 1 PDF 导出失败");
            }

            const blob = await res.blob();
            const filename =
                activePart1Topic === "All"
                    ? "speaking-part1-all.pdf"
                    : `speaking-part1-${activePart1Topic}.pdf`;

            await downloadPdf(blob, filename);
        } catch (error) {
            console.error(error);
            alert("Part 1 PDF 导出失败");
        } finally {
            setIsExportingPart1(false);
        }
    }

    async function handleExportPart2() {
        try {
            setIsExportingPart2(true);

            const res = await fetch("/api/ielts/speaking/export", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    part: "part2",
                    category: activePart2Category,
                }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Part 2/3 PDF 导出失败");
            }

            const blob = await res.blob();
            const filename =
                activePart2Category === "All"
                    ? "speaking-part2-3-all.pdf"
                    : `speaking-part2-3-${activePart2Category}.pdf`;

            await downloadPdf(blob, filename);
        } catch (error) {
            console.error(error);
            alert("Part 2/3 PDF 导出失败");
        } finally {
            setIsExportingPart2(false);
        }
    }



    return (
        <div className="space-y-14">
            {/* Part 1 */}
            <section>
                <div className="mb-6 flex items-end justify-between gap-4">
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-(--theme)">
                            Speaking Section
                        </p>
                        <h2 className="text-2xl font-semibold text-(--theme) sm:text-3xl">
                            Part 1
                        </h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div
                            className="rounded border px-4 py-2 text-sm text-(--theme)"
                            style={{ borderColor: "var(--border)" }}
                        >
                            {visiblePart1Groups.reduce((sum, group) => sum + group.items.length, 0)} questions
                        </div>

                        <button
                            type="button"
                            onClick={handleExportPart1}
                            disabled={isExportingPart1}
                            className="btn-secondary rounded"
                            style={{ borderColor: "var(--border)" }}
                        >
                            {isExportingPart1 ? "Exporting..." : "下载 Part 1 PDF"}
                        </button>
                    </div>
                </div>
                {/* <div className="mb-6 flex items-end justify-between gap-4">
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                            Speaking Section
                        </p>
                        <h2 className="text-2xl font-semibold text-black sm:text-3xl">
                            Part 1
                        </h2>
                    </div>

                    <div
                        className="rounded border px-4 py-2 text-sm text-gray-600"
                        style={{ borderColor: "var(--border)" }}
                    >
                        {part1Questions.length} questions
                    </div>
                </div> */}

                <div className="mb-6 flex flex-wrap gap-3">
                    {part1Filters.map((filter) => {
                        const active = activePart1Topic === filter.label;

                        return (
                            <button
                                key={filter.label}
                                type="button"
                                onClick={() => setActivePart1Topic(filter.label)}
                                className={`
                                        pill-button
                                        ${active
                                        ? "bg-(--theme) text-white shadow-md"
                                        : "bg-(--bg) text-(--theme) hover:shadow-md"
                                    }
`}
                                style={{ borderColor: "var(--border)" }}
                            >
                                {filter.label} ({filter.count})
                            </button>
                        );
                    })}
                </div>

                <div className="space-y-5">
                    {visiblePart1Groups.map((group) => (
                        <AccordionCard
                            key={group.topic}
                            title={group.topic}
                            subtitle="Speaking Part 1"
                            badge={`${group.items.length} Questions`}
                        >
                            <div className="space-y-5">
                                {group.items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="
                      rounded border bg-(--card-soft) px-4 py-4
                      transition-all duration-300
                      hover:-translate-y-0.5 hover:shadow-md
                    "
                                        style={{ borderColor: "var(--border)" }}
                                    >
                                        <p className="mb-2 text-sm font-medium text-gray-500">
                                            Question {item.question_number}
                                        </p>

                                        <h3 className="mb-3 text-base font-semibold leading-7 text-(--theme) sm:text-lg">
                                            {item.question_text}
                                        </h3>

                                        <p className="text-sm leading-7 text-gray-700 sm:text-base">
                                            {item.answer_text}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </AccordionCard>
                    ))}
                </div>
            </section>

            {/* Part 2 */}
            <section>
                <div className="mb-6 flex items-end justify-between gap-4">
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                            Speaking Section
                        </p>
                        <h2 className="text-2xl font-semibold text-(--theme) sm:text-3xl">
                            Part 2
                        </h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div
                            className="rounded border px-4 py-2 text-sm text-gray-600"
                            style={{ borderColor: "var(--border)" }}
                        >
                            {visiblePart2Topics.length} Questions
                        </div>

                        <button
                            type="button"
                            onClick={handleExportPart2}
                            disabled={isExportingPart2}
                            className="btn-secondary rounded"
                            style={{ borderColor: "var(--border)" }}
                        >
                            {isExportingPart2 ? "Exporting..." : "下载 Part 2/3 PDF"}
                        </button>
                    </div>
                </div>


                {/* <div className="mb-6 flex items-end justify-between gap-4">
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                            Speaking Section
                        </p>
                        <h2 className="text-2xl font-semibold text-black sm:text-3xl">
                            Part 2
                        </h2>
                    </div>

                    <div
                        className="rounded border px-4 py-2 text-sm text-gray-600"
                        style={{ borderColor: "var(--border)" }}
                    >
                        {part2Topics.length} cards
                    </div>
                </div> */}

                <div className="mb-6 flex flex-wrap gap-3">
                    {part2Filters.map((filter) => {
                        const active = activePart2Category === filter.label;

                        return (
                            <button
                                key={filter.label}
                                type="button"
                                onClick={() => setActivePart2Category(filter.label)}
                                className={`
                                            pill-button
                                            ${active
                                        ? "bg-(--theme) text-white shadow-md"
                                        : "bg-(--bg) text-(--theme) hover:shadow-md"
                                    }
                                `}
                                style={{ borderColor: "var(--border)" }}
                            >
                                {filter.label} ({filter.count})
                            </button>
                        );
                    })}
                </div>

                <div className="space-y-5">
                    {visiblePart2Topics.map((item) => {
                        const part3Questions = [
                            item.part3_q1,
                            item.part3_q2,
                            item.part3_q3,
                            item.part3_q4,
                            item.part3_q5,
                            item.part3_q6,
                            item.part3_q7,
                            item.part3_q8,
                            item.part3_q9,
                            item.part3_q10,
                        ].filter(Boolean) as string[];

                        const cueCards = [
                            item.cue_card_1,
                            item.cue_card_2,
                            item.cue_card_3,
                            item.cue_card_4,
                        ].filter(Boolean) as string[];

                        return (
                            <AccordionCard
                                key={item.id}
                                title={item.english_title || item.part2_question || "Untitled"}
                                subtitle={item.category || "Speaking Part 2"}
                                badge={item.difficulty || "general"}
                            >
                                <div className="space-y-6">
                                    {item.chinese_title && (
                                        <p className="text-base font-medium leading-7 text-(--theme) sm:text-lg">
                                            {item.chinese_title}
                                        </p>
                                    )}

                                    {item.part2_question && (
                                        <div>
                                            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                                                Part 2 Question
                                            </p>
                                            <p className="text-base leading-7 text-(--theme)  sm:text-lg">
                                                {item.part2_question}
                                            </p>
                                        </div>
                                    )}

                                    {cueCards.length > 0 && (
                                        <div
                                            className="rounded border bg-(--card-soft) px-5 py-5"
                                            style={{ borderColor: "var(--border)" }}
                                        >
                                            <p className="mb-4 text-sm font-semibold text-(--theme) ">
                                                You should say:
                                            </p>

                                            <div className="space-y-3">
                                                {cueCards.map((cue, index) => (
                                                    <div key={index} className="flex items-start gap-3">
                                                        <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded bg-(--theme)" />
                                                        <p className="text-sm leading-7 text-(--theme)  sm:text-base">
                                                            {cue}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {part3Questions.length > 0 && (
                                        <div>
                                            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                                                Part 3 Discussion
                                            </p>

                                            <div className="space-y-3">
                                                {part3Questions.map((q, index) => (
                                                    <div
                                                        key={index}
                                                        className="
                              rounded border px-4 py-4
                              transition-all duration-300
                              hover:-translate-y-0.5 hover:shadow-md
                            "
                                                        style={{ borderColor: "var(--border)" }}
                                                    >
                                                        <p className="text-sm leading-7 text-(--theme)  sm:text-base">
                                                            <span className="mr-2 font-semibold text-gray-500">
                                                                Q{index + 1}.
                                                            </span>
                                                            {q}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </AccordionCard>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}