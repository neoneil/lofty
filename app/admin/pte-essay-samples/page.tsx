import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PteEssaySampleBrowser, type PteEssaySampleAnswer, type PteEssaySampleQuestion, type PteEssaySampleSentence } from "@/components/admin/pte-essay-sample-browser";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

type WeQuestionRow = {
  id: string;
  question_text: string;
  created_at: string;
};

export const dynamic = "force-dynamic";

export default async function PteEssaySamplesAdminPage() {
  await requireAdmin("/admin/pte-essay-samples");
  const supabase = createAdminClient();

  const { data: questionsData, error: questionError } = await supabase
    .schema("pte")
    .from("we")
    .select("id, question_text, created_at")
    .eq("question_type", "WE")
    .eq("is_prediction", true)
    .order("created_at", { ascending: false });

  const questions = (questionsData ?? []) as WeQuestionRow[];
  const questionIds = questions.map((question) => question.id);

  const { data: answersData } = questionIds.length > 0
    ? await supabase
        .schema("pte")
        .from("essay_answer")
        .select("id,we_id,thesis,answer_text,score_target,created_at")
        .in("we_id", questionIds)
    : { data: [] };

  const answers = (answersData ?? []) as PteEssaySampleAnswer[];
  const answerIds = answers.map((answer) => answer.id);

  const { data: sentencesData } = answerIds.length > 0
    ? await supabase
        .schema("pte")
        .from("essay_sentence")
        .select("id,we_id,essay_answer_id,sentence_text,chinese_explanation,tag1,tag2,sentence_type,source_type,position_type,argument_pattern,peel_role,difficulty_level,is_featured")
        .in("essay_answer_id", answerIds)
    : { data: [] };

  const sentences = (sentencesData ?? []) as PteEssaySampleSentence[];
  const questionModels: PteEssaySampleQuestion[] = questions.map((question) => {
    const answer = answers.find((item) => item.we_id === question.id) ?? null;
    return {
      ...question,
      answer,
      sentences: answer ? sentences.filter((sentence) => sentence.essay_answer_id === answer.id) : [],
    };
  });

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-6 text-[var(--text)] sm:px-6 sm:py-8 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-5">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-soft)] transition hover:text-[var(--primary)]"><ArrowLeft size={16} />返回管理中心</Link>
        {questionError ? (
          <div className="rounded-[var(--radius-lg)] border border-[color:var(--danger)]/30 bg-[var(--danger-soft)] p-5 text-sm text-[var(--danger)]">PTE 大作文题目加载失败：{questionError.message}</div>
        ) : (
          <PteEssaySampleBrowser initialQuestions={questionModels} />
        )}
      </section>
    </main>
  );
}
