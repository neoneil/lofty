import type { ReactNode } from "react";
import Container from "@/components/site/container";
import PTESidebar from "@/components/site/pte-sidebar";
import { requireUser } from "@/lib/auth/require-user";

type WfdQuestion = {
  id: string;
  question_text: string;
  question_type: string;
  source_question_id: string | null;
  difficulty_level: string | null;
  tags: string[] | null;
  is_prediction: boolean | null;
  audio_url: string | null;
  audio_duration_seconds: number | null;
  ai_voice: string | null;
  usage_count: number | null;
  created_at: string;
  updated_at: string;
  is_practiced: boolean | null;
  is_real_exam: boolean | null;
};

type PageProps = {
  searchParams?: Promise<{
    page?: string;
  }>;
};

const PAGE_SIZE = 10;

function getWordCount(text: string) {
  return text.trim().split(/\s+/).length;
}

function mapDifficultyLabel(level: string | null) {
  if (!level) return null;

  const value = level.toLowerCase();

  if (
    value.includes("easy") ||
    value.includes("simple") ||
    value.includes("low") ||
    value === "简"
  ) {
    return "简";
  }

  if (
    value.includes("hard") ||
    value.includes("difficult") ||
    value.includes("high") ||
    value === "难"
  ) {
    return "难";
  }

  if (
    value.includes("medium") ||
    value.includes("normal") ||
    value === "普"
  ) {
    return "普";
  }

  return level;
}

function Tag({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?:
    | "theme"
    | "warm"
    | "green"
    | "purple"
    | "blue"
    | "pink"
    | "yellow"
    | "neutral";
}) {
  const styles = {
    theme: "bg-[var(--theme)]/10 text-[var(--theme)]",
    warm: "bg-orange-50 text-orange-700",
    green: "bg-emerald-50 text-emerald-700",
    purple: "bg-violet-50 text-violet-700",
    blue: "bg-sky-50 text-sky-700",
    pink: "bg-pink-50 text-pink-700",
    yellow: "bg-amber-50 text-amber-700",
    neutral: "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--theme)]/8 text-[var(--theme)]">
          {icon ?? (
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M12 3v18M3 12h18" />
            </svg>
          )}
        </div>

        <div className="min-w-0">
          <div className="text-3xl font-bold tracking-tight text-[var(--theme)]">
            {value}
          </div>
          <div className="text-sm text-gray-500">{label}</div>
        </div>
      </div>
    </div>
  );
}

function StatBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-16 shrink-0 text-sm text-gray-500">{label}</div>
      <div className="h-2 flex-1 rounded-full bg-gray-200">
        <div
          className="h-2 rounded-full bg-[var(--theme)]"
          style={{ width: `${value}%` }}
        />
      </div>
      <div className="w-10 shrink-0 text-right text-sm font-semibold text-gray-600">
        {value}%
      </div>
    </div>
  );
}

function RightCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-[20px] font-bold tracking-tight text-[var(--theme)]">
        {title}
      </h3>
      <div className="space-y-4 text-sm leading-8 text-gray-600">{children}</div>
    </section>
  );
}

function PaginationLink({
  page,
  currentPage,
  children,
  disabled = false,
}: {
  page: number;
  currentPage: number;
  children: ReactNode;
  disabled?: boolean;
}) {
  const active = page === currentPage;

  if (disabled) {
    return (
      <span className="inline-flex h-11 min-w-11 items-center justify-center rounded-xl border border-gray-200 bg-gray-100 px-4 text-sm font-medium text-gray-400">
        {children}
      </span>
    );
  }

  return (
    <a
      href={`?page=${page}`}
      className={`inline-flex h-11 min-w-11 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition ${
        active
          ? "border-[var(--theme)] bg-[var(--theme)] text-white"
          : "border-gray-200 bg-white text-gray-600 hover:border-[var(--theme)]/30 hover:text-[var(--theme)]"
      }`}
    >
      {children}
    </a>
  );
}

function getPaginationNumbers(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, -1, totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, -1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, -1, currentPage - 1, currentPage, currentPage + 1, -1, totalPages];
}

