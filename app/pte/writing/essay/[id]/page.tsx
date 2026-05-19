import Link from "next/link";
import Container from "@/components/site/container";
import PTESidebar from "@/components/site/pte-sidebar";
import { requireUser } from "@/lib/auth/require-user";
import WeDetailClient from "./we-detail-client";
import Tag from "@/components/ui/tag";
type PageProps = {
    params: Promise<{
        id: string;
    }>;
};

export default async function WeQuestionDetailPage({
    params,
}: PageProps) {
    const { id } = await params;

    const { supabase } = await requireUser(`/pte/writing/we/${id}`);

    // 当前题目
    const { data: question, error } = await supabase
        .schema("views")
        .from("v_pte_we_with_user_status")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !question) {
        return (
            <main className="pb-10 pt-6 sm:pb-12 sm:pt-8 lg:pb-16">
                <Container>
                    <section className="round border border-red-200 bg-red-50 p-5 text-red-600 shadow-sm">
                        Essay 题目加载失败
                    </section>
                </Container>
            </main>
        );
    }

    // 所有题目（用于上一题 / 下一题）
    const { data: allQuestions } = await supabase
        .schema("views")
        .from("v_pte_we_with_user_status")
        .select("id")
        .eq("question_type", "WE")
        // .eq("is_prediction", true)
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
                            currentMain="writing"
                            currentSub="essay"
                        />
                    </div>

                    {/* Content */}
                    <section className="space-y-6">

                        {/* Header */}
                        <section className="rounded border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--theme)]/80">
                                PTE Writing
                            </p>

                            <h1 className="text-2xl font-bold leading-tight tracking-tight text-[var(--theme)] lg:text-3xl">
                                Essay Question Detail
                            </h1>

                            <p className="mt-4 max-w-2xl text-sm leading-8 text-gray-600 sm:text-base">
                                单题练习页面。
                            </p>
                        </section>

                        {/* Question */}
                        <section className="rounded border border-gray-200 bg-white p-6 shadow-sm sm:p-7">

                            {/* Tags */}
                            <div className="mb-1 flex flex-wrap items-center gap-2">

                                <Link
                                    href="/pte/writing/essay"
                                    className="
                                    inline-flex items-center
                                    rounded-xl

                                    bg-white
                                    px-3 py-2

                                    text-sm font-medium
                                    text-gray-600

                                    transition
                                    hover:bg-gray-100
                                "
                                >
                                    ← 返回列表
                                </Link>

                                <Tag tone="theme">
                                    WE
                                </Tag>

                                {question.source_question_id ? (
                                    <Tag tone="neutral">
                                        {question.source_question_id}
                                    </Tag>
                                ) : null}

                                <Tag tone="yellow">考试原题</Tag>

                                {question.is_prediction ? (
                                    <Tag tone="purple">活跃</Tag>
                                ) : null}

                                {question.is_practiced ? (
                                    <Tag tone="green">已练习</Tag>
                                ) : (
                                    <Tag tone="neutral">未练习</Tag>
                                )}

                                {question.is_wrong_question ? (
                                    <Tag tone="pink">错题</Tag>
                                ) : null}
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



                            <WeDetailClient question={question}
                                prevQuestionId={prevId}
                                nextQuestionId={nextId}
                                questionNumber={currentIndex + 1} />

                            {/* Navigation */}
                            <div className="mt-8 flex items-center justify-between">

                                {prevId ? (
                                    <Link
                                        href={`/pte/writing/essay/${prevId}`}
                                        className="rounded border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:border-[var(--theme)]/30 hover:text-[var(--theme)]"
                                    >
                                        ← 上一题
                                    </Link>
                                ) : (
                                    <div />
                                )}

                                {nextId ? (
                                    <Link
                                        href={`/pte/listening/essay/${nextId}`}
                                        className="rounded bg-[var(--theme)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
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