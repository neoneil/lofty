import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth/require-user";
import { PTE_RS_WITH_STATUS_SELECT } from "@/lib/pte/select-fields";
import Tag from "@/components/ui/tag";
import { Button } from "@/components/ui-v2/button";
import RsDetailClient from "./rs-detail-client";
import { hasCompletePteAiAudioMetadata } from "@/lib/pte-ai-audio/voices";
import { getPteAiAudioRelativePath, PTE_AI_AUDIO_DEFAULT_VOICE } from "@/lib/pte-ai-audio/voices";
import { getRsCoreDrill } from "@/content/pte/rs-core-drills";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyPteQuestionStatus, loadPteQuestionStatusMap } from "@/lib/pte/question-status";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function RsQuestionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { supabase, user } = await requireUser(`/pte/speaking/rs/${id}`);
  const staticQuestion = getRsCoreDrill(id);

  let question;
  let error = null;
  if (staticQuestion) {
    const statusMap = await loadPteQuestionStatusMap({ admin: createAdminClient(), userId: user.id, questionSource: "rs", questionIds: [id] });
    question = applyPteQuestionStatus({
      id,
      question_text: staticQuestion.question_text,
      audio_url: getPteAiAudioRelativePath("rs", id, PTE_AI_AUDIO_DEFAULT_VOICE),
      is_real_exam: false,
      is_prediction: true,
    }, statusMap.get(id));
  } else {
    const result = await supabase.schema("views").from("v_pte_rs_with_user_status").select(PTE_RS_WITH_STATUS_SELECT).eq("id", id).single();
    question = result.data;
    error = result.error;
  }

  if (error || !question) {
    return (
      <main className="pb-10 pt-6 sm:pb-12 sm:pt-8 lg:pb-16">
        <section className="round border border-[color:var(--danger)]/30 bg-[var(--danger-soft)] p-5 text-[var(--danger)] shadow-sm">
          RS 题目加载失败
        </section>
      </main>
    );
  }

  const { data: audioMeta } = staticQuestion
    ? { data: null }
    : await supabase.schema("pte").from("rs").select("audio_status, audio_url, ai_voice, audio_variant_count").eq("id", id).maybeSingle();

  return (
    <div className="mt-1">
      <section className="space-y-6">
        <section className="rounded border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-7">
          <div className="mb-1 flex items-center justify-between gap-4">
            <Link href="/pte/speaking/rs">
              <Button variant="primary" size="sm" className="gap-2">
                <ArrowLeft size={16} />
                <span>返回列表</span>
              </Button>
            </Link>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <Tag tone="theme">RS</Tag>

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

          <RsDetailClient
            question={question}
            aiAudioReady={Boolean(staticQuestion) || hasCompletePteAiAudioMetadata({
              questionType: "rs",
              questionId: question.id,
              audioStatus: audioMeta?.audio_status,
              aiVoice: audioMeta?.ai_voice,
              audioUrl: audioMeta?.audio_url,
              audioVariantCount: audioMeta?.audio_variant_count,
            })}
          />
        </section>
      </section>
    </div>
  );
}
