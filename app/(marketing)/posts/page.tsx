import Link from "next/link";

import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-v2/card";
import { Input } from "@/components/ui-v2/input";
import { createClient } from "@/lib/supabase/server";

type PostsPageProps = {
  searchParams: Promise<{ q?: string }>;
};

function formatDate(date: string | null) {
  if (!date) {
    return "暂无日期";
  }

  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const { q } = await searchParams;
  const keyword = q?.trim() ?? "";

  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select(
      "id, title, slug, excerpt, cover_image, published_at, created_at, category, pinned_order",
    )
    .eq("status", "published")
    .order("pinned_order", { ascending: false })
    .order("published_at", { ascending: false });

  if (keyword) {
    query = query.or(`title.ilike.%${keyword}%,excerpt.ilike.%${keyword}%`);
  }

  const { data: posts, error } = await query;
  const featuredPost = posts?.[0] ?? null;
  const otherPosts = posts?.slice(1) ?? [];

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-10 text-[var(--text)] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] sm:p-6 lg:p-7">
          <div className="grid gap-6 lg:grid-cols-[1fr_390px] lg:items-end">
            <div>
              <Badge variant="default">学习资料库</Badge>
              <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
                PTE 与 IELTS 提分文章
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-soft)] sm:text-base">
                汇总考试策略、题型解析、备考方法和课程建议，帮助你更清晰地规划提分路径。
              </p>
            </div>

            <Card className="rounded-[var(--radius-lg)] bg-[var(--card-soft)]">
              <CardContent className="p-4">
                <form action="/posts" className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    type="text"
                    name="q"
                    defaultValue={keyword}
                    placeholder="搜索文章..."
                    className="bg-[var(--card)]"
                  />
                  <Button type="submit" className="sm:w-auto">
                    搜索
                  </Button>
                </form>
                {keyword ? (
                  <div className="mt-3 text-sm text-[var(--text-soft)]">
                    当前搜索：
                    <span className="font-semibold text-[var(--text)]">
                      {keyword}
                    </span>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>

        {error ? (
          <Card className="mt-8 rounded-[var(--radius-lg)]">
            <CardContent>
              <p className="text-sm font-medium text-[var(--danger)]">
                文章加载失败，请稍后再试。
              </p>
            </CardContent>
          </Card>
        ) : !posts || posts.length === 0 ? (
          <Card className="mt-8 rounded-[var(--radius-lg)]">
            <CardContent>
              <p className="text-sm font-medium text-[var(--text-soft)]">
                暂无相关文章。
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              {featuredPost ? (
                <Card className="overflow-hidden rounded-[var(--radius-lg)]">
                  <Link
                    href={`/posts/${featuredPost.slug}`}
                    className="group grid gap-0 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1fr)]"
                  >
                    <div className="min-h-[260px] bg-[var(--bg-soft)]">
                      {featuredPost.cover_image ? (
                        <img
                          src={featuredPost.cover_image}
                          alt={featuredPost.title}
                          className="h-full min-h-[260px] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full min-h-[260px] items-center justify-center bg-[var(--primary-soft)] text-sm font-semibold text-[var(--primary)]">
                          Lofty 文章
                        </div>
                      )}
                    </div>

                    <CardContent className="flex flex-col justify-between p-6 sm:p-8">
                      <div>
                        <div className="mb-4 flex flex-wrap items-center gap-3">
                          <Badge variant="secondary">
                            {featuredPost.category || "文章"}
                          </Badge>
                          <span className="text-sm font-medium text-[var(--text-soft)]">
                            {formatDate(
                              featuredPost.published_at ||
                                featuredPost.created_at,
                            )}
                          </span>
                        </div>

                        <h2 className="text-2xl font-semibold leading-tight text-[var(--text)] sm:text-3xl">
                          {featuredPost.title}
                        </h2>

                        {featuredPost.excerpt ? (
                          <p className="mt-4 line-clamp-3 text-sm leading-7 text-[var(--text-soft)]">
                            {featuredPost.excerpt}
                          </p>
                        ) : null}
                      </div>

                      <span className="mt-8 inline-flex text-sm font-semibold text-[var(--primary)]">
                        阅读精选文章
                      </span>
                    </CardContent>
                  </Link>
                </Card>
              ) : null}

              <div className="grid gap-4">
                {otherPosts.map((post) => (
                  <Card
                    key={post.id}
                    className="overflow-hidden rounded-[var(--radius-lg)] hover:shadow-[var(--shadow-md)]"
                  >
                    <Link
                      href={`/posts/${post.slug}`}
                      className="group grid gap-0 sm:grid-cols-[180px_1fr]"
                    >
                      <div className="h-44 bg-[var(--bg-soft)] sm:h-full">
                        {post.cover_image ? (
                          <img
                            src={post.cover_image}
                            alt={post.title}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-[var(--primary-soft)] text-xs font-semibold text-[var(--primary)]">
                            文章
                          </div>
                        )}
                      </div>

                      <CardContent className="p-5">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <Badge variant="outline">
                            {post.category || "文章"}
                          </Badge>
                          <span className="text-xs font-medium text-[var(--text-soft)]">
                            {formatDate(post.published_at || post.created_at)}
                          </span>
                        </div>

                        <h3 className="text-lg font-semibold leading-snug text-[var(--text)]">
                          {post.title}
                        </h3>

                        {post.excerpt ? (
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--text-soft)]">
                            {post.excerpt}
                          </p>
                        ) : null}

                        <span className="mt-4 inline-flex text-sm font-semibold text-[var(--primary)]">
                          阅读文章
                        </span>
                      </CardContent>
                    </Link>
                  </Card>
                ))}
              </div>
            </div>

            <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
              <Card className="rounded-[var(--radius-lg)] bg-[var(--primary)] text-white">
                <CardHeader className="flex-col items-start gap-1">
                  <CardTitle className="text-white">免费分数评估</CardTitle>
                  <CardDescription className="text-white/75">
                    快速了解你目前的 PTE 或 IELTS 水平。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link
                    href="/pte"
                    className="inline-flex h-11 w-full items-center justify-center rounded-[var(--radius-md)] bg-white px-5 text-sm font-semibold text-[var(--primary)] transition hover:opacity-90"
                  >
                    开始测评
                  </Link>
                </CardContent>
              </Card>

              <Card className="rounded-[var(--radius-lg)]">
                <CardHeader className="flex-col items-start gap-1">
                  <CardTitle>提分课程</CardTitle>
                  <CardDescription>
                    根据目标分数选择更适合你的学习路径。
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link
                    href="/pte"
                    className="block rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--primary)]/40 hover:text-[var(--primary)]"
                  >
                    PTE 提分课程
                  </Link>
                  <Link
                    href="/ielts"
                    className="block rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--primary)]/40 hover:text-[var(--primary)]"
                  >
                    IELTS 提分课程
                  </Link>
                </CardContent>
              </Card>

              <Card className="rounded-[var(--radius-lg)]">
                <CardHeader className="flex-col items-start gap-1">
                  <CardTitle>需要学习方案？</CardTitle>
                  <CardDescription>
                    根据目标分数和考试时间制定专属计划。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link
                    href="/contact"
                    className="inline-flex h-11 w-full items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-5 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--bg-soft)]"
                  >
                    联系老师
                  </Link>
                </CardContent>
              </Card>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
