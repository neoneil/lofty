import type { Metadata } from "next";

import { Badge } from "@/components/ui-v2/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-v2/card";

import ContactForm from "./contact-form";
import { BRAND_EDUCATION_CN, BRAND_NAME_CN } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Contact | Lofty Education",
  description:
    `Contact Lofty Education / ${BRAND_EDUCATION_CN} — bilingual English and Chinese test preparation based in Melbourne, Australia.`,
};

const highlights = [
  {
    zh: "18年以上教学经验",
    en: "长期深耕 PTE 与 IELTS 教学",
  },
  {
    zh: "2008年起教授雅思，2010年开始教授PTE",
    en: "熟悉不同基础学生的提分路径",
  },
  {
    zh: "老师亲历亲为，跟进学习进度",
    en: "从目标、练习到复盘持续跟进",
  },
  {
    zh: "内功与招式并重，能力与技巧结合",
    en: "语言能力、题型技巧和考试策略结合",
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] pt-14 text-[var(--text)] lg:pt-16">
      <section className="border-b border-[var(--border)] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-stretch">
            <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-sm)] sm:p-8 lg:p-10">
              <Badge variant="default">墨尔本英语考试培训</Badge>

              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
                {BRAND_EDUCATION_CN}
                <span className="mt-2 block text-xl font-medium text-[var(--text-soft)] sm:text-2xl">
                  Lofty Education
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--text-soft)] sm:text-base">
                总部位于澳大利亚墨尔本，专注于 PTE、IELTS
                等英语考试培训与语言能力提升。我们相信，真正有效的学习，不只是技巧，而是理解语言背后的逻辑。
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href="#contact-form"
                  className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary)] px-5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--primary-hover)]"
                >
                  添加微信咨询
                </a>
                <a
                  href="#contact-form"
                  className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-5 text-sm font-semibold text-[var(--text)] shadow-[var(--shadow-xs)] transition hover:bg-[var(--bg-soft)]"
                >
                  预约咨询
                </a>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  ["2008", "起教授雅思"],
                  ["18+", "年教学经验"],
                  ["PTE · IELTS", "双考试体系"],
                ].map(([value, label]) => (
                  <div
                    key={value}
                    className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4"
                  >
                    <div className="text-2xl font-semibold text-[var(--primary)]">
                      {value}
                    </div>
                    <div className="mt-1 text-sm text-[var(--text-soft)]">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Card className="rounded-[var(--radius-lg)] bg-[var(--card-soft)]">
              <CardHeader className="flex-col items-start gap-1">
                <CardTitle>为什么选择{BRAND_NAME_CN}</CardTitle>
                <CardDescription>
                  老师直接参与诊断、训练和反馈，帮助学生把练习变成可见进步。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {highlights.map((item) => (
                    <div
                      key={item.en}
                      className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-4 transition hover:shadow-[var(--shadow-sm)]"
                    >
                      <div className="text-base font-semibold text-[var(--text)]">
                        {item.zh}
                      </div>
                      <div className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                        {item.en}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <ContactForm />
    </main>
  );
}
