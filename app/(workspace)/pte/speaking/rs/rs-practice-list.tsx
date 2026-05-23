"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import RecordingPanel from "@/components/site/RecordingPanel";
type Question = {
    id: string;
    question_text: string;
    question_type: string;
    source_question_id: string | null;
    difficulty_level: string | null;
    is_prediction: boolean | null;
    audio_url: string | null;
    audio_duration_seconds: number | null;
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
type UserRecording = {
    id: string;
    question_source: string;
    question_id: string;
    audio_url: string;
    duration_seconds: number | null;
    created_at: string | null;
};

const PAGE_SIZE = 10;

function getWordCount(text?: string | null) {
    if (!text) return 0;
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
            className={`inline-flex items-center round px-2.5 py-1 text-xs font-medium ${styles[tone]}`}
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
            <span className="inline-flex h-11 min-w-11 items-center justify-center rounded border border-gray-200 bg-gray-100 px-4 text-sm font-medium text-gray-400">
                {children}
            </span>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex h-11 min-w-11 items-center justify-center rounded border px-4 text-sm font-semibold transition ${active
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
        <div className="round border border-gray-200 bg-white p-4 shadow-sm">
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
                            className={`rounded px-3 py-1.5 text-xs font-semibold transition ${playbackRate === rate
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
                    className="inline-flex h-11 items-center justify-center rounded bg-[var(--theme)] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
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
                    className="h-2 w-full cursor-pointer appearance-none rounded bg-gray-200 accent-[var(--theme)]"
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
    const [recordingsMap, setRecordingsMap] = useState<Record<string, UserRecording[]>>({});
    const [recordingsLoadingId, setRecordingsLoadingId] = useState<string | null>(null);
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
    const loadRecordings = async (questionId: string) => {
        if (recordingsMap[questionId]) return;

        setRecordingsLoadingId(questionId);

        try {
            const res = await fetch(`/api/pte/ra/recordings?questionId=${questionId}`);
            const json = await res.json();

            if (!res.ok || !json.ok) {
                throw new Error(json.message || "加载历史录音失败");
            }

            setRecordingsMap((prev) => ({
                ...prev,
                [questionId]: json.recordings ?? [],
            }));
        } catch (error) {
            console.error(error);
        } finally {
            setRecordingsLoadingId(null);
        }
    };
    const handleStart = async (questionId: string) => {
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

        await loadRecordings(questionId);

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
        <section className="overflow-hidden round border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 sm:px-6">
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setPracticeMode("study")}
                        className={` cursor-pointer rounded px-4 py-2.5 text-sm transition ${practiceMode === "study"
                            ? "bg-[var(--theme)] font-semibold text-white shadow-sm"
                            : "border border-gray-200 bg-white font-medium text-gray-600 hover:border-[var(--theme)]/30 hover:text-[var(--theme)]"
                            }`}
                    >
                        学习模式
                    </button>

                    <button
                        type="button"
                        onClick={() => setPracticeMode("test")}
                        className={`cursor-pointer rounded px-4 py-2.5 text-sm transition ${practiceMode === "test"
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
                        <article
                            key={item.id}
                            className="question-card border-b border-gray-100 px-5 py-5 last:border-b-0 sm:px-6"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <div className="mb-3 flex flex-wrap items-center gap-2">
                                        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded bg-[var(--theme)] text-xs font-bold text-white px-2">
                                            {(safeCurrentPage - 1) * PAGE_SIZE + index + 1}
                                        </span>
                                        <Tag tone="theme">RA</Tag>

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

                                    <div
                                        className={`overflow-hidden transition-all duration-400 ease-in-out ${open ? "max-h-[1200px] opacity-100 mt-5" : "max-h-0 opacity-0"
                                            }`}
                                    >
                                        <div className="rounded border border-gray-200 bg-[#faf8f4] p-4">
                                            <div className="mb-4 flex flex-wrap items-center gap-3">
                                                {item.audio_url ? (
                                                    <AudioPlayer
                                                        //src={getPublicAudioUrl(item.audio_url)}
                                                        src={item.audio_url}
                                                        title={item.question_text}
                                                        practiceMode={practiceMode}
                                                    />
                                                ) : (
                                                    <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                                                        当前题目音频暂未生成。
                                                    </div>

                                                )}
                                            </div>

                                            <RecordingPanel
                                                questionId={item.id}
                                                type="RA"
                                                maxDuration={40}
                                                uploadUrl="/api/pte/ra/upload"
                                                onUploadSuccess={(newRecording) => {
                                                    setRecordingsMap((prev) => ({
                                                        ...prev,
                                                        [item.id]: [newRecording, ...(prev[item.id] || [])],
                                                    }));
                                                }}
                                            />







                                            {/* ===== 历史录音（加在这里）===== */}
                                            <div className="mt-5 rounded border border-gray-200 bg-white p-4">
                                                <div className="mb-3 flex items-center justify-between">
                                                    <h3 className="text-sm font-semibold text-gray-900">我的历史录音</h3>
                                                    <span className="text-xs text-gray-500">
                                                        {(recordingsMap[item.id] ?? []).length} 条
                                                    </span>
                                                </div>

                                                {recordingsLoadingId === item.id ? (
                                                    <p className="text-sm text-gray-500">正在加载历史录音...</p>
                                                ) : (recordingsMap[item.id] ?? []).length === 0 ? (
                                                    <p className="text-sm text-gray-500">暂无历史录音</p>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {(recordingsMap[item.id] ?? []).map((recording, i) => (
                                                            <div
                                                                key={recording.id}
                                                                className="rounded border border-gray-100 bg-gray-50 p-3"
                                                            >
                                                                <div className="mb-2 text-xs text-gray-500">
                                                                    Attempt {i + 1} ·{" "}
                                                                    {recording.created_at
                                                                        ? new Date(recording.created_at).toLocaleString()
                                                                        : ""}
                                                                </div>

                                                                <audio controls src={recording.audio_url} className="w-full" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>










                                            <div className="mt-4 flex gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSubmit(item)}
                                                    disabled={loadingId === item.id}
                                                    className="cursor-pointer inline-flex items-center justify-center rounded bg-[var(--theme)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-60"
                                                >
                                                    {loadingId === item.id ? "提交中..." : "上传音频"}
                                                </button>
                                            </div>

                                            {/* {result ? (
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

                                                    <div className="rounded border border-gray-200 bg-white p-4 text-[15px] leading-8">
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
                                            ) : null} */}
                                        </div>
                                    </div>
                                </div>

                                <div className="shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => handleStart(item.id)}
                                        className="cursor-pointer rounded border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-[var(--theme)]/30 hover:text-[var(--theme)]"
                                    >
                                        {open ? "收起练习" : "开始练习"}
                                    </button>
                                </div>
                            </div>
                        </article>
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

// "use client";

// import { useState, useRef } from "react";

// type Question = {
//     id: string;
//     question_type: string;
//     difficulty_level: string;
//     is_prediction: string;
//     question_body_text: string;
// };

// const PAGE_SIZE = 10;
// const MAX_TIME = 40;
// function Tag({
//     children,
//     tone = "neutral",
// }: {
//     children: React.ReactNode;
//     tone?:
//     | "theme"
//     | "green"
//     | "purple"
//     | "yellow"
//     | "pink"
//     | "blue"
//     | "warm"
//     | "neutral";
// }) {
//     const styles = {
//         theme: "bg-[var(--theme)]/10 text-[var(--theme)]",
//         green: "bg-emerald-50 text-emerald-700",
//         purple: "bg-violet-50 text-violet-700",
//         yellow: "bg-amber-50 text-amber-700",
//         pink: "bg-red-50 text-red-700",
//         blue: "bg-sky-50 text-sky-700",
//         warm: "bg-orange-50 text-orange-700",
//         neutral: "bg-gray-100 text-gray-600",
//     };

//     return (
//         <span
//             className={`inline-flex items-center round px-2.5 py-1 text-xs font-medium ${styles[tone]}`}
//         >
//             {children}
//         </span>
//     );
// }
// export default function RaPracticeList({ initialQuestions }: { initialQuestions: Question[] }) {

//     const [currentPage, setCurrentPage] = useState(1);
//     const [recordingIndex, setRecordingIndex] = useState<number | null>(null);
//     const [timeLeft, setTimeLeft] = useState(MAX_TIME);
//     const [confirmUpload, setConfirmUpload] = useState(false);
//     const [isUploading, setIsUploading] = useState(false);

//     const [recordings, setRecordings] = useState<Record<number, string[]>>({});
//     const [playing, setPlaying] = useState<string | null>(null);
//     const [audioProgress, setAudioProgress] = useState<Record<string, number>>({});

//     const [hoverTime, setHoverTime] = useState<number | null>(null);
//     const [hoverPercent, setHoverPercent] = useState<number | null>(null);

//     // 🔥 新增 waveform 数据
//     const [waveforms, setWaveforms] = useState<Record<string, number[]>>({});

//     const mediaRecorderRef = useRef<MediaRecorder | null>(null);
//     const chunksRef = useRef<Blob[]>([]);
//     const tempBlobRef = useRef<Blob | null>(null);
//     const timerRef = useRef<NodeJS.Timeout | null>(null);

//     const audioMapRef = useRef<Record<string, HTMLAudioElement>>({});
//     const isDraggingRef = useRef(false);

//     // ===== pagination =====
//     const totalPages = Math.ceil(initialQuestions.length / PAGE_SIZE);

//     const paginated = initialQuestions.slice(
//         (currentPage - 1) * PAGE_SIZE,
//         currentPage * PAGE_SIZE
//     );

//     // ===== 录音 =====
//     const startRecording = async (index: number) => {
//         const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

//         const recorder = new MediaRecorder(stream);
//         mediaRecorderRef.current = recorder;

//         chunksRef.current = [];

//         recorder.ondataavailable = (e) => {
//             chunksRef.current.push(e.data);
//         };

//         recorder.onstop = () => {
//             tempBlobRef.current = new Blob(chunksRef.current, { type: "audio/webm" });
//             setConfirmUpload(true);
//         };

//         recorder.start();
//         setRecordingIndex(index);
//         setTimeLeft(MAX_TIME);

//         timerRef.current = setInterval(() => {
//             setTimeLeft((prev) => {
//                 if (prev <= 1) {
//                     stopRecording();
//                     return 0;
//                 }
//                 return prev - 1;
//             });
//         }, 1000);
//     };

//     const stopRecording = () => {
//         mediaRecorderRef.current?.stop();
//         setRecordingIndex(null);
//         if (timerRef.current) clearInterval(timerRef.current);
//     };

//     // ===== 上传 =====
//     const uploadRecording = async (index: number) => {
//         if (!tempBlobRef.current) return;

//         setIsUploading(true);

//         const formData = new FormData();
//         formData.append("file", tempBlobRef.current);
//         formData.append("questionId", initialQuestions[index].id);

//         const res = await fetch("/api/pte/ra/upload", {
//             method: "POST",
//             body: formData,
//         });

//         const data = await res.json();

//         setRecordings((prev) => ({
//             ...prev,
//             [index]: [...(prev[index] || []), data.audioUrl],
//         }));

//         setIsUploading(false);
//         setConfirmUpload(false);
//         tempBlobRef.current = null;
//     };

//     const cancelRecording = () => {
//         tempBlobRef.current = null;
//         setConfirmUpload(false);
//     };

//     // ===== waveform生成 =====
//     const generateWaveform = async (url: string) => {
//         if (waveforms[url]) return;

//         const res = await fetch(url);
//         const arrayBuffer = await res.arrayBuffer();

//         const audioContext = new AudioContext();
//         const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

//         const rawData = audioBuffer.getChannelData(0);
//         const samples = 80;
//         const blockSize = Math.floor(rawData.length / samples);

//         const waveform: number[] = [];

//         for (let i = 0; i < samples; i++) {
//             let sum = 0;
//             for (let j = 0; j < blockSize; j++) {
//                 sum += Math.abs(rawData[i * blockSize + j]);
//             }
//             waveform.push(sum / blockSize);
//         }

//         setWaveforms((prev) => ({
//             ...prev,
//             [url]: waveform,
//         }));
//     };

//     // ===== 播放 =====
//     const getAudio = (url: string) => {
//         if (!audioMapRef.current[url]) {
//             const audio = new Audio(url);

//             audio.ontimeupdate = () => {
//                 if (!isDraggingRef.current) {
//                     setAudioProgress((prev) => ({
//                         ...prev,
//                         [url]: audio.currentTime / audio.duration,
//                     }));
//                 }
//             };

//             audio.onended = () => setPlaying(null);

//             audioMapRef.current[url] = audio;
//         }

//         return audioMapRef.current[url];
//     };

//     const togglePlay = async (url: string) => {
//         await generateWaveform(url); // 🔥 关键

//         const audio = getAudio(url);

//         if (playing === url) {
//             audio.pause();
//             setPlaying(null);
//         } else {
//             Object.values(audioMapRef.current).forEach((a) => a.pause());
//             audio.play();
//             setPlaying(url);
//         }
//     };

//     const seek = (url: string, percent: number) => {
//         const audio = getAudio(url);
//         if (audio.duration) {
//             audio.currentTime = percent * audio.duration;
//         }
//     };

//     const formatTime = (t: number) => {
//         const m = Math.floor(t / 60);
//         const s = Math.floor(t % 60);
//         return `${m}:${String(s).padStart(2, "0")}`;
//     };

//     return (
//         <div className="space-y-6 ">

//             {paginated.map((q, index) => {
//                 const globalIndex = (currentPage - 1) * PAGE_SIZE + index;

//                 return (
//                     <div key={q.id} className="bg-[var(--card)] border p-6 rounded">
//                         <div className="">

//                             {/* 上面一行 */}
//                             <div className="flex items-center gap-4 mb-3">
//                                 <span className="inline-flex h-7 min-w-7 items-center justify-center rounded bg-[var(--theme)] text-xs font-bold text-white px-2">
//                                     {globalIndex + 1}
//                                 </span>

//                                 <Tag tone="theme">RA</Tag>

//                                 {q.is_prediction ? <Tag tone="purple">Prediction</Tag> : null}
//                             </div>

//                             {/* 下面一行 */}
//                             <p className="text-[18px] mb-4">
//                                 {q.question_body_text}
//                             </p>

//                         </div>
//                         {/* 录音 */}
//                         {recordingIndex !== globalIndex ? (
//                             <div className="flex justify-center">
//                                 <button onClick={() => startRecording(globalIndex)} className="btn-card">
//                                     开始录音
//                                 </button>
//                             </div>
//                         ) : (
//                             <div className="flex flex-col items-center gap-3">

//                                 {/* ⏱ 原有时间（不动） */}
//                                 <div className="text-xl text-[var(--brand-accent)]">
//                                     {timeLeft}s
//                                 </div>

//                                 {/* ✅ 新增：进度条（唯一新增） */}
//                                 <div className="w-full max-w-md h-2 bg-(--bg) rounded">
//                                     <div
//                                         className="h-2 bg-(--brand-accent) rounded"
//                                         style={{
//                                             width: `${((40 - timeLeft) / 40) * 100}%`,
//                                         }}
//                                     />
//                                 </div>

//                                 {/* 🔘 原按钮（不动） */}
//                                 <button onClick={stopRecording} className="btn-primary">
//                                     结束
//                                 </button>
//                             </div>
//                         )}

//                         {/* 上传 */}
//                         {confirmUpload && (
//                             <div className="flex justify-center gap-4 mt-4">
//                                 <button
//                                     onClick={() => uploadRecording(globalIndex)}
//                                     className="btn-primary"
//                                     disabled={isUploading}
//                                 >
//                                     {isUploading ? "上传中..." : "上传"}
//                                 </button>
//                                 <button
//                                     onClick={cancelRecording}
//                                     className="btn-secondary"
//                                     disabled={isUploading}
//                                 >
//                                     取消
//                                 </button>
//                             </div>
//                         )}

//                         {/* ===== waveform播放器 ===== */}
//                         {(recordings[globalIndex] || []).map((url, i) => (
//                             <div key={i} className="w-1/2 mx-auto mt-5 border rounded p-3 bg-[var(--bg)]">

//                                 <div className="flex justify-between mb-2">
//                                     <span>Attempt {i + 1}</span>
//                                     <button onClick={() => togglePlay(url)} className="btn-secondary">
//                                         {playing === url ? "暂停" : "播放"}
//                                     </button>
//                                 </div>

//                                 <div
//                                     className="relative h-14 flex items-end gap-[2px] cursor-pointer"
//                                     onMouseMove={(e) => {
//                                         const rect = e.currentTarget.getBoundingClientRect();
//                                         const percent = (e.clientX - rect.left) / rect.width;

//                                         const audio = getAudio(url);
//                                         if (audio.duration) {
//                                             setHoverTime(percent * audio.duration);
//                                             setHoverPercent(percent);
//                                         }
//                                     }}
//                                     onMouseLeave={() => {
//                                         setHoverTime(null);
//                                         setHoverPercent(null);
//                                     }}
//                                     onClick={(e) => {
//                                         const rect = e.currentTarget.getBoundingClientRect();
//                                         const percent = (e.clientX - rect.left) / rect.width;
//                                         seek(url, percent);
//                                     }}
//                                 >
//                                     {/* waveform */}
//                                     {waveforms[url]?.map((v, i) => {
//                                         const progress = audioProgress[url] || 0;
//                                         const isPlayed = i / waveforms[url].length < progress;

//                                         return (
//                                             <div
//                                                 key={i}
//                                                 className="w-[3px] rounded"
//                                                 style={{
//                                                     height: `${v * 60 + 4}px`,
//                                                     background: isPlayed
//                                                         ? "var(--brand-accent)"
//                                                         : "#D1D5DB",
//                                                 }}
//                                             />
//                                         );
//                                     })}

//                                     {/* hover 时间 */}
//                                     {hoverTime !== null && hoverPercent !== null && (
//                                         <div
//                                             className="absolute -top-7 px-2 py-0.5 text-xs rounded bg-black text-white"
//                                             style={{
//                                                 left: `${hoverPercent * 100}%`,
//                                                 transform: "translateX(-50%)",
//                                             }}
//                                         >
//                                             {formatTime(hoverTime)}
//                                         </div>
//                                     )}
//                                 </div>

//                             </div>
//                         ))}

//                     </div>
//                 );
//             })}

//             {/* pagination */}
//             <div className="flex justify-center gap-2">
//                 {Array.from({ length: totalPages }).map((_, i) => (
//                     <button
//                         key={i}
//                         onClick={() => setCurrentPage(i + 1)}
//                         className={`px-3 py-1 rounded cursor-pointer ${currentPage === i + 1
//                             ? "bg-[var(--brand-accent)] text-white"
//                             : "border"
//                             }`}
//                     >
//                         {i + 1}
//                     </button>
//                 ))}
//             </div>

//         </div>
//     );
// }





// "use client";

// import { useEffect, useMemo, useRef, useState } from "react";

// type Question = {
//   id: string;
//   question_text: string;
//   is_prediction: boolean | null;
//   is_real_exam: boolean | null;
//   audio_url: string | null;
//   audio_duration_seconds: number | null;
//   tags: string[] | null;
//   attempt_count: number;
//   correct_count: number;
//   wrong_count: number;
//   last_attempt_at: string | null;
//   best_score: number | null;
//   latest_score: number | null;
//   is_wrong_question: boolean;
// };

// const PAGE_SIZE = 10;
// const MAX_TIME = 40;

// function getWordCount(text?: string | null) {
//   return text?.trim().split(/\s+/).filter(Boolean).length || 0;
// }

// function formatDateTime(value: string | null) {
//   if (!value) return "未练习";
//   return new Date(value).toLocaleString("zh-CN");
// }

// function formatAudioTime(time: number) {
//   if (!Number.isFinite(time)) return "00:00";
//   const m = Math.floor(time / 60);
//   const s = Math.floor(time % 60);
//   return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
// }

// function getPublicAudioUrl(path: string) {
//   return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/pte-audio/${path}`;
// }

// export default function RaPracticeList({ initialQuestions }: { initialQuestions: Question[] }) {
//   const [questions] = useState(initialQuestions);
//   const [openId, setOpenId] = useState<string | null>(null);
//   const [currentPage, setCurrentPage] = useState(1);

//   const [recordingId, setRecordingId] = useState<string | null>(null);
//   const [timeLeft, setTimeLeft] = useState(MAX_TIME);
//   const [confirmUpload, setConfirmUpload] = useState<string | null>(null);
//   const [isUploading, setIsUploading] = useState(false);

//   const [recordings, setRecordings] = useState<Record<string, string[]>>({});
//   const [playing, setPlaying] = useState<string | null>(null);
//   const [audioProgress, setAudioProgress] = useState<Record<string, number>>({});
//   const [waveforms, setWaveforms] = useState<Record<string, number[]>>({});

//   const mediaRecorderRef = useRef<MediaRecorder | null>(null);
//   const chunksRef = useRef<Blob[]>([]);
//   const tempBlobRef = useRef<Blob | null>(null);
//   const timerRef = useRef<NodeJS.Timeout | null>(null);
//   const audioMapRef = useRef<Record<string, HTMLAudioElement>>({});
//   const isDraggingRef = useRef(false);

//   // ===== 排序 + 分页（完全保留你原WFD逻辑） =====
//   const sortedQuestions = useMemo(() => {
//     return [...questions].sort(
//       (a, b) => getWordCount(a.question_text) - getWordCount(b.question_text)
//     );
//   }, [questions]);

//   const totalPages = Math.max(1, Math.ceil(sortedQuestions.length / PAGE_SIZE));

//   const paginatedQuestions = useMemo(() => {
//     const start = (currentPage - 1) * PAGE_SIZE;
//     return sortedQuestions.slice(start, start + PAGE_SIZE);
//   }, [sortedQuestions, currentPage]);

//   // ===== 录音 =====
//   const startRecording = async (id: string) => {
//     const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

//     const recorder = new MediaRecorder(stream);
//     mediaRecorderRef.current = recorder;

//     chunksRef.current = [];

//     recorder.ondataavailable = (e) => {
//       chunksRef.current.push(e.data);
//     };

//     recorder.onstop = () => {
//       tempBlobRef.current = new Blob(chunksRef.current, { type: "audio/webm" });
//       setConfirmUpload(id);
//     };

//     recorder.start();
//     setRecordingId(id);
//     setTimeLeft(MAX_TIME);

//     timerRef.current = setInterval(() => {
//       setTimeLeft((prev) => {
//         if (prev <= 1) {
//           stopRecording();
//           return 0;
//         }
//         return prev - 1;
//       });
//     }, 1000);
//   };

//   const stopRecording = () => {
//     mediaRecorderRef.current?.stop();
//     setRecordingId(null);
//     if (timerRef.current) clearInterval(timerRef.current);
//   };

//   // ===== 上传 =====
//   const uploadRecording = async (id: string) => {
//     if (!tempBlobRef.current) return;

//     setIsUploading(true);

//     const formData = new FormData();
//     formData.append("file", tempBlobRef.current);
//     formData.append("questionId", id);

//     const res = await fetch("/api/pte/ra/upload", {
//       method: "POST",
//       body: formData,
//     });

//     const data = await res.json();

//     setRecordings((prev) => ({
//       ...prev,
//       [id]: [...(prev[id] || []), data.audioUrl],
//     }));

//     setIsUploading(false);
//     setConfirmUpload(null);
//     tempBlobRef.current = null;
//   };

//   const cancelRecording = () => {
//     tempBlobRef.current = null;
//     setConfirmUpload(null);
//   };

//   // ===== waveform =====
//   const generateWaveform = async (url: string) => {
//     if (waveforms[url]) return;

//     const res = await fetch(url);
//     const buffer = await res.arrayBuffer();

//     const ctx = new AudioContext();
//     const audioBuffer = await ctx.decodeAudioData(buffer);

//     const raw = audioBuffer.getChannelData(0);
//     const samples = 80;
//     const block = Math.floor(raw.length / samples);

//     const waveform: number[] = [];

//     for (let i = 0; i < samples; i++) {
//       let sum = 0;
//       for (let j = 0; j < block; j++) {
//         sum += Math.abs(raw[i * block + j]);
//       }
//       waveform.push(sum / block);
//     }

//     setWaveforms((prev) => ({ ...prev, [url]: waveform }));
//   };

//   const getAudio = (url: string) => {
//     if (!audioMapRef.current[url]) {
//       const audio = new Audio(url);

//       audio.ontimeupdate = () => {
//         if (!isDraggingRef.current) {
//           setAudioProgress((prev) => ({
//             ...prev,
//             [url]: audio.currentTime / audio.duration,
//           }));
//         }
//       };

//       audio.onended = () => setPlaying(null);

//       audioMapRef.current[url] = audio;
//     }

//     return audioMapRef.current[url];
//   };

//   const togglePlay = async (url: string) => {
//     await generateWaveform(url);

//     const audio = getAudio(url);

//     if (playing === url) {
//       audio.pause();
//       setPlaying(null);
//     } else {
//       Object.values(audioMapRef.current).forEach((a) => a.pause());
//       audio.play();
//       setPlaying(url);
//     }
//   };

//   const seek = (url: string, percent: number) => {
//     const audio = getAudio(url);
//     if (audio.duration) {
//       audio.currentTime = percent * audio.duration;
//     }
//   };

//   const formatTime = (t: number) => {
//     const m = Math.floor(t / 60);
//     const s = Math.floor(t % 60);
//     return `${m}:${String(s).padStart(2, "0")}`;
//   };

//   return (
//     <section className="overflow-hidden round border border-gray-200 bg-white shadow-sm">
//       {/* ===== 列表 ===== */}
//       <div>
//         {paginatedQuestions.map((item, index) => {
//           const open = openId === item.id;

//           return (
//             <article key={item.id} className="border-b px-5 py-5">
//               <div className="flex justify-between">
//                 <div className="flex-1">
//                   <p className="text-[18px] mb-4">{item.question_text}</p>

//                   {open && (
//                     <div className="space-y-4">
//                       {/* 原音频 */}
//                       {item.audio_url && (
//                         <audio controls src={getPublicAudioUrl(item.audio_url)} />
//                       )}

//                       {/* 录音 */}
//                       {recordingId !== item.id ? (
//                         <button onClick={() => startRecording(item.id)} className="btn-card">
//                           开始录音
//                         </button>
//                       ) : (
//                         <div className="flex flex-col items-center gap-3">
//                           <div>{timeLeft}s</div>
//                           <button onClick={stopRecording} className="btn-primary">
//                             结束
//                           </button>
//                         </div>
//                       )}

//                       {/* 上传 */}
//                       {confirmUpload === item.id && (
//                         <div className="flex gap-3">
//                           <button onClick={() => uploadRecording(item.id)} className="btn-primary">
//                             {isUploading ? "上传中..." : "上传"}
//                           </button>
//                           <button onClick={cancelRecording} className="btn-secondary">
//                             取消
//                           </button>
//                         </div>
//                       )}

//                       {/* 用户录音播放器 */}
//                       {(recordings[item.id] || []).map((url, i) => (
//                         <div key={i} className="border p-3 rounded">
//                           <button onClick={() => togglePlay(url)}>
//                             {playing === url ? "暂停" : "播放"}
//                           </button>

//                           <div
//                             className="flex gap-[2px] mt-2 cursor-pointer"
//                             onClick={(e) => {
//                               const rect = e.currentTarget.getBoundingClientRect();
//                               const percent = (e.clientX - rect.left) / rect.width;
//                               seek(url, percent);
//                             }}
//                           >
//                             {waveforms[url]?.map((v, idx) => {
//                               const progress = audioProgress[url] || 0;
//                               const played = idx / waveforms[url].length < progress;

//                               return (
//                                 <div
//                                   key={idx}
//                                   style={{
//                                     height: `${v * 60 + 4}px`,
//                                     width: "3px",
//                                     background: played ? "#4f46e5" : "#d1d5db",
//                                   }}
//                                 />
//                               );
//                             })}
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>

//                 <button onClick={() => setOpenId(open ? null : item.id)}>
//                   {open ? "收起" : "开始练习"}
//                 </button>
//               </div>
//             </article>
//           );
//         })}
//       </div>

//       {/* ===== 分页（已恢复） ===== */}
//       {totalPages > 1 && (
//         <div className="flex justify-center gap-2 py-4">
//           {Array.from({ length: totalPages }).map((_, i) => (
//             <button
//               key={i}
//               onClick={() => setCurrentPage(i + 1)}
//               className={`px-3 py-1 rounded ${currentPage === i + 1 ? "bg-black text-white" : "border"}`}
//             >
//               {i + 1}
//             </button>
//           ))}
//         </div>
//       )}
//     </section>
//   );
// }