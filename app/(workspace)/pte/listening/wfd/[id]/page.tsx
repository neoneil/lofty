import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";
import { PTE_WFD_WITH_STATUS_SELECT } from "@/lib/pte/select-fields";
import WfdDetailClient from "./wfd-detail-client";
import Tag from "@/components/ui/tag";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui-v2/button";
import { normalizePublicStorageUrl } from "@/lib/storage/public-url";
import { PteVoiceAudioPlayer } from "@/components/pte-ai-audio/pte-voice-audio-player";
type PageProps = {
  params: Promise<{
    id: string;
  }>;
};
function getPublicAudioUrl(path: string) {
  return normalizePublicStorageUrl(path, "pte-audio");
}
export default async function WfdQuestionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { supabase } = await requireUser(`/pte/listening/wfd/${id}`);

  // 当前题目
  const { data: question, error } = await supabase
    .schema("views")
    .from("v_pte_wfd_with_user_status")
    .select(PTE_WFD_WITH_STATUS_SELECT)
    .eq("id", id)
    .single();

  if (error || !question) {
    return (
      <main className="pb-10 pt-6 sm:pb-12 sm:pt-8 lg:pb-16">
        <section className="round border border-[var(--danger)]/25 bg-[var(--danger-soft)] p-5 text-[var(--danger)] shadow-[var(--shadow-sm)]">
          WFD 题目加载失败
        </section>
      </main>
    );
  }

  const { data: audioMeta } = await supabase
    .schema("pte")
    .from("wfd")
    .select("audio_status")
    .eq("id", id)
    .maybeSingle();

  return (
    <>
      <div className="mt-1">
        {/* Content */}
        <section className="space-y-6">
          {/* Question */}
          <section className="rounded border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-sm)] sm:p-7">
            {/* Tags */}
            <div className="mb-1 flex items-center justify-between gap-4">
              {/* left */}
              <Link href="/pte/listening/wfd">
                <Button variant="primary" size="sm" className="gap-2">
                  <ArrowLeft size={16} />
                  <span>返回列表</span>
                </Button>
              </Link>

              {/* right */}
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Tag tone="theme">WFD</Tag>

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
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-sm text-[var(--text-soft)]">
              <span>曾经练习：{question.attempt_count ?? 0} 次</span>

              <span>全对：{question.correct_count ?? 0}</span>

              <span>有错误：{question.wrong_count ?? 0}</span>

              {typeof question.best_score === "number" ? (
                <span>最佳对词：{question.best_score}</span>
              ) : null}

              {typeof question.latest_score === "number" ? (
                <span>最近分数：{question.latest_score}</span>
              ) : null}
            </div>

            {question.audio_url ? (
              <div className="mx-auto mt-8 w-full max-w-[50%] max-lg:max-w-[72%] max-sm:max-w-full">
                <PteVoiceAudioPlayer
                  questionType="wfd"
                  questionId={question.id}
                  fallbackUrl={getPublicAudioUrl(question.audio_url)}
                  aiAudioReady={audioMeta?.audio_status === "ready"}
                  autoPlay
                  countdown={10}
                />
              </div>
            ) : (
              <div className="mt-8 round border border-dashed border-[var(--border-strong)] bg-[var(--bg-soft)] p-6 text-center text-sm text-[var(--text-soft)]">
                当前题目暂无音频
              </div>
            )}

            <WfdDetailClient question={question} />
          </section>
        </section>
      </div>
    </>
  );
}
