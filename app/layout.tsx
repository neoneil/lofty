import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/site/navbar";
import Footer from "@/components/site/footer";
import { Analytics } from "@vercel/analytics/next";
import ChatWidget from '@/components/chat/ChatWidget';
export const metadata: Metadata = {
  metadataBase: new URL("https://www.gaoyuanenglish.com"),
  title: {
    default: "高远英语|雅思 PTE 英语提分平台",
    template: "%s|高远英语",
  },

  description: "高远英语专注雅思 IELTS、PTE 考试培训与英语能力提升，提供写作批改、口语练习、阅读听力题库、AI 智能评分和在线精品课程。",

  keywords: [
    "高远英语",
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

  authors: [{ name: "高远英语" }],
  creator: "高远英语",
  publisher: "高远英语",

  openGraph: {
    title: "高远英语｜雅思 PTE 英语提分平台",
    description:
      "专注雅思与 PTE 提分，AI 智能评分 + 专业课程，帮助学生高效提分。",
    url: "https://www.gaoyuanenglish.com",
    siteName: "高远英语",
    locale: "zh_CN",
    type: "website",
  },

  robots: {
    index: true,
    follow: true,
  },

  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen text-gray-900 antialiased" style={{
        background: "var(--bg)",
        color: "var(--text)"
      }}>

        <div className="fixed-bg" />

        <div className="relative z-10 flex min-h-screen flex-col">

          <Navbar />
          <div className="flex-1">
            {children}
            <ChatWidget />
          </div>
          <Footer />
        </div>
        <Analytics />
      </body>
    </html>
  );
}