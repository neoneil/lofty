
import type { Metadata } from "next";
import "./globals.css";

import { Analytics } from "@vercel/analytics/next";

import ChatWidget from "@/components/chat/ChatWidget";

import { DictionaryProvider } from "@/components/dictionary/dictionary-context";
import DictionaryPopup from "@/components/dictionary/dictionary-popup";

import SearchProvider from "@/components/search/search-provider";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.loftypte.com.au"),
  title: {
    default: "致远英语|雅思 PTE 英语提分平台",
    template: "%s|致远英语",
  },

  description:
    "致远英语专注雅思 IELTS、PTE 考试培训与英语能力提升，提供写作批改、口语练习、阅读听力题库、AI 智能评分和在线精品课程。",

  keywords: [
    "致远英语",
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

  authors: [{ name: "致远英语" }],
  creator: "致远英语",
  publisher: "致远英语",

  openGraph: {
    title: "致远英语｜雅思 PTE 英语提分平台",
    description:
      "专注雅思与 PTE 提分，AI 智能评分 + 专业课程，帮助学生高效提分。",
    url: "https://www.loftypte.com.au",
    siteName: "致远英语",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="zh-CN" data-scroll-behavior="smooth">

      <body className="min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased">

        <div className="fixed-bg" />

        <DictionaryProvider>

          <SearchProvider>

            {children}

            <DictionaryPopup />

          </SearchProvider>

        </DictionaryProvider>

        <ChatWidget />

        <Analytics />

      </body>

    </html>
  );

}


// import type { Metadata } from "next";
// import "./globals.css";
// import Navbar from "@/components/site/navbar";
// import Footer from "@/components/site/footer";
// import { Analytics } from "@vercel/analytics/next";
// import ChatWidget from "@/components/chat/ChatWidget";
// import { DictionaryProvider } from "@/components/dictionary/dictionary-context";
// import DictionaryPopup from "@/components/dictionary/dictionary-popup";
// import SearchProvider from "@/components/search/search-provider";
// export const metadata: Metadata = {
//   metadataBase: new URL("https://www.loftypte.com.au"),
//   title: {
//     default: "致远英语|雅思 PTE 英语提分平台",
//     template: "%s|致远英语",
//   },

//   description:
//     "致远英语专注雅思 IELTS、PTE 考试培训与英语能力提升，提供写作批改、口语练习、阅读听力题库、AI 智能评分和在线精品课程。",

//   keywords: [
//     "致远英语",
//     "雅思",
//     "IELTS",
//     "PTE",
//     "雅思培训",
//     "PTE培训",
//     "雅思写作",
//     "雅思口语",
//     "英语学习",
//     "留学英语",
//     "墨尔本雅思",
//     "在线英语课程",
//   ],

//   authors: [{ name: "致远英语" }],
//   creator: "致远英语",
//   publisher: "致远英语",

//   openGraph: {
//     title: "致远英语｜雅思 PTE 英语提分平台",
//     description:
//       "专注雅思与 PTE 提分，AI 智能评分 + 专业课程，帮助学生高效提分。",
//     url: "https://www.loftypte.com.au",
//     siteName: "致远英语",
//     locale: "zh_CN",
//     type: "website",
//   },

//   robots: {
//     index: true,
//     follow: true,
//   },

//   icons: {
//     icon: [
//       { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
//       { url: "/favicon-64x64.png", sizes: "64x64", type: "image/png" },
//     ],
//     shortcut: "/favicon-32x32.png",
//     apple: "/favicon-32x32.png",
//   },
// };

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <html lang="zh-CN">
//       <body className="min-h-screen antialiased bg-[var(--bg)] text-[var(--text)]">
//         <div className="fixed-bg" />

//         <div className="relative z-10 flex min-h-screen flex-col">
//           <Navbar />
//           <div className="pointer-events-none fixed left-0 top-0 z-40 h-25 w-full bg-gradient-to-b from-white via-white/100 to-transparent" />
//           <div className="flex-1 pt-14 lg:pt-16">
//             <DictionaryProvider>
//               <SearchProvider>
//                 {children}
//                 <DictionaryPopup />
//               </SearchProvider>
//             </DictionaryProvider>
//             <ChatWidget />
//           </div>
//           <Footer />
//         </div>
//         <Analytics />
//       </body>
//     </html>
//   );
// }
