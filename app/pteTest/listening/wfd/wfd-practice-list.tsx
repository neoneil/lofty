"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
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
    last_attempt_at: string | null;
    latest_score: number | null;
    best_score: number | null;
    is_wrong_question: boolean;
};

type SubmitResult = {
    ok: boolean;
    attemptId: string;
    isCorrect: boolean;
    score: number;
    totalWords: number;
    scoreDisplay: string;
    correctAnswer: string;
    tokens: {
        type: "correct" | "missing" | "extra";
        text: string;
    }[];
};

const PAGE_SIZE = 10;

function getWordCount(text: string) {
    return text.trim().split(/\s+/).filter(Boolean).length;
}

function formatDateTime(value: string | null) {
    if (!value) return "未练习";

    return new Date(value).toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatAudioTime(time: number) {
    if (!Number.isFinite(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getPaginationNumbers(currentPage: number, totalPages: number) {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 3) {
        return [1, 2, 3, 4, -1, totalPages];
    }

    if (currentPage >= totalPages - 2) {
        return [1, -1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, -1, currentPage - 1, currentPage, currentPage + 1, -1, totalPages];
}

function getPublicAudioUrl(path: string) {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/pte-audio/${path}`;
}

function Tag({
    children,
    tone = "neutral",
}: {
    children: React.ReactNode;
    tone?:
    | "theme"
    | "green"
    | "purple"
    | "yellow"
    | "pink"
    | "blue"
    | "warm"
    | "neutral";
}) {
    const styles = {
        theme: "bg-[var(--theme)]/10 text-[var(--theme)]",
        green: "bg-emerald-50 text-emerald-700",
        purple: "bg-violet-50 text-violet-700",
        yellow: "bg-amber-50 text-amber-700",
        pink: "bg-red-50 text-red-700",
        blue: "bg-sky-50 text-sky-700",
        warm: "bg-orange-50 text-orange-700",
        neutral: "bg-gray-100 text-gray-600",
    };

    return (
        <span
            className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium ${styles[tone]}`}
        >
            {children}
        </span>
    );
}

function PaginationButton({
    active = false,
    disabled = false,
    onClick,
    children,
}: {
    active?: boolean;
    disabled?: boolean;
    onClick?: () => void;
    children: React.ReactNode;
}) {
    if (disabled) {
        return (
            <span className="inline-flex h-11 min-w-11 items-center justify-center rounded-xl border border-gray-200 bg-gray-100 px-4 text-sm font-medium text-gray-400">
                {children}
            </span>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex h-11 min-w-11 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition ${active
                ? "border-[var(--theme)] bg-[var(--theme)] text-white"
                : "border-gray-200 bg-white text-gray-600 hover:border-[var(--theme)]/30 hover:text-[var(--theme)]"
                }`}
        >
            {children}
        </button>
    );
}

function AudioPlayer({
    src,
    title,
    practiceMode,
}: {
    src: string;
    title: string;
    practiceMode: "study" | "test";
}) {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleLoadedMetadata = () => setDuration(audio.duration || 0);
        const handleTimeUpdate = () => setCurrentTime(audio.currentTime || 0);
        const handleEnded = () => setIsPlaying(false);
        const handlePause = () => setIsPlaying(false);
        const handlePlay = () => setIsPlaying(true);

        audio.addEventListener("loadedmetadata", handleLoadedMetadata);
        audio.addEventListener("timeupdate", handleTimeUpdate);
        audio.addEventListener("ended", handleEnded);
        audio.addEventListener("pause", handlePause);
        audio.addEventListener("play", handlePlay);

        return () => {
            audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
            audio.removeEventListener("timeupdate", handleTimeUpdate);
            audio.removeEventListener("ended", handleEnded);
            audio.removeEventListener("pause", handlePause);
            audio.removeEventListener("play", handlePlay);
        };
    }, []);

    const togglePlay = async () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (audio.paused) {
            await audio.play();
        } else {
            audio.pause();
        }
    };

    const handleSeek = (value: number) => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.currentTime = value;
        setCurrentTime(value);
    };

    const changeRate = (rate: number) => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.playbackRate = rate;
        setPlaybackRate(rate);
    };

    return (
        <div className="rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm">
            <audio ref={audioRef} preload="metadata">
                <source src={src} type="audio/mpeg" />
            </audio>

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                    <div
                        className={`text-sm font-semibold transition ${practiceMode === "test"
                            ? "select-none text-gray-400 blur-[5px]"
                            : "text-gray-900"
                            }`}
                    >
                        {title}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                        音频播放器 · 支持播放、暂停、拖动、倍速
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {[0.75, 1, 1.25, 1.5].map((rate) => (
                        <button
                            key={rate}
                            type="button"
                            onClick={() => changeRate(rate)}
                            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${playbackRate === rate
                                ? "bg-[var(--theme)] text-white"
                                : "border border-gray-200 bg-white text-gray-600 hover:border-[var(--theme)]/30 hover:text-[var(--theme)]"
                                }`}
                        >
                            {rate}x
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <button
                    type="button"
                    onClick={togglePlay}
                    className="inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--theme)] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
                >
                    {isPlaying ? "暂停" : "播放"}
                </button>

                <div className="ml-auto text-sm font-medium text-gray-500">
                    {formatAudioTime(currentTime)} / {formatAudioTime(duration)}
                </div>
            </div>

            <div className="mt-4">
                <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    step={0.1}
                    value={currentTime}
                    onChange={(e) => handleSeek(Number(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-[var(--theme)]"
                    aria-label="音频进度条"
                />
            </div>
        </div>
    );
}

export default function WfdPracticeList({
    initialQuestions,
}: {
    initialQuestions: Question[];
}) {
    const [questions, setQuestions] = useState(initialQuestions);
    const [openId, setOpenId] = useState<string | null>(null);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [startedAtMap, setStartedAtMap] = useState<Record<string, number>>({});
    const [results, setResults] = useState<Record<string, SubmitResult>>({});
    const [practiceMode, setPracticeMode] = useState<"study" | "test">("study");
    const [currentPage, setCurrentPage] = useState(1);

    const sortedQuestions = useMemo(() => {
        return [...questions].sort(
            (a, b) => getWordCount(a.question_text) - getWordCount(b.question_text)
        );
    }, [questions]);

    const totalPages = Math.max(1, Math.ceil(sortedQuestions.length / PAGE_SIZE));
    const safeCurrentPage = Math.min(currentPage, totalPages);

    const paginatedQuestions = useMemo(() => {
        const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
        return sortedQuestions.slice(startIndex, startIndex + PAGE_SIZE);
    }, [safeCurrentPage, sortedQuestions]);

    const paginationNumbers = useMemo(
        () => getPaginationNumbers(safeCurrentPage, totalPages),
        [safeCurrentPage, totalPages]
    );

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const goToPage = (page: number) => {
        setCurrentPage(page);
        setOpenId(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleStart = (questionId: string) => {
        if (openId === questionId) {
            setOpenId(null);
            return;
        }

        const index = sortedQuestions.findIndex((q) => q.id === questionId);
        if (index !== -1) {
            const targetPage = Math.floor(index / PAGE_SIZE) + 1;
            if (targetPage !== safeCurrentPage) {
                setCurrentPage(targetPage);
            }
        }

        setOpenId(questionId);
        setStartedAtMap((prev) => ({
            ...prev,
            [questionId]: prev[questionId] ?? Date.now(),
        }));
    };

    const handleSubmit = async (question: Question) => {
        const answer = (answers[question.id] ?? "").trim();
        if (!answer) {
            alert("请先输入答案");
            return;
        }

        setLoadingId(question.id);

        try {
            const startedAt = startedAtMap[question.id] ?? Date.now();

            const res = await fetch("/api/pte/wfd/submit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    questionId: question.id,
                    userAnswer: answer,
                    startedAt,
                }),
            });

            const json = (await res.json()) as SubmitResult & { message?: string };

            if (!res.ok || !json.ok) {
                throw new Error(json.message || "提交失败");
            }

            setResults((prev) => ({
                ...prev,
                [question.id]: json,
            }));

            setQuestions((prev) =>
                prev.map((item) =>
                    item.id === question.id
                        ? {
                            ...item,
                            is_practiced: true,
                            attempt_count: (item.attempt_count ?? 0) + 1,
                            correct_count: (item.correct_count ?? 0) + (json.isCorrect ? 1 : 0),
                            wrong_count: (item.wrong_count ?? 0) + (json.isCorrect ? 0 : 1),
                            latest_score: json.score,
                            best_score:
                                item.best_score == null
                                    ? json.score
                                    : Math.max(item.best_score, json.score),
                            is_wrong_question: !json.isCorrect,
                            last_attempt_at: new Date().toISOString(),
                        }
                        : item
                )
            );
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : "提交失败，请稍后再试");
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <section className="overflow-hidden rounded-[30px] border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 sm:px-6">
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setPracticeMode("study")}
                        className={` cursor-pointer rounded-2xl px-4 py-2.5 text-sm transition ${practiceMode === "study"
                            ? "bg-[var(--theme)] font-semibold text-white shadow-sm"
                            : "border border-gray-200 bg-white font-medium text-gray-600 hover:border-[var(--theme)]/30 hover:text-[var(--theme)]"
                            }`}
                    >
                        学习模式
                    </button>

                    <button
                        type="button"
                        onClick={() => setPracticeMode("test")}
                        className={`cursor-pointer rounded-2xl px-4 py-2.5 text-sm transition ${practiceMode === "test"
                            ? "bg-[var(--theme)] font-semibold text-white shadow-sm"
                            : "border border-gray-200 bg-white font-medium text-gray-600 hover:border-[var(--theme)]/30 hover:text-[var(--theme)]"
                            }`}
                    >
                        测试模式
                    </button>
                </div>

                <div className="text-sm text-gray-500">
                    {practiceMode === "study"
                        ? "当前可直接看到原句，适合学习记忆"
                        : "当前题目已隐藏，适合听写测试"}
                </div>
            </div>

            <div>
                {paginatedQuestions.map((item, index) => {
                    const result = results[item.id];
                    const open = openId === item.id;

                    return (
                        <Link
                            key={item.id}
                            href={`/pteTest/listening/wfd/${item.id}`}
                            className="block"
                        >
                            <article
                                className="question-card border-b border-gray-100 px-5 py-5 last:border-b-0 sm:px-6"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <div className="mb-3 flex flex-wrap items-center gap-2">
                                            <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-[var(--theme)] text-xs font-bold text-white px-2">
                                                {(safeCurrentPage - 1) * PAGE_SIZE + index + 1}
                                            </span>
                                            <Tag tone="theme">WFD</Tag>

                                            {item.is_prediction ? <Tag tone="purple">Prediction</Tag> : null}
                                            {item.is_real_exam ? <Tag tone="yellow">Real Exam</Tag> : null}

                                            {item.is_practiced ? (
                                                <Tag tone="green">已练</Tag>
                                            ) : (
                                                <Tag tone="neutral">未练</Tag>
                                            )}

                                            {item.is_wrong_question ? <Tag tone="pink">错题</Tag> : null}

                                            {item.source_question_id ? (
                                                <Tag tone="neutral">#{item.source_question_id}</Tag>
                                            ) : null}
                                        </div>

                                        <p
                                            className={`text-[17px] leading-8 sm:text-[19px] transition ${practiceMode === "test"
                                                ? "select-none text-gray-400 blur-[5px]"
                                                : "text-gray-800"
                                                }`}
                                            aria-label={
                                                practiceMode === "test" ? "题目已模糊显示" : item.question_text
                                            }
                                        >
                                            {item.question_text}
                                        </p>

                                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                                            <span>词数：{getWordCount(item.question_text)}</span>

                                            {item.audio_duration_seconds ? (
                                                <span>时长：{item.audio_duration_seconds}s</span>
                                            ) : null}

                                            <span>我的练习：{item.attempt_count ?? 0} 次</span>
                                            <span>答对：{item.correct_count ?? 0}</span>
                                            <span>答错：{item.wrong_count ?? 0}</span>
                                            <span>最近练习：{formatDateTime(item.last_attempt_at)}</span>

                                            {typeof item.best_score === "number" ? (
                                                <span>最佳分：{item.best_score}</span>
                                            ) : null}

                                            {typeof item.latest_score === "number" ? (
                                                <span>最近分：{item.latest_score}</span>
                                            ) : null}
                                        </div>

                                        {item.tags?.length ? (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {item.tags.map((tag) => (
                                                    <Tag key={tag} tone="neutral">
                                                        {tag}
                                                    </Tag>
                                                ))}
                                            </div>
                                        ) : null}

                                        <div
                                            className={`overflow-hidden transition-all duration-400 ease-in-out ${open ? "max-h-[1200px] opacity-100 mt-5" : "max-h-0 opacity-0"
                                                }`}
                                        >
                                            <div className="rounded-2xl border border-gray-200 bg-[#faf8f4] p-4">
                                                <div className="mb-4 flex flex-wrap items-center gap-3">
                                                    {item.audio_url ? (
                                                        <AudioPlayer
                                                            src={getPublicAudioUrl(item.audio_url)}
                                                            title={item.question_text}
                                                            practiceMode={practiceMode}
                                                        />
                                                    ) : (
                                                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                                                            当前题目音频暂未生成。
                                                        </div>
                                                    )}
                                                </div>

                                                <textarea
                                                    value={answers[item.id] ?? ""}
                                                    onChange={(e) =>
                                                        setAnswers((prev) => ({
                                                            ...prev,
                                                            [item.id]: e.target.value,
                                                        }))
                                                    }
                                                    placeholder="请输入你听到的句子"
                                                    className="min-h-[120px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--theme)]"
                                                />

                                                <div className="mt-4 flex gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSubmit(item)}
                                                        disabled={loadingId === item.id}
                                                        className="cursor-pointer inline-flex items-center justify-center rounded-2xl bg-[var(--theme)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-60"
                                                    >
                                                        {loadingId === item.id ? "提交中..." : "确认答案"}
                                                    </button>
                                                </div>

                                                {result ? (
                                                    <div className="mt-5 space-y-3">
                                                        <div className="text-sm text-gray-600">
                                                            <span className="font-semibold text-[var(--theme)]">
                                                                本次得分：
                                                            </span>{" "}
                                                            {result.scoreDisplay}
                                                        </div>

                                                        <div className="text-sm text-gray-600">
                                                            <span className="font-semibold text-[var(--theme)]">
                                                                标准答案：
                                                            </span>{" "}
                                                            {result.correctAnswer}
                                                        </div>

                                                        <div className="rounded-2xl border border-gray-200 bg-white p-4 text-[15px] leading-8">
                                                            {result.tokens.map((token, index) => {
                                                                if (token.type === "correct") {
                                                                    return (
                                                                        <span key={index} className="mr-2 text-gray-800">
                                                                            {token.text}
                                                                        </span>
                                                                    );
                                                                }

                                                                if (token.type === "missing") {
                                                                    return (
                                                                        <span
                                                                            key={index}
                                                                            className="mr-2 font-semibold text-red-600"
                                                                        >
                                                                            {token.text}
                                                                        </span>
                                                                    );
                                                                }

                                                                return (
                                                                    <span
                                                                        key={index}
                                                                        className="mr-2 text-gray-500 line-through"
                                                                    >
                                                                        {token.text}
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>

                                                        <div className="text-xs text-gray-500">
                                                            红色 = 你漏掉的词；删除线 = 你多写的词
                                                        </div>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => handleStart(item.id)}
                                            className="cursor-pointer rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-[var(--theme)]/30 hover:text-[var(--theme)]"
                                        >
                                            {open ? "收起练习" : "开始练习"}
                                        </button>
                                    </div>
                                </div>
                            </article>
                        </Link>
                    );
                })}
            </div>

            {totalPages > 1 ? (
                <div className="flex flex-wrap items-center justify-center gap-3 border-t border-gray-100 px-5 py-5 sm:px-6">
                    <PaginationButton
                        disabled={safeCurrentPage === 1}
                        onClick={() => goToPage(Math.max(1, safeCurrentPage - 1))}
                    >
                        上一页
                    </PaginationButton>

                    {paginationNumbers.map((page, idx) =>
                        page === -1 ? (
                            <span
                                key={`ellipsis-${idx}`}
                                className="inline-flex h-11 min-w-11 items-center justify-center text-sm font-semibold text-gray-400"
                            >
                                ...
                            </span>
                        ) : (
                            <PaginationButton
                                key={page}
                                active={page === safeCurrentPage}
                                onClick={() => goToPage(page)}
                            >
                                {page}
                            </PaginationButton>
                        )
                    )}

                    <PaginationButton
                        disabled={safeCurrentPage === totalPages}
                        onClick={() => goToPage(Math.min(totalPages, safeCurrentPage + 1))}
                    >
                        下一页
                    </PaginationButton>
                </div>
            ) : null}
        </section>
    );
}



