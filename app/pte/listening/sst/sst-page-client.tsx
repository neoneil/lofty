"use client";

import { useMemo, useState } from "react";
import PTETopNav from "@/components/site/pte-top-nav";
import QuestionInfoCard from "@/components/site/QuestionInfoCard";
import QuestionToolbar from "@/components/site/question-toolbar";
import SstList from "./sst-list";

type Question = {
    id: string;
    question_text: string;
    question_type: string;
    source_platform: string | null;
    source_question_id: string | null;
    difficulty_level: string | null;
    tags: string[] | null;
    is_prediction: boolean | null;
    audio_url: string | null;
    audio_duration_seconds: number | null;
    ai_voice: string | null;
    usage_count: number | null;
    created_at: string;
    updated_at: string;
    is_real_exam: boolean | null;

    is_practiced: boolean;
    attempt_count: number;
    correct_count: number;
    wrong_count: number;
    completed_count: number;
    last_attempt_at: string | null;
    latest_score: number | null;
    best_score: number | null;
    is_wrong_question: boolean;
};

type Props = {
    questions: Question[];
    questionInfo: any;
};

function getWordCount(text: string) {
    return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function SstPageClient({
    questions,
    questionInfo,
}: Props) {

    const [searchTerm, setSearchTerm] =
        useState("");

    const [questionStatus, setQuestionStatus] =
        useState("is_prediction"); // 默认就是活跃题型 不是 all

    const [practiceStatus, setPracticeStatus] =
        useState("all");

    const [activityStatus, setActivityStatus] =
        useState("all");

    const filteredQuestions = useMemo(() => {
        let result = [...questions];

        // SEARCH
        if (searchTerm.trim()) {
            const keyword = searchTerm
                .trim()
                .toLowerCase();

            result = result.filter((q) =>
                q.question_text
                    .toLowerCase()
                    .includes(keyword)
            );
        }

        // QUESTION STATUS
        if (questionStatus === "is_prediction") {
            result = result.filter(
                (q) => q.is_prediction
            );
        }

        if (questionStatus === "new") {
            result = result.filter((q) => {
                const created =
                    new Date(q.created_at).getTime();

                const now = Date.now();

                const days =
                    (now - created) /
                    (1000 * 60 * 60 * 24);

                return days <= 14;
            });
        }

        if (questionStatus === "re_is_prediction") {
            result = result.filter(
                (q) =>
                    q.is_prediction &&
                    (q.usage_count ?? 0) > 30
            );
        }

        // PRACTICE STATUS
        if (practiceStatus === "practiced") {
            result = result.filter(
                (q) => q.is_practiced
            );
        }

        if (practiceStatus === "unpracticed") {
            result = result.filter(
                (q) => !q.is_practiced
            );
        }

        if (practiceStatus === "wrong") {
            result = result.filter(
                (q) => q.is_wrong_question
            );
        }

        if (practiceStatus === "mastered") {
            result = result.filter(
                (q) =>
                    (q.correct_count ?? 0) >= 1
            );
        }

        if (practiceStatus === "weak") {
            result = result.filter(
                (q) =>
                    (q.wrong_count ?? 0) >= (q.correct_count ?? 0) && (q.attempt_count ?? 0) > 0
            );
        }

        // ACTIVITY STATUS
        if (activityStatus === "most_practiced") {
            result.sort(
                (a, b) =>
                    (b.attempt_count ?? 0) -
                    (a.attempt_count ?? 0)
            );
        }

        if (activityStatus === "recently_practiced") {
            result.sort(
                (a, b) =>
                    new Date(
                        b.last_attempt_at ?? 0
                    ).getTime() -
                    new Date(
                        a.last_attempt_at ?? 0
                    ).getTime()
            );
        }

        if (activityStatus === "highest_score") {
            result.sort(
                (a, b) =>
                    (b.best_score ?? 0) -
                    (a.best_score ?? 0)
            );
        }

        // DEFAULT SORT
        if (activityStatus === "all") {
            result.sort(
                (a, b) =>
                    getWordCount(a.question_text) -
                    getWordCount(b.question_text)
            );
        }

        return result;
    }, [
        questions,
        searchTerm,
        questionStatus,
        practiceStatus,
        activityStatus,
    ]);

    return (
        <section
            className="
                mx-auto
                w-full
                max-w-[1320px]
                space-y-5 ">
            <PTETopNav
                currentMain="listening"
                currentSub="sst"
            />

            <QuestionInfoCard
                questionInfo={questionInfo}
            />

            <QuestionToolbar
                questionType="SST"

                searchTerm={searchTerm}
                onSearchTermChange={
                    setSearchTerm
                }

                questionStatus={questionStatus}
                onQuestionStatusChange={
                    setQuestionStatus
                }

                practiceStatus={practiceStatus}
                onPracticeStatusChange={
                    setPracticeStatus
                }

                activityStatus={activityStatus}
                onActivityStatusChange={
                    setActivityStatus
                }
            />

            <SstList
                initialQuestions={filteredQuestions}
            />
        </section>
    );
}