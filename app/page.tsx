
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Container from "@/components/site/container";
import { getRandomSlogan } from "@/lib/slogan/slogan";
import ExamCardsSection from "@/components/site/exam-cards-section";
import type { Metadata } from "next";

/**
 * SEO: 首页 metadata
 * 说明：
 * 1. title 和 description 是首页最重要的 SEO 信息
 * 2. keywords 现在对 Google 影响不大，但保留无妨
 * 3. metadataBase 请替换成你的正式域名
 */
export const metadata: Metadata = {
  metadataBase: new URL("https://yourdomain.com"),
  title: "高远教育 | PTE 雅思 AI 学习平台",
  description:
    "高远教育专注 PTE、雅思与英语培训，提供 AI 写作批改、口语练习、考试题库、留学移民英语辅导。",
  keywords: [
    "高远教育",
    "Lofty Education",
    "PTE",
    "雅思",
    "IELTS",
    "英语培训",
    "PTE题库",
    "雅思题库",
    "AI写作批改",
    "英语口语练习",
    "留学移民英语",
    "墨尔本英语培训",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "高远教育 | PTE 雅思 AI 学习平台",
    description:
      "高远教育专注 PTE、雅思与英语培训，提供 AI 写作批改、口语练习、考试题库与留学移民英语辅导。",
    url: "https://yourdomain.com",
    siteName: "高远教育 Lofty Education",
    locale: "zh_CN",
    type: "website",
  },
};