function SideDecorationBooks() {
  return (
    <div className="overflow-hidden rounded-[22px] bg-[linear-gradient(180deg,#faf7f1_0%,#f4efe5_100%)] p-4">
      <div className="relative h-24">
        <div className="absolute bottom-0 right-4 h-10 w-20 rounded-lg border border-[#cfc7b4] bg-[#d8d1be] shadow-sm" />
        <div className="absolute bottom-4 right-8 h-10 w-20 rounded-lg border border-[#cfc7b4] bg-[#c9c3b2] shadow-sm" />
        <div className="absolute bottom-8 right-12 h-10 w-20 rounded-lg border border-[#cfc7b4] bg-[#bbb7a8] shadow-sm" />
        <div className="absolute bottom-2 right-8 text-[11px] font-semibold tracking-wide text-white">
          IELTS
        </div>
        <div className="absolute bottom-6 right-12 text-[11px] font-semibold tracking-wide text-white">
          PTE
        </div>
        <div className="absolute bottom-10 right-16 text-[11px] font-semibold tracking-wide text-white">
          ENGLISH
        </div>

        <div className="absolute left-2 top-3 h-7 w-1 rounded-full bg-[#d9d2c6]" />
        <div className="absolute left-4 top-0 h-5 w-9 rotate-[-25deg] rounded-full bg-[#e7e0d3]" />
        <div className="absolute left-8 top-6 h-7 w-1 rounded-full bg-[#d9d2c6]" />
        <div className="absolute left-10 top-2 h-5 w-9 rotate-[20deg] rounded-full bg-[#e7e0d3]" />
      </div>
    </div>
  );
}

