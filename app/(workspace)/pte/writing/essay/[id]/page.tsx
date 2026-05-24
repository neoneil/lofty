import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";
import EssayDetailClient from "./essay-detail-client";
import Tag from "@/components/ui/tag";
import { Button } from "@/components/ui-v2/button";
import { ArrowLeft } from "lucide-react";
type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EssayQuestionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { supabase } = await requireUser(`/pte/writing/essay/${id}`);

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
        <section className="round border border-red-200 bg-red-50 p-5 text-red-600 shadow-sm">
          Essay 题目加载失败
        </section>
      </main>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: attempts } = await supabase
    .from("student_attempts")
    .select(`id,score,user_answer,ai_feedback,submitted_at`)
    .eq("user_id", user!.id)
    .eq("question_source", "we")
    .eq("question_id", question.id)
    .order("submitted_at", {
      ascending: false,
    });

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
              {/* left */}
              <Link href="/pte/writing/essay">
                <Button variant="primary" size="sm" className="gap-2">
                  <ArrowLeft size={16} />
                  <span>返回列表</span>
                </Button>
              </Link>

              {/* right */}
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Tag tone="theme">Essay</Tag>

                {question.source_question_id ? (
                  <Tag tone="neutral">{question.source_question_id}</Tag>
                ) : null}

                <Tag tone="yellow">考试原题</Tag>

                {question.is_prediction ? <Tag tone="purple">活跃</Tag> : null}

                {question.is_practiced ? (
                  <Tag tone="green">已练习</Tag>
                ) : (
                  <Tag tone="neutral">未练习</Tag>
                )}

                {question.is_wrong_question ? (
                  <Tag tone="pink">错题</Tag>
                ) : null}
              </div>
            </div>
            {/* Stats */}
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-sm text-gray-500">
              <span>曾经练习：{question.attempt_count ?? 0} 次</span>

              {typeof question.latest_score === "number" ? (
                <span>最近分数：{question.latest_score}</span>
              ) : null}
            </div>

            <EssayDetailClient question={question} attempts={attempts ?? []} />
          </section>
        </section>
      </div>
    </>
  );
}