export default async function HomePage() {
  const supabase = await createClient();
  const heroSlogan = getRandomSlogan();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    role = profile?.role ?? null;
  }

  const canManagePosts = role === "admin" || role === "editor";

  const { data: posts } = await supabase
    .from("posts")
    .select("title, slug, excerpt, published_at, cover_image")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(50);

  /**
   * SEO: 结构化数据（JSON-LD）
   * 说明：
   * 1. 帮助搜索引擎理解你的网站是教育品牌/学习平台
   * 2. url / logo / sameAs 这些以后都可以继续补
   */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "高远教育",
    alternateName: "Lofty Education",
    url: "https://yourdomain.com",
    description:
      "高远教育专注 PTE、雅思与英语培训，提供 AI 写作批改、口语练习、考试题库与留学移民英语辅导。",
    areaServed: "Australia",
    knowsAbout: [
      "PTE Academic",
      "IELTS",
      "English Writing",
      "English Speaking",
      "AI Assisted Learning",
    ],
  };

  return (
    <main className="py-12 sm:py-16 lg:py-20">
      {/* SEO: JSON-LD 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Container>
        {/* Hero 区域 */}
        <section className="mb-14 sm:mb-16">
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-(--theme) sm:text-sm">
              澳洲高远教育品牌
            </p>

            {/* 
              SEO: H1 固定核心关键词
              原来 H1 是随机 slogan，不利于首页关键词稳定识别
              现在改成固定核心词，随机 slogan 放到下面作为副标题
            */}
            <h1 className="mb-5 text-base font-medium leading-snug tracking-normal sm:text-xl lg:text-2xl text-(--theme)">
              澳洲墨尔本 PTE 与雅思 AI 学习平台
            </h1>

            {/* 
              SEO: 随机 slogan 放副标题
              这样既保留品牌感，也不影响 H1 的 SEO 稳定性
            */}
            <p className="mb-5 text-sm leading-7 text-(--theme) sm:text-base sm:leading-8">
              {heroSlogan}
            </p>

            {/* 
              SEO: 首页描述文案更明确地覆盖关键词
              包含 PTE / IELTS / AI / 留学移民 / 英语培训 等关键词
            */}
            <p className="max-w-2xl text-base leading-7 text-(--theme) sm:text-lg sm:leading-8">
              高远教育专注于 PTE Academic、雅思 IELTS、英语写作批改、
              口语提升及留学移民考试培训，为澳洲学生和移民申请者提供
              AI 智能学习平台与系统化备考资源。
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {/* 
                SEO: CTA 文案更符合搜索意图
                原本是 Browse Posts，现在更像落地页按钮
              */}
              <Link href="/ielts" className="btn-primary">
                开启 雅思/PTE 学习之旅
              </Link>

              {/* 保留管理员写文章逻辑 */}
              {canManagePosts && (
                <Link href="/admin/posts/new" className="btn-secondary rounded-2xl">
                  执笔
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* 考试卡片区域：保留原逻辑 */}
        <ExamCardsSection />

        {/* 最新文章区域 */}
        <section>
          <div className="mb-6 flex items-center justify-between sm:mb-8">
            {/* SEO: H2 中英结合，更利于双语搜索 */}
            <h2 className="text-xl font-semibold sm:text-2xl">
              最新文章 Latest Articles
            </h2>

            <Link
              href="/posts"
              className="text-sm text-(--theme) hover:text-black"
            >
              View all →
            </Link>
          </div>

          {!posts || posts.length === 0 ? (
            <p className="text-(--theme)">No published posts yet.</p>
          ) : (
            <div className="grid gap-5 sm:gap-6 md:grid-cols-2">
              {posts.map((post) => (
                <article key={post.slug} className="card overflow-hidden">
                  {post.cover_image && (
                    <Link href={`/posts/${post.slug}`}>
                      {/* 
                        SEO: 图片 alt 更具体
                        原本 alt={post.title} 已经不错
                        现在补上品牌与主题，更利于图片搜索理解
                      */}
                      <img
                        src={post.cover_image}
                        alt={`${post.title} - 高远教育 PTE 雅思文章`}
                        className="aspect-video w-full object-cover rounded-sm"
                      />
                    </Link>
                  )}

                  <p className="mb-3 text-sm text-(--theme)">
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString()
                      : ""}
                  </p>

                  {/* 
                    SEO: H3 结构保留
                    文章标题链接本身很有利于内链和抓取
                  */}
                  <h3 className="mb-3 text-xl font-semibold leading-tight sm:text-2xl">
                    <Link
                      href={`/posts/${post.slug}`}
                      className="hover:underline"
                    >
                      {post.title}
                    </Link>
                  </h3>

                  {post.excerpt && (
                    <p className="mb-5 text-sm leading-7 text-(--theme) sm:text-base">
                      {post.excerpt}
                    </p>
                  )}

                  <Link
                    href={`/posts/${post.slug}`}
                    className="text-sm font-medium text-(--theme) hover:underline"
                  >
                    Read article →
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* 
          SEO: FAQ 区块
          这是教育站非常有效的长尾关键词区域
          可以逐步扩展成更多问题
        */}
        <section className="mt-16 sm:mt-20">
          <div className="mb-6">
            <h2 className="text-xl font-semibold sm:text-2xl text-(--theme)">
              常见问题 FAQ
            </h2>
          </div>

          <div className="grid gap-5 sm:gap-6">
            <article className="card">
              <h3 className="mb-2 text-lg font-semibold text-(--theme)">
                PTE 和雅思哪个更适合留学移民？
              </h3>
              <p className="text-sm leading-7 text-(--theme) sm:text-base">
                PTE 和雅思都可用于留学与移民申请，但不同院校、签证类型
                和个人英语基础适合的考试可能不同。高远教育不仅提供 PTE 与
                雅思的学习资源、题库训练和 AI 辅助练习，更会帮助学生找到更适合自己的备考路径，和鞭策驱动力。
              </p>
            </article>

            <article className="card">
              <h3 className="mb-2 text-lg font-semibold text-(--theme)">
                AI 可以帮助批改雅思或 PTE 写作吗？
              </h3>
              <p className="text-sm leading-7 text-(--theme) sm:text-base">
                可以。AI 可以帮助分析写作结构、语法、词汇和逻辑表达，
                提供更高频、更即时的反馈。高远教育的 AI 辅助功能适合
                用于日常练习、改写提升和考试前复盘。
              </p>
            </article>

            <article className="card">
              <h3 className="mb-2 text-lg font-semibold text-(--theme)">
                初学者可以从哪里开始准备 PTE 或雅思？
              </h3>
              <p className="text-sm leading-7 text-(--theme) sm:text-base">
                建议先了解考试结构，再从基础词汇、听说读写分项训练和
                真题题库练习开始。首页的考试模块与文章资源可以帮助你
                逐步建立清晰的学习路线。
              </p>
            </article>
          </div>
        </section>
      </Container>
    </main>
  );
}



// import Link from "next/link";
// import { createClient } from "@/lib/supabase/server";
// import Container from "@/components/site/container";
// import { getRandomSlogan } from "@/lib/slogan/slogan"
// import ExamCardsSection from "@/components/site/exam-cards-section";
// export default async function HomePage() {
//   const supabase = await createClient();
//   const heroSlogan = getRandomSlogan();
//   const {
//     data: { user },
//   } = await supabase.auth.getUser();

//   let role: string | null = null;

//   if (user) {
//     const { data: profile } = await supabase
//       .from("profiles")
//       .select("role")
//       .eq("id", user.id)
//       .single();

//     role = profile?.role ?? null;
//   }

//   const canManagePosts = role === "admin" || role === "editor";

//   const { data: posts } = await supabase
//     .from("posts")
//     .select("title, slug, excerpt, published_at, cover_image")
//     .eq("status", "published")
//     .order("published_at", { ascending: false })
//     .limit(6);

//   return (
//     <main className="py-12 sm:py-16 lg:py-20">
//       <Container>

//         <section className="mb-14 sm:mb-16">
//           <div className="max-w-3xl">
//             <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-(--theme) sm:text-sm">
//               澳洲高远教育品牌
//             </p>

//             <h1 className="mb-5 text-base font-medium leading-snug tracking-normal sm:text-xl lg:text-2xl">
//               {heroSlogan}
//             </h1>

//             <p className="max-w-2xl text-base leading-7 text-gray-600 sm:text-lg sm:leading-8">
//               致力于PTE, 雅思, 英语培训, 帮助您扫清留学移民的英语障碍
//             </p>

//             <div className="mt-8 flex flex-wrap gap-3">
//               <Link
//                 href="/posts"
//                 className="btn-primary"
//               >
//                 Browse Posts
//               </Link>

//               {canManagePosts && (
//                 <Link
//                   href="/admin/posts/new"
//                   className="btn-secondary"
//                 >
//                   Write Post
//                 </Link>
//               )}
//             </div>
//           </div>
//         </section>
       
      
//                 <ExamCardsSection />
   
//         <section>
//           <div className="mb-6 flex items-center justify-between sm:mb-8">
//             <h2 className="text-xl font-semibold sm:text-2xl">Latest Posts</h2>

//             <Link
//               href="/posts"
//               className="text-sm text-(--theme) hover:text-black"
//             >
//               View all →
//             </Link>
//           </div>

//           {!posts || posts.length === 0 ? (
//             <p className="text-(--theme)">No published posts yet.</p>
//           ) : (
//             <div className="grid gap-5 sm:gap-6 md:grid-cols-2">
//               {posts.map((post) => (
//                 <article
//                   key={post.slug}
//                   className="card overflow-hidden"
//                 >

//                   {post.cover_image && (
//                     <Link href={`/posts/${post.slug}`}>
//                       <img
//                         src={post.cover_image}
//                         alt={post.title}
//                         className="aspect-video w-full object-cover rounded-sm"
//                       />
//                     </Link>
//                   )}
//                   <p className="mb-3 text-sm text-(--theme)">
//                     {post.published_at
//                       ? new Date(post.published_at).toLocaleDateString()
//                       : ""}
//                   </p>

//                   <h3 className="mb-3 text-xl font-semibold leading-tight sm:text-2xl">
//                     <Link href={`/posts/${post.slug}`} className="hover:underline">
//                       {post.title}
//                     </Link>
//                   </h3>

//                   {post.excerpt && (
//                     <p className="mb-5 text-sm leading-7 text-gray-600 sm:text-base">
//                       {post.excerpt}
//                     </p>
//                   )}

//                   <Link
//                     href={`/posts/${post.slug}`}
//                     className="text-sm font-medium text-black hover:underline"
//                   >
//                     Read article →
//                   </Link>
//                 </article>
//               ))}
//             </div>
//           )}
//         </section>
//       </Container>
//     </main>
//   );
// }
