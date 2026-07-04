
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

import { Analytics } from "@vercel/analytics/next";

import { DictionaryProvider } from "@/components/dictionary/dictionary-context";
// import AuthDebug from "@/components/debug/auth-debug";
import LazyGlobalWidgets from "@/components/lazy-global-widgets";
import SearchProvider from "@/components/search/search-provider";
import { BRAND_ENGLISH_CN } from "@/lib/brand";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-latin",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.loftypte.com.au"),
  title: {
    default: `${BRAND_ENGLISH_CN}|雅思 PTE 英语提分平台`,
    template: `%s|${BRAND_ENGLISH_CN}`,
  },

  description:
    `${BRAND_ENGLISH_CN}专注雅思 IELTS、PTE 考试培训与英语能力提升，提供写作批改、口语练习、阅读听力题库、AI 智能评分和在线精品课程。`,

  keywords: [
    BRAND_ENGLISH_CN,
    "雅思",
    "IELTS",
    "PTE",
    "雅思培训",
    "PTE培训",
    "雅思写作",
    "雅思口语",
    "英语学习",
    "留学英语",
    "墨尔本雅思",
    "在线英语课程",
  ],

  authors: [{ name: BRAND_ENGLISH_CN }],
  creator: BRAND_ENGLISH_CN,
  publisher: BRAND_ENGLISH_CN,

  openGraph: {
    title: `${BRAND_ENGLISH_CN}｜雅思 PTE 英语提分平台`,
    description:
      "专注雅思与 PTE 提分，AI 智能评分 + 专业课程，帮助学生高效提分。",
    url: "https://www.loftypte.com.au",
    siteName: BRAND_ENGLISH_CN,
    locale: "zh_CN",
    type: "website",
  },

  robots: {
    index: true,
    follow: true,
  },

  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-64x64.png", sizes: "64x64", type: "image/png" },
    ],
    shortcut: "/favicon-32x32.png",
    apple: "/favicon-32x32.png",
  },
};

function ThemeScript() {
  const script = `
(() => {
  try {
    const storedTheme = window.localStorage.getItem("lofty-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = storedTheme || (prefersDark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document.documentElement.style.setProperty("--hero-image", theme === "dark" ? "url('/hero_dark.png')" : "url('/hero4.png')");
  } catch {}
})();
`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="zh-CN" data-scroll-behavior="smooth" suppressHydrationWarning>

      <body
        className={`${plusJakartaSans.variable} min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased`}
      >
        <ThemeScript />
        {/* <AuthDebug /> */}
        <div className="fixed-bg" />

        <DictionaryProvider>

          <SearchProvider>

            {children}

            <LazyGlobalWidgets />

          </SearchProvider>

        </DictionaryProvider>

        <Analytics />

      </body>

    </html>
  );

}
