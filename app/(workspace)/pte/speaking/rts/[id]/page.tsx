import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth/require-user";
import { PTE_RTS_WITH_STATUS_SELECT } from "@/lib/pte/select-fields";
import Tag from "@/components/ui/tag";
import { Button } from "@/components/ui-v2/button";
import RtsDetailClient from "./rts-detail-client";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function RtsQuestionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { supabase } = await requireUser(`/pte/speaking/rts/${id}`);

  const { data: question, error } = await supabase
    .schema("views")
    .from("v_pte_rts_with_user_status")
    .select(PTE_RTS_WITH_STATUS_SELECT)
    .eq("id", id)
    .single();

  if (error || !question) {
    return (
      <main className="pb-10 pt-6 sm:pb-12 sm:pt-8 lg:pb-16">
        <section className="round border border-[color:var(--danger)]/30 bg-[var(--danger-soft)] p-5 text-[var(--danger)] shadow-sm">
          RTS 题目加载失败
        </section>
      </main>
    );
  }

  return (
    <div className="mt-1">
      <section className="space-y-6">
        <section className="rounded border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-7">
          <div className="mb-1 flex items-center justify-between gap-4">
            <Link href="/pte/speaking/rts">
              <Button variant="primary" size="sm" className="gap-2">
                <ArrowLeft size={16} />
                <span>返回列表</span>
              </Button>
            </Link>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <Tag tone="theme">RTS</Tag>

              {question.source_question_id ? (
                <Tag tone="neutral">{question.source_question_id}</Tag>
              ) : null}

              {question.is_real_exam ? <Tag tone="yellow">考试原题</Tag> : null}
              {question.is_prediction ? <Tag tone="purple">活跃</Tag> : null}

              {question.is_practiced ? (
                <Tag tone="green">已练习</Tag>
              ) : (
                <Tag tone="neutral">未练习</Tag>
              )}

              {question.is_wrong_question ? <Tag tone="pink">错题</Tag> : null}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-sm text-[var(--text-soft)]">
            <span>曾经练习：{question.attempt_count ?? 0} 次</span>
            <span>答对：{question.correct_count ?? 0}</span>
            <span>答错：{question.wrong_count ?? 0}</span>

            {typeof question.best_score === "number" ? (
              <span>最佳分：{question.best_score}</span>
            ) : null}

            {typeof question.latest_score === "number" ? (
              <span>最近分数：{question.latest_score}</span>
            ) : null}
          </div>

          <RtsDetailClient question={question} />
        </section>
      </section>
    </div>
  );
}
