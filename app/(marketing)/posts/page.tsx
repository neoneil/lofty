import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Container from "@/components/site/container";

type PostsPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const { q } = await searchParams;
  const keyword = q?.trim() ?? "";

  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select("id, title, slug, excerpt, cover_image, published_at, created_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (keyword) {
    query = query.or(
      `title.ilike.%${keyword}%,excerpt.ilike.%${keyword}%`
    );
  }

  const { data: posts, error } = await query;

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      {/* HEADER */}
      <section className="px-5 pt-12 pb-6 md:pt-16 md:pb-8">
        <Container>
          <div className="max-w-3xl ml-5">
            <h1 className="text-1xl font-semibold md:text-3xl">
              PTE · IELTS Articles
            </h1>

            <p className="mt-4 text-sm text-neutral-500 md:text-base">
              提分方法 · 真题解析 · 学习策略
            </p>

            <form
              action="/posts"
              className="mt-6 flex max-w-xl items-center rounded bg-white px-4 py-2 shadow-sm"
            >
              <input
                type="text"
                name="q"
                defaultValue={keyword}
                placeholder="Search articles..."
                className="w-full bg-transparent px-3 py-3 text-sm outline-none"
              />
              <button className="rounded bg-black px-5 py-2 text-sm text-white">
                Search
              </button>
            </form>
          </div>
        </Container>
      </section>

      <section className="px-5 pb-16">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.90fr_340px]">

            {/* LEFT：文章列表 */}
            <div>
              {error ? (
                <p>加载失败</p>
              ) : !posts || posts.length === 0 ? (
                <p>没有文章</p>
              ) : (
                <div className="space-y-5">
                  {posts.map((post) => (
                    <article
                      key={post.id}
                      className="group overflow-hidden rounded bg-white p-4 shadow-sm transition hover:shadow-md"
                    >
                      <Link
                        href={`/posts/${post.slug}`}
                        className="flex gap-5"
                      >
                        {/* 图片 */}
                        {post.cover_image && (
                          <img
                            src={post.cover_image}
                            className="h-[130px] w-[200px] object-cover round transition duration-500 group-hover:scale-105"
                          />
                        )}

                        {/* 内容 */}
                        <div className="flex flex-col flex-1">
                          <h2 className="text-lg font-semibold leading-snug">
                            {post.title}
                          </h2>

                          <p className="mt-2 text-xs text-neutral-400">
                            {post.published_at
                              ? new Date(post.published_at).toLocaleDateString()
                              : ""}
                          </p>

                          {post.excerpt && (
                            <p className="mt-2 text-sm text-neutral-500 line-clamp-2">
                              {post.excerpt}
                            </p>
                          )}

                          <span className="mt-auto text-sm font-medium text-black">
                            Read →
                          </span>
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT：高转化 Sidebar */}
            <aside className="space-y-6 lg:sticky lg:top-24">

              {/* 1️⃣ 免费测评 */}
              <div className="rounded bg-black p-6 text-white shadow-lg">
                <h3 className="text-xl font-semibold">
                  免费测评你的分数
                </h3>
                <p className="mt-3 text-sm text-white/70">
                  2分钟了解你的 PTE / IELTS 当前水平
                </p>

                <Link
                  href="/pte"
                  className="mt-5 block rounded bg-white px-4 py-3 text-center text-sm font-semibold text-black"
                >
                  立即测评 →
                </Link>
              </div>

              {/* 2️⃣ 课程入口 */}
              <div className="rounded bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold">
                  提分课程
                </h3>

                <div className="mt-4 space-y-3">
                  <Link
                    href="/pte"
                    className="block rounded bg-[#f5f5f7] p-4 hover:bg-neutral-100"
                  >
                    PTE 一对一 / 小班
                  </Link>

                  <Link
                    href="/ielts"
                    className="block rounded bg-[#f5f5f7] p-4 hover:bg-neutral-100"
                  >
                    IELTS 提分课程
                  </Link>
                </div>
              </div>

              {/* 3️⃣ 信任感（很关键） */}
              <div className="rounded bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold">
                  学员成绩提升
                </h3>

                <div className="mt-4 space-y-3 text-sm text-neutral-600">
                  <p>🎯 平均提升 +15分</p>
                  <p>📈 90% 学员达标</p>
                  <p>🔥 真实学员案例持续更新</p>
                </div>
              </div>

              {/* 4️⃣ 最终 CTA */}
              <div className="rounded bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold">
                  需要专属学习方案？
                </h3>

                <p className="mt-3 text-sm text-neutral-500">
                  我们会根据你的分数和时间制定路径
                </p>

                <Link
                  href="/contact"
                  className="mt-5 block rounded bg-black px-4 py-3 text-center text-sm font-semibold text-white"
                >
                  预约咨询 →
                </Link>
              </div>

            </aside>
          </div>
        </Container>
      </section>
    </main>
  );
}