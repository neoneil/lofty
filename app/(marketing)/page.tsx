import type { Metadata } from "next";

import LiteOrbitalHome from "@/components/site/lite-orbital-home";
import { BRAND_EDUCATION_CN } from "@/lib/brand";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.loftypte.com.au"),
  title: `${BRAND_EDUCATION_CN} | IELTS PTE AI 学习中心`,
  description:
    `${BRAND_EDUCATION_CN}提供 IELTS、PTE 题库、AI 练习、课程与付费会员服务。`,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${BRAND_EDUCATION_CN} | IELTS PTE AI 学习中心`,
    description: "进入小马哥教育 IELTS / PTE / AI 学习中心。",
    url: "https://www.loftypte.com.au",
    siteName: `${BRAND_EDUCATION_CN} Lofty Education`,
    locale: "zh_CN",
    type: "website",
  },
};

export default function HomePage() {
  return <LiteOrbitalHome />;
}
