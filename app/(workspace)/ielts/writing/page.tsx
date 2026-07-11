import Container from "@/components/site/container";
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
    <main className="py-12 text-[var(--text)] sm:py-16 lg:py-20">
      <Container>
        <section className="mb-10 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-sm)] sm:p-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-faint)] sm:text-sm">
            IELTS WRITING
          </p>

          <h1 className="mb-5 text-3xl font-bold tracking-tight text-[var(--primary)] sm:text-4xl">
            雅思写作
          </h1>

          <p className="max-w-3xl text-base leading-7 text-[var(--text-soft)] sm:text-lg sm:leading-8">
            全球同步 Writing Task 2 真题回忆。
          </p>
        </section>

        {error ? (
          <p className="rounded-[var(--radius-md)] border border-[color:var(--danger)]/30 bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
            Writing 加载失败：{error.message}
          </p>
        ) : topics.length === 0 ? (
          <p className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--text-soft)]">
            还没有写作题目。
          </p>
        ) : (
          <WritingBrowser topics={topics} />
        )}
      </Container>
    </main>
  );
}
