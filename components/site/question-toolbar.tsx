"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import FilterSelect from "@/components/ui/FilterSelect";

type Props = {
    questionType: string;

    searchTerm: string;
    onSearchTermChange: (value: string) => void;

    questionStatus: string;
    onQuestionStatusChange: (value: string) => void;

    practiceStatus: string;
    onPracticeStatusChange: (value: string) => void;

    activityStatus: string;
    onActivityStatusChange: (value: string) => void;
};

export default function QuestionToolbar({
    questionType,

    searchTerm,
    onSearchTermChange,

    questionStatus,
    onQuestionStatusChange,

    practiceStatus,
    onPracticeStatusChange,

    activityStatus,
    onActivityStatusChange,
}: Props) {
    return (
        <div
            className="
                flex flex-col gap-4
                backdrop-blur-[6px]
                lg:flex-row
                lg:items-center
                lg:justify-start
            "
        >
            {/* LEFT */}
            <div
                className="
                    flex flex-1 flex-col gap-4
                    lg:flex-row
                "
            >
                {/* SEARCH */}
                <div
                    className="
                        flex flex-1 items-center gap-3

                        rounded-sm
                        bg-white

                        px-4 py-3

                        shadow-[0_2px_12px_rgba(0,0,0,0.03)]
                    "
                >
                    <Search className="h-4 w-4 text-gray-400" />

                    <input
                        value={searchTerm}
                        onChange={(e) =>
                            onSearchTermChange(
                                e.target.value
                            )
                        }
                        placeholder={`Search ${questionType} questions...`}
                        className="
                            w-full
                            bg-transparent

                            text-sm text-gray-700

                            outline-none

                            placeholder:text-gray-400
                        "
                    />
                </div>

                {/* QUESTION STATUS */}
                <FilterSelect
                    value={questionStatus}
                    onChange={onQuestionStatusChange}
                    options={[
                        {
                            label: "全部题目",
                            value: "all",
                        },
                        {
                            label: "活跃题目",
                            value: "is_prediction",
                        },
                        {
                            label: "新增题目",
                            value: "new",
                        },
                        {
                            label: "最新题目",
                            value: "newest",
                        },
                        {
                            label: "重新活跃",
                            value: "re_is_prediction",
                        },
                    ]}
                />

                {/* PRACTICE STATUS */}
                <FilterSelect
                    value={practiceStatus}
                    onChange={onPracticeStatusChange}
                    options={[
                        {
                            label: "全部练习状态",
                            value: "all",
                        },
                        {
                            label: "已练习",
                            value: "practiced",
                        },
                        {
                            label: "未练习",
                            value: "unpracticed",
                        },
                        {
                            label: "错题",
                            value: "wrong",
                        },
                        {
                            label: "已掌握",
                            value: "mastered",
                        },
                        {
                            label: "薄弱题目",
                            value: "weak",
                        },
                    ]}
                />

                {/* ACTIVITY */}
                <FilterSelect
                    value={activityStatus}
                    onChange={onActivityStatusChange}
                    options={[
                        {
                            label: "全部活跃度",
                            value: "all",
                        },
                        {
                            label: "练习次数最多",
                            value: "most_practiced",
                        },
                        {
                            label: "最近练习",
                            value: "recently_practiced",
                        },
                        {
                            label: "分数最高",
                            value: "highest_score",
                        },
                    ]}
                />
            </div>
        </div>
    );
}