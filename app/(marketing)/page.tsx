import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  MessageCircle,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getRandomSlogan } from "@/lib/slogan/slogan";
import { BRAND_EDUCATION_CN } from "@/lib/brand";

const features = [
  {
    title: "名师在线授课",
    desc: "18年经验，方法实用",
    icon: GraduationCap,
  },
  {
    title: "学习数据分析",
    desc: "老师监督，解决拖延",
    icon: BarChart3,
  },
  {
    title: "AI智能练习",
    desc: "个性化推荐，高效提分",
    icon: Bot,
  },
  {
    title: "培生剑桥全真模考",
    desc: "模拟考试环境，查漏补缺",
    icon: ClipboardCheck,
  },
];

const heroHighlights = [
  {
    title: "AI 智能评测",
    desc: "PTE 雅思提分引擎",
    icon: Bot,
  },
  {
    title: "个性化学习",
    desc: "定制专属学习计划",
    icon: Target,
  },
  {
    title: "名师资源",
    desc: "经验丰富名师团队",
    icon: BookOpen,
  },
  {
    title: "高效提分",
    desc: "科学方法快速提升",
    icon: TrendingUp,
  },
];

const resources = [
  {
    title: "雅思真题库",
    desc: "历年真题及解析",
    icon: FileText,
  },
  {
    title: "PTE真题库",
    desc: "机考真题及解析",
    icon: ClipboardCheck,
  },
  {
    title: "备考指南",
    desc: "考试攻略与技巧",
    icon: BookOpen,
  },
  {
    title: "词汇资料",
    desc: "高频词汇整理",
    icon: Sparkles,
  },
  {
    title: "免费模考",
    desc: "全真模拟考试",
    icon: Target,
  },
];

const faqItems = [
  {
    question: "PTE 和雅思哪个更适合留学移民？",
    answer:
      `PTE 和雅思都可用于留学与移民申请，但不同院校、签证类型和个人英语基础适合的考试可能不同。${BRAND_EDUCATION_CN}不仅提供 PTE 与雅思的学习资源、题库训练和 AI 辅助练习，更会帮助学生找到更适合自己的备考路径。`,
  },
  {
    question: "AI 可以帮助批改雅思或 PTE 写作吗？",
    answer:
      `可以。AI 可以帮助分析写作结构、语法、词汇和逻辑表达，提供更高频、更即时的反馈。${BRAND_EDUCATION_CN}的 AI 辅助功能适合用于日常练习、改写提升和考试前复盘。`,
  },
  {
    question: "初学者可以从哪里开始准备 PTE 或雅思？",
    answer:
      "建议先了解考试结构，再从基础词汇、听说读写分项训练和真题题库练习开始。首页的考试模块与文章资源可以帮助你逐步建立清晰的学习路线。",
  },
];

export const metadata: Metadata = {
  metadataBase: new URL("https://loftypte.com.au"),
  title: `${BRAND_EDUCATION_CN} | PTE 雅思 备考学习平台`,
  description:
    `${BRAND_EDUCATION_CN}专注 PTE、雅思与英语培训，提供 AI 写作批改、口语智能练习、考试题库、留学移民英语辅导。`,
  keywords: [
    BRAND_EDUCATION_CN,
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
    title: `${BRAND_EDUCATION_CN} | PTE 雅思 AI 备考学习平台`,
    description:
      `${BRAND_EDUCATION_CN}专注 PTE、雅思与英语培训，提供 AI 写作批改、口语练习、考试题库与留学移民英语辅导。`,
    url: "https://loftypte.com.au",
    siteName: `${BRAND_EDUCATION_CN} Lofty Education`,
    locale: "zh_CN",
    type: "website",
  },
};

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-xs font-semibold text-[var(--primary)] shadow-[var(--shadow-sm)]">
        <Sparkles size={14} />
        {eyebrow}
      </div>

      <h2 className="mt-5 text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl md:text-4xl">
        {title}
      </h2>

      <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--text-soft)] sm:text-base">
        {description}
      </p>
    </div>
  );
}