export default async function PteListeningPage({ searchParams }: PageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const currentPageRaw = Number(resolvedSearchParams.page ?? "1");
  const currentPage =
    Number.isFinite(currentPageRaw) && currentPageRaw > 0
      ? Math.floor(currentPageRaw)
      : 1;

  const { supabase } = await requireUser("/pte/listening");

  const { data, error } = await supabase
    .schema("pte")
    .from("pte_wfd_questions")
    .select("*")
    .eq("question_type", "WFD")
    .eq("is_prediction", true)
    .order("created_at", { ascending: false })
    .limit(300);

  const questions = ((data ?? []) as WfdQuestion[]).sort((a, b) => {
    return getWordCount(a.question_text) - getWordCount(b.question_text);
  });

  const totalCount = questions.length;
  const practicedCount = questions.filter((q) => q.is_practiced).length;
  const realExamCount = questions.filter((q) => q.is_real_exam).length;

  const avgUsage =
    questions.length > 0
      ? Math.round(
          questions.reduce((sum, q) => sum + (q.usage_count ?? 0), 0) /
            questions.length
        )
      : 0;

  const practicedPercent =
    totalCount > 0 ? Math.round((practicedCount / totalCount) * 100) : 0;
  const realExamPercent =
    totalCount > 0 ? Math.round((realExamCount / totalCount) * 100) : 0;
  const activityPercent = Math.min(avgUsage, 100);
  const returnRatePercent =
    totalCount > 0 ? Math.min(Math.round((avgUsage / 20) * 100), 100) : 0;

  const updatedAt =
    questions.length > 0
      ? new Date(
          [...questions].sort(
            (a, b) =>
              new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          )[0].updated_at
        ).toLocaleDateString("zh-CN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
      : null;

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const paginatedQuestions = questions.slice(startIndex, startIndex + PAGE_SIZE);
  const paginationNumbers = getPaginationNumbers(safeCurrentPage, totalPages);

  return (
    <main className="pb-10 pt-6 sm:pb-12 sm:pt-8 lg:pb-16">
      <Container>
        {error ? (
          <section className="rounded-[28px] border border-red-200 bg-red-50 p-5 text-red-600 shadow-sm">
            WFD 加载失败：{error.message}
          </section>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)_320px] 2xl:grid-cols-[260px_minmax(0,1fr)_340px]">
            {/* 左侧 */}
            <div className="xl:sticky xl:top-24 xl:self-start">
              <PTESidebar currentMain="listening" currentSub="wfd" />
            </div>

            {/* 中间 */}
            <section className="space-y-6">
              <section className="rounded-[30px] border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-6 2xl:flex-row 2xl:items-start 2xl:justify-between">
                    <div className="min-w-0 max-w-3xl">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-(--theme)/80">
                        PTE Listening
                      </p>
                      <h1 className="text-4xl font-bold leading-tight tracking-tight text-(--theme) lg:text-5xl">
                        FIB-L
                      </h1>
                      <p className="mt-4 max-w-2xl text-sm leading-8 text-gray-600 sm:text-base">
                        当前页面展示 PTE 听力中的 WFD 预测题库，可直接浏览题目、查看标签、播放音频，
                        后续也方便继续接搜索、筛选、随机练习和 PDF 导出。
                      </p>
                    </div>

                    <div className="flex w-full flex-col gap-3 lg:flex-row 2xl:w-auto 2xl:shrink-0">
                      <div className="flex min-w-60 items-center rounded-2xl border border-gray-200 bg-[#faf8f4] px-4 py-3 text-sm text-gray-400">
                        <svg
                          viewBox="0 0 24 24"
                          className="mr-2 h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <circle cx="11" cy="11" r="7" />
                          <path d="m20 20-3.5-3.5" />
                        </svg>
                        搜索题目、标签...
                      </div>

                      <button className="inline-flex items-center justify-center rounded-2xl bg-(--theme) px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95">
                        下载 PDF
                      </button>

                      <div className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-600">
                        共 {totalCount} 题
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                      label="总题数"
                      value={totalCount}
                      icon={
                        <svg
                          viewBox="0 0 24 24"
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <path d="M12 3 4 7v6c0 5 3.5 7.5 8 8 4.5-.5 8-3 8-8V7l-8-4Z" />
                          <path d="M9 12h6M12 9v6" />
                        </svg>
                      }
                    />
                    <StatCard
                      label="已练题数"
                      value={practicedCount}
                      icon={
                        <svg
                          viewBox="0 0 24 24"
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <circle cx="12" cy="12" r="8" />
                          <path d="m9.5 12 1.8 1.8 3.7-4" />
                        </svg>
                      }
                    />
                    <StatCard
                      label="真题占比"
                      value={`${realExamPercent}%`}
                      icon={
                        <svg
                          viewBox="0 0 24 24"
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <rect x="4" y="5" width="16" height="14" rx="2" />
                          <path d="M8 3v4M16 3v4M4 10h16" />
                        </svg>
                      }
                    />
                    <StatCard
                      label="最近更新时间"
                      value={updatedAt ?? "--"}
                      icon={
                        <svg
                          viewBox="0 0 24 24"
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <rect x="3" y="5" width="18" height="16" rx="2" />
                          <path d="M16 3v4M8 3v4M3 10h18" />
                        </svg>
                      }
                    />
                  </div>
                </div>
              </section>

              {questions.length === 0 ? (
                <section className="rounded-[30px] border border-gray-200 bg-white p-6 text-gray-500 shadow-sm">
                  还没有 WFD 题目。
                </section>
              ) : (
                <section className="overflow-hidden rounded-[30px] border border-gray-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <button className="rounded-2xl bg-(--theme) px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95">
                        预测题
                      </button>
                      <button className="rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:border-[var(--theme)]/30 hover:text-[var(--theme)]">
                        按句长
                      </button>
                      <button className="rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:border-[var(--theme)]/30 hover:text-[var(--theme)]">
                        已练题
                      </button>
                      <button className="rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:border-[var(--theme)]/30 hover:text-[var(--theme)]">
                        真题
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <button className="inline-flex items-center rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:border-[var(--theme)]/30 hover:text-[var(--theme)]">
                        排序：默认
                        <svg
                          viewBox="0 0 20 20"
                          className="ml-2 h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <path d="m5 7 5 5 5-5" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div>
                    {paginatedQuestions.map((item) => {
                      const difficulty = mapDifficultyLabel(item.difficulty_level);

                      return (
                        <article
                          key={item.id}
                          className="border-b border-gray-100 px-5 py-5 last:border-b-0 sm:px-6"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="mb-3 flex flex-wrap items-center gap-2">
                                <Tag tone="theme">WFD</Tag>

                                {item.is_prediction ? (
                                  <Tag tone="purple">Prediction</Tag>
                                ) : null}

                                {item.is_real_exam ? (
                                  <Tag tone="yellow">Real Exam</Tag>
                                ) : null}

                                {difficulty === "简" ? (
                                  <Tag tone="blue">简</Tag>
                                ) : null}

                                {difficulty === "普" ? (
                                  <Tag tone="warm">普</Tag>
                                ) : null}

                                {difficulty === "难" ? (
                                  <Tag tone="pink">难</Tag>
                                ) : null}

                                {item.is_practiced ? (
                                  <Tag tone="green">已练</Tag>
                                ) : (
                                  <Tag tone="neutral">未练</Tag>
                                )}

                                {item.source_question_id ? (
                                  <Tag tone="neutral">
                                    #{item.source_question_id}
                                  </Tag>
                                ) : null}
                              </div>

                              <p className="text-[17px] leading-8 text-gray-800 sm:text-[19px]">
                                {item.question_text}
                              </p>

                              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                                <span>词数：{getWordCount(item.question_text)}</span>

                                {item.audio_duration_seconds ? (
                                  <span>时长：{item.audio_duration_seconds}s</span>
                                ) : null}

                                {typeof item.usage_count === "number" ? (
                                  <span>练习次数：{item.usage_count}</span>
                                ) : null}

                                {item.ai_voice ? <span>语音：{item.ai_voice}</span> : null}
                              </div>

                              {item.audio_url ? (
                                <div className="mt-4 max-w-xl rounded-2xl border border-gray-200 bg-[#faf8f4] p-3">
                                  <audio controls className="w-full">
                                    <source src={item.audio_url} />
                                    你的浏览器不支持音频播放。
                                  </audio>
                                </div>
                              ) : null}
                            </div>

                            <div className="shrink-0">
                              <button className="flex h-14 w-14 items-center justify-center rounded-full border border-gray-200 bg-white text-[var(--theme)] transition hover:border-[var(--theme)]/40 hover:bg-[var(--theme)]/5">
                                <svg
                                  viewBox="0 0 24 24"
                                  className="ml-0.5 h-6 w-6"
                                  fill="currentColor"
                                >
                                  <path d="M8 6.5v11l9-5.5-9-5.5Z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 border-t border-gray-100 px-5 py-5 sm:px-6">
                    <PaginationLink
                      page={Math.max(1, safeCurrentPage - 1)}
                      currentPage={safeCurrentPage}
                      disabled={safeCurrentPage === 1}
                    >
                      上一页
                    </PaginationLink>

                    {paginationNumbers.map((page, idx) =>
                      page === -1 ? (
                        <span
                          key={`ellipsis-${idx}`}
                          className="inline-flex h-11 min-w-11 items-center justify-center text-sm font-semibold text-gray-400"
                        >
                          ...
                        </span>
                      ) : (
                        <PaginationLink
                          key={page}
                          page={page}
                          currentPage={safeCurrentPage}
                        >
                          {page}
                        </PaginationLink>
                      )
                    )}

                    <PaginationLink
                      page={Math.min(totalPages, safeCurrentPage + 1)}
                      currentPage={safeCurrentPage}
                      disabled={safeCurrentPage === totalPages}
                    >
                      下一页
                    </PaginationLink>
                  </div>
                </section>
              )}
            </section>

            {/* 右侧 */}
            <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
              <RightCard title="题库介绍">
                <p>当前页面题库均进行了基础排序，便于循序渐进练习。</p>
                <p>你后面可以继续在这里加搜索、标签筛选、难度筛选和随机练习。</p>
                <p>整体结构已经适合继续扩展成更完整的 PTE 听力页面。</p>
                <SideDecorationBooks />
              </RightCard>

              <RightCard title="数据概览">
                <StatBar label="已练占比" value={practicedPercent} />
                <StatBar label="真题占比" value={realExamPercent} />
                <StatBar label="活跃度" value={activityPercent} />
                <StatBar label="近反度" value={returnRatePercent} />
              </RightCard>

              <RightCard title="当前建议">
                <p>
                  先把核心 WFD 句库反复听写熟，再逐步加入搜索、错题回练和随机练习。
                </p>
                <p>
                  如果你后面还会做 SST / FIB-L / HIW，这一套布局可以直接复用。
                </p>
                <p>
                  现在这个版本已经很适合作为 PTE 听力模块的统一母版。
                </p>
              </RightCard>
            </aside>
          </div>
        )}
      </Container>
    </main>
  );
}