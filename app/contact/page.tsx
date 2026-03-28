import type { Metadata } from "next";
import ContactForm from "./contact-form";

export const metadata: Metadata = {
  title: "Contact | Lofty Education",
  description:
    "Contact Lofty Education / 高远教育 — bilingual English and Chinese test preparation based in Melbourne, Australia.",
};

const highlights = [
  {
    zh: "18年以上教学经验",
    en: "18+ years of teaching experience",
  },
  {
    zh: "2008年起教授雅思，后拓展至PTE",
    en: "Teaching IELTS since 2008, later expanded into PTE",
  },
  {
    zh: "中英对比教学，知其然也知其所以然",
    en: "Contrastive Chinese-English teaching for real understanding",
  },
  {
    zh: "内功与招式并重，技巧与知识结合",
    en: "A balance of fundamentals, techniques, knowledge, and strategy",
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen text-slate-900">
      <section className="border-b border-slate-200 bg-linear-to-b">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            <div>
              <div className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 shadow-sm">
                Lofty · 高远教育 · Melbourne, Australia
              </div>

              <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                高远教育
                <span className="mt-2 block text-xl font-medium text-slate-600 sm:text-2xl lg:text-3xl">
                  Lofty Education
                </span>
              </h1>

              <div className="mt-6 space-y-4 text-[15px] leading-8 text-slate-700 sm:text-base">
                <p>
                  <span className="font-semibold text-slate-950">高远教育</span>
                  （英文品牌名：
                  <span className="font-semibold text-slate-950">Lofty</span>
                  ）总部位于澳大利亚墨尔本，专注于英语考试培训与语言能力提升。
                </p>
                <p>
                  创始教师自 <span className="font-semibold text-slate-950">2008</span>{" "}
                  年起教授雅思，之后拓展至 PTE 等主流英语考试，教学经验超过
                  <span className="font-semibold text-slate-950">18 年</span>。
                </p>
                <p>
                  我们主张
                  <span className="font-semibold text-slate-950">
                    “内功与招式并重，技巧与知识结合”
                  </span>
                  ，帮助学生在提升分数的同时真正提高英语能力。
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 p-6 shadow-sm sm:p-8">
              <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                Key Highlights
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {highlights.map((item) => (
                  <div
                    key={item.en}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="text-base font-semibold text-slate-950">{item.zh}</div>
                    <div className="mt-2 text-sm leading-6 text-slate-600">{item.en}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <ContactForm />
    </main>
  );
}