function ExamCard({
  title,
  desc,
  points,
  href,
  image,
  badge,
  imageTitle,
  imageDesc,
}: {
  title: string;
  desc: string;
  points: string[];
  href: string;
  image: string;
  badge: string;
  imageTitle: string;
  imageDesc: string;
}) {
  return (
    <article className="group overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]">
      <Link href={href} className="block">
        <div
          className="relative min-h-[260px] overflow-hidden bg-cover bg-center bg-no-repeat md:min-h-[300px]"
          style={{ backgroundImage: `url(${image})` }}
        >
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/32 to-transparent" />

          <div className="relative z-10 flex min-h-[260px] max-w-[78%] flex-col justify-center px-6 py-8 md:min-h-[300px] md:px-8">
            <span className="mb-4 inline-flex w-fit items-center rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-sm">
              {badge}
            </span>

            <h3 className="text-2xl font-semibold leading-tight text-white md:text-3xl">
              {imageTitle}
            </h3>

            <p className="mt-3 max-w-sm text-sm leading-7 text-white/85">
              {imageDesc}
            </p>
          </div>
        </div>
      </Link>

      <div className="p-5 md:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-xl font-semibold tracking-tight text-[var(--text)]">
              {title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
              {desc}
            </p>

            <ul className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              {points.map((point) => (
                <li
                  key={point}
                  className="flex items-center gap-2 text-xs font-semibold text-[var(--text)]"
                >
                  <CheckCircle2 size={14} className="text-[var(--primary)]" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <Link
            href={href}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary)] px-5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--primary-hover)]"
          >
            开始学习
          </Link>
        </div>
      </div>
    </article>
  );
}

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

  const latestPosts = posts?.slice(0, 3) ?? [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: `${BRAND_EDUCATION_CN}PTE`,
    alternateName: "Lofty Education",
    url: "https://loftypte.com.au",
    description:
      `${BRAND_EDUCATION_CN}专注 PTE、雅思与英语培训，提供 AI 写作批改、口语练习、考试题库与留学移民英语辅导。`,
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
    <main className="min-h-screen overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="site-hero relative min-h-[620px] overflow-hidden rounded-b-[32px] bg-cover bg-center bg-no-repeat md:min-h-[700px] md:rounded-b-[48px]">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg)]/18 via-[var(--bg)]/8 to-transparent dark:from-white/10 dark:via-white/5" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[var(--bg)]/55 via-[var(--bg)]/16 to-transparent" />

        <div className="relative z-10 mx-auto flex min-h-[560px] max-w-7xl items-center px-4 py-16 sm:px-6 md:min-h-[640px] md:px-10">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[color:var(--card)]/86 px-4 py-2 text-xs font-semibold text-[var(--text-soft)] shadow-[var(--shadow-sm)] backdrop-blur-md dark:border-[color:var(--primary)]/35 dark:bg-[color:var(--card)]/76 dark:text-[var(--text)]">
              <Sparkles size={14} className="text-[var(--primary)]" />
              {heroSlogan}
            </div>

            <h1 className="mt-6 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-[var(--text)] drop-shadow-sm sm:text-4xl lg:text-5xl">
              PTE · 雅思
              <span className="block text-[var(--primary)]">
                系统刷题与督学提分平台
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-[var(--text-soft)] drop-shadow-sm dark:text-[var(--text)] md:text-lg">
              成绩可用于留学申请 · 澳洲工作签证 · 永居申请 · 职业注册。
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/courses"
                className="inline-flex h-12 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[color:var(--card)]/92 px-6 text-sm font-semibold text-[var(--primary)] shadow-[var(--shadow-md)] backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-[var(--card)]"
              >
                雅思课程
              </Link>

              <Link
                href="/courses"
                className="inline-flex h-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary)] px-6 text-sm font-semibold text-white shadow-[var(--shadow-md)] transition hover:-translate-y-0.5 hover:bg-[var(--primary-hover)]"
              >
                PTE课程
              </Link>
            </div>

            <div className="mt-10 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {heroHighlights.map(({ title, desc, icon: Icon }) => (
                <div
                  key={title}
                  className="group rounded-[var(--radius-md)] border border-[var(--border)] bg-[color:var(--card)]/90 p-4 shadow-[var(--shadow-sm)] backdrop-blur-md transition hover:-translate-y-1 hover:bg-[color:var(--card)]/96 hover:shadow-[var(--shadow-md)] dark:bg-white/14 dark:hover:bg-white/18"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]">
                    <Icon size={17} />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[var(--text)]">
                    {title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-20 mx-auto -mt-10 max-w-6xl px-4 sm:px-6 md:-mt-14">
        <div className="grid overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)]/95 shadow-[var(--shadow-lg)] backdrop-blur-2xl md:grid-cols-4">
          {features.map(({ title, desc, icon: Icon }, index) => (
            <div
              key={title}
              className="group relative border-b border-[var(--border)] p-5 transition hover:bg-[var(--card-hover)] md:border-b-0 md:border-r md:last:border-r-0"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)] shadow-[var(--shadow-sm)] transition group-hover:scale-105">
                  <Icon size={20} />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">
                    0{index + 1}
                  </div>
                  <h3 className="mt-1 text-sm font-semibold text-[var(--text)]">
                    {title}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">
                    {desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        <SectionHeading
          eyebrow="IELTS · PTE Academic"
          title="选择适合你的英语考试"
          description="根据你的目标、学习习惯与考试需求，选择最适合自己的英语考试与备考路径。"
        />

        <div className="relative mt-10 grid gap-6 md:mt-14 md:grid-cols-2">
          <ExamCard
            title="雅思 IELTS"
            desc="全球认可的英语能力测试"
            points={["听说读写全面提升", "丰富的学习资源", "定制化学习计划"]}
            href="/ielts"
            image="/ielts-bg.png"
            badge="IELTS"
            imageTitle="走向更广阔的世界"
            imageDesc="适合留学、移民与全球升学申请"
          />

          <ExamCard
            title="PTE Academic"
            desc="AI 驱动的智能机考训练"
            points={["机考模拟训练", "快速出分", "AI评分分析"]}
            href="/pte"
            image="/pte-bg.png"
            badge="PTE"
            imageTitle="智能机考训练"
            imageDesc="快速出分，适合高效备考人群"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 md:pb-24">
        <SectionHeading
          eyebrow="Learning Resources"
          title="网站内部备考资料与学习资源"
          description="精选题库、学习资料与模考资源，帮助你更高效地建立英语能力体系。"
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {resources.map(({ title, desc, icon: Icon }) => (
            <div
              key={title}
              className="group rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-md)]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)] shadow-[var(--shadow-sm)] transition group-hover:scale-105">
                <Icon size={19} />
              </div>
              <h3 className="mt-5 text-sm font-semibold tracking-tight text-[var(--text)]">
                {title}
              </h3>
              <p className="mt-2 text-xs leading-6 text-[var(--text-soft)]">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {latestPosts.length ? (
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 md:pb-24">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
                Articles
              </div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">
                最新备考文章
              </h2>
            </div>
            <Link
              href="/posts"
              className="inline-flex h-10 items-center gap-2 text-sm font-semibold text-[var(--primary)] transition hover:translate-x-0.5"
            >
              查看全部文章
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {latestPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/posts/${post.slug}`}
                className="group overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-md)]"
              >
                <div className="h-40 bg-[var(--bg-soft)]">
                  {post.cover_image ? (
                    <img
                      src={post.cover_image}
                      alt={post.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-[var(--primary-soft)] text-sm font-semibold text-[var(--primary)]">
                      Lofty Article
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="line-clamp-2 text-base font-semibold leading-6 text-[var(--text)]">
                    {post.title}
                  </h3>
                  {post.excerpt ? (
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--text-soft)]">
                      {post.excerpt}
                    </p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 md:pb-24">
        <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--primary)] px-6 py-12 text-center text-white shadow-[0_28px_70px_rgba(64,64,168,.24)] md:px-10 md:py-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_26%),linear-gradient(135deg,rgba(255,255,255,0.12),transparent_42%)]" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold backdrop-blur-sm">
              <Users size={14} />
              AI Learning Platform
            </div>

            <h2 className="mx-auto mt-6 max-w-3xl text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
              加入{BRAND_EDUCATION_CN}，和更多学员一起进步
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-8 text-white/85 sm:text-base">
              从 AI 智能练习、老师监督到真题训练，{BRAND_EDUCATION_CN}帮助学生建立长期、高效且可持续的学习体系。
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/sign-up"
                className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] bg-white px-7 text-sm font-semibold text-[var(--primary)] shadow-[var(--shadow-md)] transition hover:-translate-y-0.5"
              >
                立即注册
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] border border-white/25 bg-white/10 px-7 text-sm font-semibold text-white backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/15"
              >
                联系老师
              </Link>
            </div>

            <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-white/75">
              {heroSlogan}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
        <SectionHeading
          eyebrow="FAQ"
          title="常见问题"
          description="关于 PTE、雅思与 AI 学习平台的常见问题。"
        />

        <div className="mt-10 grid gap-4">
          {faqItems.map((item) => (
            <article
              key={item.question}
              className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
            >
              <div className="flex gap-4">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]">
                  <MessageCircle size={17} />
                </div>
                <div>
                  <h3 className="text-base font-semibold tracking-tight text-[var(--text)] sm:text-lg">
                    {item.question}
                  </h3>
                  <p className="mt-3 text-sm leading-8 text-[var(--text-soft)] sm:text-base">
                    {item.answer}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {canManagePosts ? (
        <div className="sr-only">Admin content tools enabled</div>
      ) : null}
    </main>
  );
}
