import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PteSwtSampleBrowser, type PteSwtSampleAnswer, type PteSwtSampleComponent, type PteSwtSampleQuestion } from "@/components/admin/pte-swt-sample-browser";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

type SwtQuestionRow = {
  id: string;
  question_title: string | null;
  question_text: string;
  answer: string | null;
  created_at: string;
};

export const dynamic = "force-dynamic";

export default async function PteSwtSamplesAdminPage() {
  await requireAdmin("/admin/pte-swt-samples");
  const supabase = createAdminClient();

  const { data: questionsData, error: questionError } = await supabase
    .schema("pte")
    .from("swt")
    .select("id, question_title, question_text, answer, created_at")
    .eq("is_prediction", true)
    .order("created_at", { ascending: false });

  const questions = (questionsData ?? []) as SwtQuestionRow[];
  const questionIds = questions.map((question) => question.id);

  const { data: answersData } = questionIds.length > 0
    ? await supabase
        .schema("pte")
        .from("swt_answer")
        .select("id,swt_id,answer_text,chinese_explanation,word_count,score_target,created_at")
        .in("swt_id", questionIds)
    : { data: [] };

  const answers = (answersData ?? []) as PteSwtSampleAnswer[];
  const answerIds = answers.map((answer) => answer.id);

  const { data: componentsData } = answerIds.length > 0
    ? await supabase
        .schema("pte")
        .from("swt_component")
        .select("id,swt_id,swt_answer_id,component_text,chinese_explanation,component_role,grammar_pattern,source_idea,created_at")
        .in("swt_answer_id", answerIds)
    : { data: [] };

  const components = (componentsData ?? []) as PteSwtSampleComponent[];
  const questionModels: PteSwtSampleQuestion[] = questions.map((question) => {
    const answer = answers.find((item) => item.swt_id === question.id) ?? null;
    return {
      id: question.id,
      question_title: question.question_title,
      question_text: question.question_text,
      source_answer: question.answer,
      created_at: question.created_at,
      answer,
      components: answer ? components.filter((component) => component.swt_answer_id === answer.id) : [],
    };
  });

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-6 text-[var(--text)] sm:px-6 sm:py-8 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-5">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-soft)] transition hover:text-[var(--primary)]"><ArrowLeft size={16} />返回管理中心</Link>
        {questionError ? (
          <div className="rounded-[var(--radius-lg)] border border-[color:var(--danger)]/30 bg-[var(--danger-soft)] p-5 text-sm text-[var(--danger)]">PTE SWT 题目加载失败：{questionError.message}</div>
        ) : (
          <PteSwtSampleBrowser initialQuestions={questionModels} />
        )}
      </section>
    </main>
  );
}
