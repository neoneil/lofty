import { requireUser } from "@/lib/auth/require-user";
import WfdVocabularyClient from "./wfd-vocabulary-client";

export type WfdVocabularyItem = {
  id: string;
  word: string;
  frequency: number;
  question_ids: string[] | null;
  is_stopword: boolean | null;
  category: string | null;
  created_at: string;
  updated_at: string;
};

export default async function WfdVocabularyPage() {
  const { supabase } = await requireUser("/pte/listening/wfd/vocabulary");

  const { data, error, count } = await supabase.schema("pte").from("wfd_vocabulary").select("id, word, frequency, question_ids, is_stopword, category, created_at, updated_at", { count: "exact" }).eq("is_stopword", false).order("frequency", { ascending: false });

  const vocabulary = (data ?? []) as WfdVocabularyItem[];
  const topFrequency = vocabulary[0]?.frequency ?? 0;
  const averageFrequency = vocabulary.length > 0 ? Math.round((vocabulary.reduce((sum, item) => sum + (item.frequency ?? 0), 0) / vocabulary.length) * 10) / 10 : 0;

  if (error) {
    return <section className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-5 text-sm text-red-600 shadow-[var(--shadow-sm)]">WFD 高频词加载失败：{error.message}</section>;
  }

  return <WfdVocabularyClient vocabulary={vocabulary} stats={{ totalWords: count ?? vocabulary.length, topFrequency, averageFrequency }} />;
}
