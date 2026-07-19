import Link from "next/link";
import AudioPlayer from "@/components/site/AudioPlayer";
import { requireUser } from "@/lib/auth/require-user";
import { PTE_HIW_QUESTION_SELECT } from "@/lib/pte/select-fields";
import Tag from "@/components/ui/tag";
import { Button } from "@/components/ui-v2/button";
import { ArrowLeft } from "lucide-react";
import HiwDetailClient from "./hiw-detail-client";
import { normalizePublicStorageUrl } from "@/lib/storage/public-url";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function HiwQuestionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { supabase, user } = await requireUser(`/pte/listening/hiw/${id}`);
  const parsedId = Number(id);

  if (!Number.isFinite(parsedId)) {
    return (
      <main className="pb-10 pt-6 sm:pb-12 sm:pt-8 lg:pb-16">
        <section className="round border border-[var(--danger)]/25 bg-[var(--danger-soft)] p-5 text-[var(--danger)] shadow-[var(--shadow-sm)]">HIW 题目 ID 不合法</section>
      </main>
    );
  }

  const { data: question, error } = await supabase.schema("pte").from("hiw").select(PTE_HIW_QUESTION_SELECT).eq("id", parsedId).single();

  if (error || !question) {
    return (
      <main className="pb-10 pt-6 sm:pb-12 sm:pt-8 lg:pb-16">
        <section className="round border border-[var(--danger)]/25 bg-[var(--danger-soft)] p-5 text-[var(--danger)] shadow-[var(--shadow-sm)]">HIW 题目加载失败</section>
      </main>
    );
  }

  const { data: stat } = await supabase
    .from("student_question_stats")
    .select("is_practiced,attempt_count,correct_count,wrong_count,last_attempt_at,latest_score,best_score,is_in_wrong_book")
    .eq("user_id", user.id)
    .eq("question_source", "hiw")
    .eq("question_id", String(question.id))
    .maybeSingle();

  return (
    <div className="mt-1">
      <section className="space-y-6">
        <section className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] sm:p-7">
          <div className="mb-1 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/pte/listening/hiw">
              <Button variant="primary" size="sm" className="gap-2">
                <ArrowLeft size={16} />
                <span>返回列表</span>
              </Button>
            </Link>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <Tag tone="theme">HIW</Tag>
              {question.source_question_id ? <Tag tone="neutral">{question.source_question_id}</Tag> : null}
              {question.is_prediction ? <Tag tone="purple">Prediction</Tag> : null}
              {stat?.is_practiced ? <Tag tone="green">已练习</Tag> : <Tag tone="neutral">未练习</Tag>}
              {stat?.is_in_wrong_book ? <Tag tone="pink">错题</Tag> : null}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-sm text-[var(--text-soft)]">
            <span>曾经练习：{stat?.attempt_count ?? 0} 次</span>
            <span>全对：{stat?.correct_count ?? 0}</span>
            <span>有错误：{stat?.wrong_count ?? 0}</span>
            {typeof stat?.best_score === "number" ? <span>最佳分：{stat.best_score}</span> : null}
            {typeof stat?.latest_score === "number" ? <span>最近分数：{stat.latest_score}</span> : null}
          </div>

          <div className="mt-6 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-5">
            <div className="mb-2 text-sm font-semibold text-[var(--text)]">题目说明</div>
            <div className="text-sm leading-7 text-[var(--text-soft)]">{question.instruction_text || "You will hear a recording. Some words in the transcription differ from what the speaker said. Click on the words that are different."}</div>
          </div>

          {question.audio_url ? (
            <div className="mx-auto mt-8 w-full max-w-[50%] max-lg:max-w-[72%] max-sm:max-w-full">
              <AudioPlayer url={normalizePublicStorageUrl(question.audio_url, "pte-audio")} autoPlay countdown={10} size="compact" />
            </div>
          ) : (
            <div className="mt-8 round border border-dashed border-[var(--border-strong)] bg-[var(--bg-soft)] p-6 text-center text-sm text-[var(--text-soft)]">当前题目暂无音频</div>
          )}

          <HiwDetailClient question={question} />
        </section>
      </section>
    </div>
  );
}
