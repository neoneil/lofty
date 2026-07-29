"use client";

import { ReactNode, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import FilterSelect from "@/components/ui/FilterSelect";
import { Button } from "@/components/ui-v2/button";

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

    extraFilters?: ReactNode;
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

    extraFilters,
}: Props) {
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const renderFilters = () => (
        <>
            <FilterSelect
                value={questionStatus}
                onChange={onQuestionStatusChange}
                options={[
                    { label: "全部题目", value: "all" },
                    { label: "活跃题目", value: "is_prediction" },
                    { label: "新增题目", value: "new" },
                    { label: "最新题目", value: "newest" },
                    { label: "重新活跃", value: "re_is_prediction" },
                ]}
            />

            <FilterSelect
                value={practiceStatus}
                onChange={onPracticeStatusChange}
                options={[
                    { label: "全部练习状态", value: "all" },
                    { label: "已练习", value: "practiced" },
                    { label: "未练习", value: "unpracticed" },
                    { label: "错题", value: "wrong" },
                    { label: "已掌握", value: "mastered" },
                    { label: "薄弱题目", value: "weak" },
                ]}
            />

            <FilterSelect
                value={activityStatus}
                onChange={onActivityStatusChange}
                options={[
                    { label: "全部活跃度", value: "all" },
                    { label: "练习次数最多", value: "most_practiced" },
                    { label: "最近练习", value: "recently_practiced" },
                    { label: "分数最高", value: "highest_score" },
                ]}
            />

            {extraFilters}
        </>
    );

    return (
        <div
            className="flex flex-col gap-3 backdrop-blur-[6px] lg:flex-row lg:items-center lg:justify-start"
        >
            <div className="flex flex-1 flex-col gap-3 lg:flex-row">
                <div className="flex flex-1 items-center gap-3 rounded-[var(--radius-md)] bg-[var(--card)] px-4 py-3 shadow-[var(--shadow-sm)]">
                    <Search className="h-4 w-4 text-[var(--text-faint)]" />

                    <input
                        value={searchTerm}
                        onChange={(e) => onSearchTermChange(e.target.value)}
                        placeholder={`Search ${questionType} questions...`}
                        className="w-full bg-transparent text-base text-[var(--text)] outline-none placeholder:text-[var(--text-faint)] sm:text-sm"
                    />

                <Button type="button" size="sm" variant="secondary" onClick={() => setMobileFiltersOpen(true)} className="shrink-0 gap-1.5 lg:hidden"><SlidersHorizontal size={15} />筛选</Button>
                </div>

                <div className="hidden flex-1 gap-3 lg:flex">{renderFilters()}</div>
            </div>

            {mobileFiltersOpen ? (
                <div className="fixed inset-0 z-[160] flex items-end bg-black/45 backdrop-blur-sm lg:hidden">
                    <div className="max-h-[82dvh] w-full overflow-hidden rounded-t-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-lg)]">
                        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
                            <div><div className="text-base font-bold text-[var(--text)]">筛选题目</div><div className="mt-0.5 text-xs text-[var(--text-soft)]">{questionType} Question Bank</div></div>
                            <button type="button" onClick={() => setMobileFiltersOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-soft)] transition hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"><X size={18} /></button>
                        </div>
                        <div className="grid gap-3 overflow-y-auto p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">{renderFilters()}</div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
