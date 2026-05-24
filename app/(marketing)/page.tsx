import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Container from "@/components/site/container";
import { getRandomSlogan } from "@/lib/slogan/slogan";
// import ExamCardsSection from "@/components/site/exam-cards-section";
import type { Metadata } from "next";
import { Bot, Target, BookOpen, TrendingUp } from "lucide-react";
const icons = ["⚡", "🎓", "📝", "📊"];
const features = [
  ["名师在线授课", "18年经验，方法实用"],
  ["学习数据分析", "老师监督，解决拖延"],
  ["AI智能练习", "个性化推荐，高效提分"],
  ["培生剑桥全真模考", "模拟考试环境，查漏补缺"],
];

const resources = [
  ["雅思真题库", "历年真题及解析"],
  ["PTE真题库", "机考真题及解析"],
  ["备考指南", "考试攻略与技巧"],
  ["词汇资料", "高频词汇整理"],
  ["免费模考", "全真模拟考试"],
];
/**
 * SEO: 首页 metadata
 * 说明：
 * 1. title 和 description 是首页最重要的 SEO 信息
 * 2. keywords 现在对 Google 影响不大，但保留无妨
 * 3. metadataBase 请替换成你的正式域名
 */
export const metadata: Metadata = {
  metadataBase: new URL("https://loftypte.com.au"),
  title: "致远教育 | PTE 雅思 备考学习平台",
  description:
    "致远教育专注 PTE、雅思与英语培训，提供 AI 写作批改、口语智能练习、考试题库、留学移民英语辅导。",
  keywords: [
    "致远教育",
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
    title: "致远教育 | PTE 雅思 AI 备考学习平台",
    description:
      "致远教育专注 PTE、雅思与英语培训，提供 AI 写作批改、口语练习、考试题库与留学移民英语辅导。",
    url: "https://loftypte.com.au",
    siteName: "致远教育 Lofty Education",
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
    name: "致远教育PTE",
    alternateName: "Lofty Education",
    url: "https://loftypte.com.au",
    description:
      "致远教育专注 PTE、雅思与英语培训，提供 AI 写作批改、口语练习、考试题库与留学移民英语辅导。",
    areaServed: "Australia",
    knowsAbout: [
      "PTE Academic",
      "IELTS",
      "English Writing",
      "English Speaking",
      "AI Assisted Learning",
    ],
  };
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
      <div className="group overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-md)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(15,23,42,.08)]">
        {/* Image */}
        <div
          className="relative h-[240px] overflow-hidden bg-cover bg-center bg-no-repeat md:h-[280px]"
          style={{ backgroundImage: `url(${image})` }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/35" />

          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />

          {/* Content */}
          <div className="relative z-10 flex h-full max-w-[76%] flex-col justify-center px-7 py-8">
            {/* Badge */}
            <div className="mb-4 inline-flex w-fit items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
              {badge}
            </div>

            {/* Title */}
            <h3 className="text-2xl font-black leading-tight text-white">
              {imageTitle}
            </h3>

            {/* Desc */}
            <p className="mt-3 text-sm leading-7 text-white/85">{imageDesc}</p>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex items-end justify-between gap-4 p-5 md:p-10">
          {/* Left */}
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-black tracking-tight text-[var(--text)]">
              {title}
            </h3>

            <p className="mt-1.5 text-sm leading-6 text-[var(--text-soft)]">
              {desc}
            </p>

            {/* Points */}
            <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              {points.map((point) => (
                <li
                  key={point}
                  className="flex items-center gap-2 text-xs font-medium text-[var(--text)]"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />

                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* Right Button */}
          <Link
            href={href}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary)] px-5 text-sm font-semibold whitespace-nowrap text-white shadow-[var(--shadow-sm)] transition-all duration-300 hover:bg-[var(--primary-hover)] hover:shadow-[var(--shadow-md)]"
          >
            开始学习
          </Link>
        </div>
      </div>
    );
  }
  return (
    <main className="min-h-screen ">
      {/* Hero */}
      <section
        className="relative min-h-[560px] overflow-hidden rounded-b-[32px] bg-cover bg-center bg-no-repeat md:min-h-[640px] md:rounded-b-[48px]"
        style={{ backgroundImage: "url('/hero4.png')" }}
      >
        {/* <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/35 to-black/10" />
        <div className="absolute inset-0 bg-black/15" /> */}

        <div className="relative z-10 mx-auto flex min-h-[460px] max-w-7xl items-center px-4 py-14 sm:px-6 md:min-h-[540px] md:px-10">
          <div className="mx-auto max-w-3xl text-center md:mx-0 md:text-left">
            <div className="mb-6 inline-flex items-center rounded border border-black/5 bg-white/70 px-4 py-2 text-xs font-medium text-gray-500 shadow-sm backdrop-blur-md">
              {heroSlogan}
            </div>
            <h1 className="text-xl font-semibold text-[--text] leading-tight drop-shadow-lg sm:text-2xl md:text-3xl lg:text-4xl">
              PTE · 雅思
              <br />
              学生系统刷题，督学全程跟踪
            </h1>

            <p className="mt-5 text-sm font-medium tracking-wide text-gray-500 drop-shadow-md md:text-lg">
              成绩可用于留学申请· 澳洲工作签证 · 永居申请 · 和职业注册
            </p>
            <div className="mt-14 grid max-w-4xl grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-gray-200 bg-white/70 shadow-sm backdrop-blur-md">
                  <Bot className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    AI 智能评测
                  </p>
                  <p className="mt-1 text-xs text-gray-500">PTE 雅思提分引擎</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-gray-200 bg-white/70 shadow-sm backdrop-blur-md">
                  <Target className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    个性化学习
                  </p>
                  <p className="mt-1 text-xs text-gray-500">定制专属学习计划</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-gray-200 bg-white/70 shadow-sm backdrop-blur-md">
                  <BookOpen className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    名师资源
                  </p>
                  <p className="mt-1 text-xs text-gray-500">经验丰富名师团队</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-gray-200 bg-white/70 shadow-sm backdrop-blur-md">
                  <TrendingUp className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    高效提分
                  </p>
                  <p className="mt-1 text-xs text-gray-500">科学方法快速提升</p>
                </div>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:flex sm:justify-center md:justify-start">
              <Link
                href="/courses"
                className="rounded bg-white/90 px-6 py-3 text-center text-sm font-semibold text-(--brand-accent) shadow-lg transition hover:-translate-y-0.5 hover:bg-white"
              >
                雅思课程
              </Link>

              <Link
                href="/courses"
                className="rounded bg-[#4040A8] px-6 py-3 text-center text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5"
              >
                PTE课程
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-20 mx-auto -mt-8 max-w-6xl px-4 sm:px-6 md:-mt-12">
        <div className="relative overflow-hidden rounded-[32px] border border-[var(--border)] bg-[var(--card)]/92 shadow-[var(--shadow-lg)] backdrop-blur-2xl">
          {/* 背景光晕 */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(109,93,252,0.10),transparent_24%),radial-gradient(circle_at_left,rgba(124,58,237,0.06),transparent_18%)]" />

          <div className="relative grid grid-cols-2 md:grid-cols-4">
            {features.map(([title, desc], index) => (
              <div
                key={title}
                className="group relative px-4 py-6 text-center transition-all duration-300 hover:bg-[var(--card-hover)] md:px-6 md:py-8"
              >
                {/* 分割线 */}
                {index !== features.length - 1 && (
                  <div className="absolute right-0 top-1/2 hidden h-[58%] w-px -translate-y-1/2 bg-[var(--border)] md:block" />
                )}

                {/* Icon */}
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-xl shadow-[var(--shadow-sm)] transition-all duration-300 group-hover:scale-105 group-hover:shadow-[var(--shadow-md)]">
                  <span className="transition-all duration-300 group-hover:scale-110">
                    {icons[index]}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold tracking-tight text-[var(--text)] md:text-base">
                  {title}
                </h3>

                {/* Desc */}
                <p className="mt-2 text-xs leading-6 text-[var(--text-soft)] md:text-sm">
                  {desc}
                </p>

                {/* Hover Glow */}
                <div className="pointer-events-none absolute inset-x-6 bottom-0 h-px scale-x-0 bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent opacity-0 transition-all duration-300 group-hover:scale-x-100 group-hover:opacity-100" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* IELTS / PTE Choice */}

      <section className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-24">
        <div className="relative text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-xs font-semibold text-[var(--primary)] shadow-[var(--shadow-sm)]">
            <span className="text-sm">✦</span>
            English Test Preparation
          </div>

          {/* Title */}
          <div className="mt-5">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">
              IELTS · PTE Academic
            </div>

            <h2 className="text-2xl font-black tracking-tight text-[var(--text)] sm:text-3xl md:text-4xl">
              选择适合你的英语考试
            </h2>
          </div>

          {/* Description */}
          <p className="mx-auto mt-5 max-w-[620px] text-sm leading-7 text-[var(--text-soft)] sm:text-base">
            根据你的目标、学习习惯与考试需求，
            选择最适合自己的英语考试与备考路径。
          </p>
        </div>

        {/* Cards */}
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
{/* Resources */}
<section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 md:pb-20">
  
  {/* Header */}
  <div className="text-center">
    
    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-xs font-semibold text-[var(--primary)] shadow-[var(--shadow-sm)]">
      <span className="text-sm">✦</span>
      Learning Resources
    </div>

    <div className="mt-5">
      <div className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">
        IELTS · PTE Academic
      </div>

      <h2 className="text-2xl font-black tracking-tight text-[var(--text)] sm:text-3xl md:text-4xl">
        网站内部备考资料与学习资源
      </h2>
    </div>

    <p className="mx-auto mt-5 max-w-[620px] text-sm leading-7 text-[var(--text-soft)] sm:text-base">
      精选题库、学习资料与模考资源，
      帮助你更高效地建立英语能力体系。
    </p>
  </div>

  {/* Resource Grid */}
  <div className="mt-10 overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-lg)]">
    <div className="grid grid-cols-2 md:grid-cols-5">
      {resources.map(([title, desc], index) => (
        <div
          key={title}
          className="group relative px-4 py-6 text-center transition-all duration-300 hover:bg-[var(--card-hover)] md:px-5 md:py-7"
        >
          {/* Divider */}
          {index !== resources.length - 1 && (
            <div className="absolute right-0 top-1/2 hidden h-[55%] w-px -translate-y-1/2 bg-[var(--border)] md:block" />
          )}

          {/* Icon */}
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-lg shadow-[var(--shadow-sm)] transition-all duration-300 group-hover:scale-105 group-hover:shadow-[var(--shadow-md)]">
            📄
          </div>

          {/* Title */}
          <h3 className="text-sm font-bold tracking-tight text-[var(--text)]">
            {title}
          </h3>

          {/* Desc */}
          <p className="mt-2 text-xs leading-6 text-[var(--text-soft)]">
            {desc}
          </p>

          {/* Hover Line */}
          <div className="pointer-events-none absolute inset-x-6 bottom-0 h-px scale-x-0 bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent opacity-0 transition-all duration-300 group-hover:scale-x-100 group-hover:opacity-100" />
        </div>
      ))}
    </div>
  </div>
</section>

{/* CTA */}
<section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 md:pb-24">
  <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-r from-[var(--primary)] via-[#7C6BFF] to-[#A78BFA] px-6 py-12 text-center text-white shadow-[0_30px_60px_rgba(109,93,252,.20)] md:px-10 md:py-14">

    {/* Light */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_28%)]" />

    <div className="relative z-10">
      
      {/* Badge */}
      <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold backdrop-blur-sm">
        <span>✦</span>
        AI Learning Platform
      </div>

      {/* Title */}
      <h2 className="mx-auto mt-6 max-w-[760px] text-3xl font-black leading-tight tracking-tight md:text-5xl">
        加入致远教育
        <br className="hidden md:block" />
        和更多学员一起进步
      </h2>

      {/* Desc */}
      <p className="mx-auto mt-5 max-w-[620px] text-sm leading-8 text-white/85 sm:text-base">
        从 AI 智能练习、老师监督到真题训练，
        致远教育帮助学生建立长期、高效且可持续的学习体系。
      </p>

      {/* CTA */}
      <div className="mt-8 flex justify-center">
        <Link
          href="/sign-up"
          className="inline-flex h-11 items-center justify-center rounded-[var(--radius-sm)] bg-white px-7 text-sm font-bold text-[var(--primary)] shadow-[var(--shadow-md)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(255,255,255,.18)]"
        >
          立即注册
        </Link>
      </div>

      {/* Slogan */}
      <p className="mx-auto mt-6 max-w-[520px] text-sm leading-7 text-white/75 sm:text-base">
        {heroSlogan}
      </p>
    </div>
  </div>
</section>

{/* FAQ */}
<section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
  
  {/* Header */}
  <div className="text-center">
    
    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-xs font-semibold text-[var(--primary)] shadow-[var(--shadow-sm)]">
      <span className="text-sm">✦</span>
      FAQ
    </div>

    <h2 className="mt-5 text-3xl font-black tracking-tight text-[var(--text)] md:text-4xl">
      常见问题
    </h2>

    <p className="mx-auto mt-4 max-w-[560px] text-sm leading-7 text-[var(--text-soft)] sm:text-base">
      关于 PTE、雅思与 AI 学习平台的常见问题。
    </p>
  </div>

  {/* FAQ Cards */}
  <div className="mt-10 grid gap-5 sm:gap-6">
    
    <article className="rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-md)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]">
      <h3 className="mb-3 text-lg font-bold tracking-tight text-[var(--primary)]">
        PTE 和雅思哪个更适合留学移民？
      </h3>

      <p className="text-sm leading-8 text-[var(--text-soft)] sm:text-base">
        PTE 和雅思都可用于留学与移民申请，但不同院校、
        签证类型和个人英语基础适合的考试可能不同。
        致远教育不仅提供 PTE 与雅思的学习资源、题库训练和 AI 辅助练习，
        更会帮助学生找到更适合自己的备考路径。
      </p>
    </article>

    <article className="rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-md)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]">
      <h3 className="mb-3 text-lg font-bold tracking-tight text-[var(--primary)]">
        AI 可以帮助批改雅思或 PTE 写作吗？
      </h3>

      <p className="text-sm leading-8 text-[var(--text-soft)] sm:text-base">
        可以。AI 可以帮助分析写作结构、语法、词汇和逻辑表达，
        提供更高频、更即时的反馈。
        致远教育的 AI 辅助功能适合用于日常练习、
        改写提升和考试前复盘。
      </p>
    </article>

    <article className="rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-md)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]">
      <h3 className="mb-3 text-lg font-bold tracking-tight text-[var(--primary)]">
        初学者可以从哪里开始准备 PTE 或雅思？
      </h3>

      <p className="text-sm leading-8 text-[var(--text-soft)] sm:text-base">
        建议先了解考试结构，再从基础词汇、
        听说读写分项训练和真题题库练习开始。
        首页的考试模块与文章资源可以帮助你逐步建立清晰的学习路线。
      </p>
    </article>
  </div>
</section>
    </main>
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
    <div className="overflow-hidden round bg-white shadow-lg transition hover:-translate-y-1 hover:shadow-2xl md:round">
      <div
        className="relative h-[260px] w-full overflow-hidden bg-cover bg-center bg-no-repeat md:h-[280px]"
        style={{ backgroundImage: `url(${image})` }}
      >
        {/* 更深的 overlay，解决白色文字看不清的问题 */}
        <div className="absolute inset-0 bg-black/25" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/25 to-transparent" />

        <div className="relative z-10 flex h-full max-w-[72%] flex-col justify-center px-7 py-8 md:px-8">
          <span className="mb-4 inline-flex w-fit rounded border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-sm">
            {badge}
          </span>

          <h3 className="text-xl font-semibold leading-tight text-white drop-shadow-lg md:text-2xl">
            {imageTitle}
          </h3>

          <p className="mt-3 max-w-[280px] text-sm leading-relaxed text-white/90 drop-shadow-md">
            {imageDesc}
          </p>
        </div>
      </div>

      <div className="p-5 md:p-7">
        <h3 className="text-xl font-bold text-[#4040A8] md:text-2xl">
          {title}
        </h3>
        <p className="mt-2 text-sm text-[#5E638B]">{desc}</p>

        <ul className="mt-5 space-y-3">
          {points.map((item) => (
            <li
              key={item}
              className="flex items-center gap-3 text-sm text-[#5E638B]"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#EEEAFE] text-xs text-[#746BFF]">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>

        <Link
          href={href}
          className="mt-6 inline-flex rounded border border-[#B9B5FF] px-5 py-2 text-sm font-semibold text-[#5A55D6] transition hover:bg-[#EEEAFE]"
        >
          了解更多 →
        </Link>
      </div>
    </div>
  );
}
