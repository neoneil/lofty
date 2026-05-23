import Link from "next/link";
import AudioPlayer from "@/components/site/AudioPlayer";
import { requireUser } from "@/lib/auth/require-user";
import WfdDetailClient from "./wfd-detail-client";
import Tag from "@/components/ui/tag";
import Image from "next/image";
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
    const { supabase } = await requireUser(`/pte/listening/wfd/${id}`);

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
                    <section className="round border border-red-200 bg-red-50 p-5 text-red-600 shadow-sm">
                        WFD 题目加载失败
                    </section>
            </main>
        );
    }

    return (
        <>
                <div className="mt-1">
                    {/* Content */}
                    <section className="space-y-6">

                        {/* Question */}
                        <section className="rounded border border-gray-200 bg-white p-6 shadow-sm sm:p-7">

                            {/* Tags */}
                            <div className="mb-1 flex items-center justify-between gap-4">
                                {/* left */}
                                <Link
                                    href="/pte/listening/wfd"
                                    className="btn-primary">
                                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded">
                                        <Image
                                            src="/SVG/12.svg"
                                            alt="返回列表"
                                            width={20}
                                            height={20}
                                            className="
                                            h-5 w-5 object-contain
                                            opacity-90
                                            transition
                                            group-hover:scale-110"/>
                                    </div>
                                    <span>返回列表</span>
                                </Link>

                                {/* right */}
                                <div className="flex flex-wrap items-center justify-end gap-2">
                                    
                                    <Tag tone="theme">
                                        WFD
                                    </Tag>

                                    {question.source_question_id ? (
                                        <Tag tone="neutral">
                                            {question.source_question_id}
                                        </Tag>
                                    ) : null}

                                    <Tag tone="yellow">
                                        考试原题
                                    </Tag>

                                    {question.is_prediction ? (
                                        <Tag tone="purple">
                                            活跃
                                        </Tag>
                                    ) : null}

                                    {question.is_practiced ? (
                                        <Tag tone="green">
                                            已练习
                                        </Tag>
                                    ) : (
                                        <Tag tone="neutral">
                                            未练习
                                        </Tag>
                                    )}

                                    {question.is_wrong_question ? (
                                        <Tag tone="pink">
                                            错题
                                        </Tag>
                                    ) : null}

                                </div>

                            </div>
                            {/* Stats */}
                            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-sm text-gray-500">

                                <span>
                                    曾经练习：{question.attempt_count ?? 0} 次
                                </span>

                                <span>
                                    全对：{question.correct_count ?? 0}
                                </span>

                                <span>
                                    有错误：{question.wrong_count ?? 0}
                                </span>

                                {typeof question.best_score === "number" ? (
                                    <span>
                                        最佳对词：{question.best_score}
                                    </span>
                                ) : null}

                                {typeof question.latest_score === "number" ? (
                                    <span>
                                        最近分数：{question.latest_score}
                                    </span>
                                ) : null}
                            </div>

                            {question.audio_url ? (
                                <div className="mt-8">
                                    <AudioPlayer
                                        url={getPublicAudioUrl(question.audio_url)}
                                        autoPlay
                                        countdown={10}
                                    />
                                </div>
                            ) : (
                                <div className="mt-8 round border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
                                    当前题目暂无音频
                                </div>
                            )}

                            <WfdDetailClient
                                question={question}
                            />
                        </section>
                    </section>
                </div>
        </>
    );
}