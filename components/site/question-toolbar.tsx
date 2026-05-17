"use client";

import { Search, SlidersHorizontal } from "lucide-react";

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
                <select
                    value={questionStatus}
                    onChange={(e) =>
                        onQuestionStatusChange(
                            e.target.value
                        )
                    }
                    className="
                        rounded-sm
                        bg-white

                        px-4 py-3

                        text-sm
                        text-gray-700

                        outline-none

                        shadow-[0_2px_12px_rgba(0,0,0,0.03)]
                    "
                >
                    <option value="all">
                        全部题目
                    </option>

                    <option value="is_prediction">
                        活跃题目
                    </option>

                    <option value="new">
                        新增题目
                    </option>

                    <option value="newest">
                        最新题目
                    </option>

                    <option value="re_is_prediction">
                        重新活跃
                    </option>
                </select>

                {/* PRACTICE STATUS */}
                <select
                    value={practiceStatus}
                    onChange={(e) =>
                        onPracticeStatusChange(
                            e.target.value
                        )
                    }
                    className="
                        rounded-sm
                        bg-white

                        px-4 py-3

                        text-sm
                        text-gray-700

                        outline-none

                        shadow-[0_2px_12px_rgba(0,0,0,0.03)]
                    "
                >
                    <option value="all">
                        全部练习状态
                    </option>

                    <option value="practiced">
                        已练习
                    </option>

                    <option value="unpracticed">
                        未练习
                    </option>

                    <option value="wrong">
                        错题
                    </option>

                    <option value="mastered">
                        已掌握
                    </option>

                    <option value="weak">
                        薄弱题目
                    </option>
                </select>
                {/* ACTIVITY */}
                <select
                    value={activityStatus}
                    onChange={(e) =>
                        onActivityStatusChange(
                            e.target.value
                        )
                    }
                    className="
        rounded-sm
        bg-white

        px-4 py-3

        text-sm
        text-gray-700

        outline-none

        shadow-[0_2px_12px_rgba(0,0,0,0.03)]
    "
                >
                    <option value="all">
                        全部活跃度
                    </option>

                    <option value="most_practiced">
                        练习次数最多
                    </option>

                    <option value="recently_practiced">
                        最近练习
                    </option>

                    <option value="highest_score">
                        分数最高
                    </option>
                </select>
            </div>
        </div>
    );
}