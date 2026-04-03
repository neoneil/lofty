import Container from "@/components/site/container";
import IELTSSubnav from "@/components/site/ielts-subnav";
import WritingBrowser from "@/components/site/writing-browser";
import { requireUser } from "@/lib/auth/require-user";

type WritingTopic = {
  id: string;
  year: number;
  month: number;
  day: number;
  question_en: string;
  question_zh: string | null;
  question_type: string | null;
  topic_category: string | null;
  created_at: string;
  updated_at: string;
};

export default async function IeltsWritingPage() {
  const { supabase } = await requireUser("/ielts/writing");

  const { data, error } = await supabase
    .schema("ielts")
    .from("ielts_writing_topics")
    .select("*")
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .order("day", { ascending: false })
    .limit(300);

  const topics = (data ?? []) as WritingTopic[];

  return (
    <main className="py-12 sm:py-16 lg:py-20">
      <Container>
        <section className="mb-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 sm:text-sm">
            IELTS WRITING
          </p>

          <h1 className="mb-5 text-3xl font-bold tracking-tight text-(--theme) sm:text-4xl">
            雅思写作
          </h1>

          <p className="max-w-3xl text-base leading-7 text-gray-600 sm:text-lg sm:leading-8">
            当前展示 Writing Task 2 题库。你可以按话题分类和题型分类快速筛选题目。
          </p>
        </section>

        <IELTSSubnav current="writing" />

        {error ? (
          <p className="text-red-500">Writing 加载失败：{error.message}</p>
        ) : topics.length === 0 ? (
          <p className="text-gray-500">还没有写作题目。</p>
        ) : (
          <WritingBrowser topics={topics} />
        )}
      </Container>
    </main>
  );
}