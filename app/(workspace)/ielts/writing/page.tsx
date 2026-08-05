import Link from "next/link";
import { BarChart3, ChevronRight, Images } from "lucide-react";

import Container from "@/components/site/container";
import WritingBrowser from "@/components/site/writing-browser";
import { Badge } from "@/components/ui-v2/badge";
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
    .select("id, year, month, day, question_en, question_zh, question_type, topic_category, created_at, updated_at")
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

        <section className="mb-8 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <Link href="/ielts/writing/task1-bank" className="group block">
            <div className="h-full overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] transition group-hover:-translate-y-0.5 group-hover:border-[var(--primary)] group-hover:shadow-[var(--shadow-md)] sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]">
                    <Images size={22} />
                  </span>
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>Academic Task 1</Badge>
                      <Badge variant="secondary">Cambridge 5-21</Badge>
                    </div>
                    <h2 className="mt-3 text-xl font-semibold text-[var(--text)] sm:text-2xl">雅思小作文题库</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-soft)]">查看剑桥雅思 5 到 21 的全部 Test 1-4 小作文题目截图，包含题目文字描述和图形。</p>
                  </div>
                </div>
                <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-[var(--primary)] transition group-hover:bg-[var(--primary)] group-hover:text-white">
                  <ChevronRight size={18} />
                </span>
              </div>
            </div>
          </Link>

          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-soft)] p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--card)] text-[var(--primary)] shadow-[var(--shadow-sm)]">
                <BarChart3 size={19} />
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--text)]">Task 2 真题回忆</p>
                <p className="text-xs text-[var(--text-soft)]">下方继续保留大作文题库。</p>
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <p className="rounded-[var(--radius-md)] border border-[color:var(--danger)]/30 bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
            Writing 加载失败，请稍后再试。
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
