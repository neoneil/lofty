import Link from "next/link";
import AudioPlayer from "@/components/site/AudioPlayer";
import Container from "@/components/site/container";
import PTESidebar from "@/components/site/pte-sidebar";
import { requireUser } from "@/lib/auth/require-user";
import WfdDetailClient from "./wfd-detail-client";

type PageProps = {
    params: Promise<{
        id: string;
    }>;
};
function getPublicAudioUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/pte-audio/${path}`;
}
export default async function WfdQuestionDetailPage({
    params,
}: PageProps) {
    const { id } = await params;

    const { supabase } = await requireUser(`/pteTest/listening/wfd/${id}`);

    // 当前题目
    const { data: question, error } = await supabase
        .schema("views")
        .from("v_pte_wfd_with_user_status")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !question) {
        return (
            <main className="pb-10 pt-6 sm:pb-12 sm:pt-8 lg:pb-16">
                <Container>
                    <section className="rounded-[28px] border border-red-200 bg-red-50 p-5 text-red-600 shadow-sm">
                        WFD 题目加载失败
                    </section>
                </Container>
            </main>
        );
    }

    // 所有题目（用于上一题 / 下一题）
    const { data: allQuestions } = await supabase
        .schema("views")
        .from("v_pte_wfd_with_user_status")
        .select("id")
        .eq("question_type", "WFD")
        .eq("is_prediction", true)
        .order("created_at", { ascending: false });

    const ids = allQuestions?.map((q) => q.id) ?? [];

    const currentIndex = ids.findIndex((qId) => qId === id);

    const prevId =
        currentIndex > 0 ? ids[currentIndex - 1] : null;

    const nextId =
        currentIndex < ids.length - 1
            ? ids[currentIndex + 1]
            : null;

    return (
        <main className="pb-10 pt-6 sm:pb-12 sm:pt-8 lg:pb-16">
            <Container>
                <div className="grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)] 2xl:grid-cols-[260px_minmax(0,1fr)] mt-5">

                    {/* Sidebar */}
                    <div className="xl:sticky xl:top-24 xl:self-start">
                        <PTESidebar
                            currentMain="listening"
                            currentSub="wfd"
                        />
                    </div>

                    {/* Content */}
                    <section className="space-y-6">

                        {/* Header */}
                        <section className="rounded-[30px] border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--theme)]/80">
                                PTE Listening
                            </p>

                            <h1 className="text-2xl font-bold leading-tight tracking-tight text-[var(--theme)] lg:text-3xl">
                                WFD Question Detail
                            </h1>

                            <p className="mt-4 max-w-2xl text-sm leading-8 text-gray-600 sm:text-base">
                                单题练习页面。后续这里会迁移 AudioPlayer、
                                Answer Box、提交结果等完整练习功能。
                            </p>
                        </section>

                        {/* Question */}
                        <section className="rounded-[30px] border border-gray-200 bg-white p-6 shadow-sm sm:p-7">

                            {/* Tags */}
                            <div className="mb-5 flex flex-wrap items-center gap-2">

                                <span className="rounded-full bg-[var(--theme)]/10 px-3 py-1 text-xs font-semibold text-[var(--theme)]">
                                    WFD
                                </span>

                                {question.is_prediction ? (
                                    <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                                        Prediction
                                    </span>
                                ) : null}

                                {question.is_real_exam ? (
                                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                                        Real Exam
                                    </span>
                                ) : null}

                                {question.is_wrong_question ? (
                                    <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold text-pink-700">
                                        Wrong Question
                                    </span>
                                ) : null}

                                {question.source_question_id ? (
                                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                                        #{question.source_question_id}
                                    </span>
                                ) : null}
                            </div>

                            {/* Question Text */}
                            <div className="rounded-2xl bg-gray-50 px-5 py-5 text-[18px] leading-9 text-gray-800">
                                {question.question_text}
                            </div>

                            {/* Stats */}
                            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-sm text-gray-500">

                                <span>
                                    我的练习：{question.attempt_count ?? 0} 次
                                </span>

                                <span>
                                    答对：{question.correct_count ?? 0}
                                </span>

                                <span>
                                    答错：{question.wrong_count ?? 0}
                                </span>

                                {typeof question.best_score === "number" ? (
                                    <span>
                                        最佳分：{question.best_score}
                                    </span>
                                ) : null}

                                {typeof question.latest_score === "number" ? (
                                    <span>
                                        最近分：{question.latest_score}
                                    </span>
                                ) : null}
                            </div>

                            {question.audio_url ? (
                                <div className="mt-8">
                                    <AudioPlayer
                                        url={getPublicAudioUrl(question.audio_url)}
                                    />
                                </div>
                            ) : (
                                <div className="mt-8 rounded-[24px] border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
                                    当前题目暂无音频
                                </div>
                            )}

                            <WfdDetailClient question={question} />

                            {/* Navigation */}
                            <div className="mt-8 flex items-center justify-between">

                                {prevId ? (
                                    <Link
                                        href={`/pteTest/listening/wfd/${prevId}`}
                                        className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:border-[var(--theme)]/30 hover:text-[var(--theme)]"
                                    >
                                        ← 上一题
                                    </Link>
                                ) : (
                                    <div />
                                )}

                                {nextId ? (
                                    <Link
                                        href={`/pteTest/listening/wfd/${nextId}`}
                                        className="rounded-2xl bg-[var(--theme)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                                    >
                                        下一题 →
                                    </Link>
                                ) : null}
                            </div>
                        </section>
                    </section>
                </div>
            </Container>
        </main>
    );
}