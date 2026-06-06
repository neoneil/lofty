import type { Metadata } from "next";
import ContactForm from "./contact-form";

export const metadata: Metadata = {
  title: "Contact | Lofty Education",
  description:
    "Contact Lofty Education / 致远教育 — bilingual English and Chinese test preparation based in Melbourne, Australia.",
};

const highlights = [
  {
    zh: "18年以上教学经验",
    en: "18+ years of teaching experience",
  },
  {
    zh: "2008年起教授雅思，2010年开始教授PTE",
    en: "Teaching IELTS since 2008, later expanded into PTE",
  },
  {
    zh: "老师亲历亲为，跟进学习进度",
    en: "Hands-on teaching with close progress tracking",
  },
  {
    zh: "内功与招式并重，能力与技巧结合",
    en: "Fundamentals, techniques, knowledge, and strategy",
  },
];

const cardStyle = {
  borderColor: "var(--border)",
  background: "var(--card)",
  boxShadow: "var(--shadow-md)",
};

const softCardStyle = {
  borderColor: "var(--border)",
  background: "var(--bg-soft)",
};

const primaryButtonClass =
  "inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] px-5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--primary-hover)] hover:shadow-[var(--shadow-md)]";

const secondaryButtonClass =
  "inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] border px-5 text-sm font-semibold shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--bg-soft)] hover:shadow-[var(--shadow-md)]";

export default function ContactPage() {
  return (
    <main
      className="min-h-screen overflow-hidden"
      style={{
        background: "var(--bg)",
        color: "var(--text)",
      }}
    >
      <section
        className="relative border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="max-w-3xl">
              <div
                className="inline-flex items-center rounded-[var(--radius-sm)] border px-4 py-2 text-sm font-medium shadow-[var(--shadow-sm)]"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--card)",
                  color: "var(--text-soft)",
                }}
              >
                Lofty · 致远教育 · Melbourne, Australia
              </div>

              <h1 className="mt-7 text-3xl font-semibold tracking-tight sm:text-5xl lg:text-4xl">
                致远教育
                <span
                  className="mt-3 block text-xl font-medium sm:text-2xl lg:text-3xl"
                  style={{ color: "var(--text-soft)" }}
                >
                  Lofty Education
                </span>
              </h1>

              <p
                className="mt-7 max-w-2xl text-base leading-8 sm:text-lg"
                style={{ color: "var(--text-soft)" }}
              >
                总部位于澳大利亚墨尔本，专注于 PTE、IELTS
                等英语考试培训与语言能力提升。我们相信，真正有效的学习，不只是技巧，而是理解语言背后的逻辑。
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#contact-form"
                  className={primaryButtonClass}
                  style={{
                    background: "var(--primary)",
                  }}
                >
                  添加微信
                </a>

                <a
                  href="#contact-form"
                  className={secondaryButtonClass}
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--card)",
                    color: "var(--text)",
                  }}
                >
                  预约咨询
                </a>
              </div>
            </div>

            <div
              className="rounded-[var(--radius-lg)] border p-4 sm:p-5"
              style={cardStyle}
            >
              <div
                className="rounded-[var(--radius-md)] border p-6 sm:p-8"
                style={softCardStyle}
              >
                <div
                  className="text-sm font-medium uppercase tracking-[0.18em]"
                  style={{ color: "var(--text-soft)" }}
                >
                  Why Lofty
                </div>

                <div className="mt-6 grid gap-4">
                  {highlights.map((item) => (
                    <div
                      key={item.en}
                      className="rounded-[var(--radius-md)] border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
                      style={cardStyle}
                    >
                      <div
                        className="text-lg font-semibold"
                        style={{ color: "var(--text)" }}
                      >
                        {item.zh}
                      </div>
                      <div
                        className="mt-2 text-sm leading-6"
                        style={{ color: "var(--text-soft)" }}
                      >
                        {item.en}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div
            className="mt-12 grid gap-4 rounded-[var(--radius-lg)] border p-4 sm:grid-cols-3 sm:p-5"
            style={cardStyle}
          >
            <div
              className="rounded-[var(--radius-md)] border p-5"
              style={softCardStyle}
            >
              <div
                className="text-3xl font-semibold"
                style={{ color: "var(--primary)" }}
              >
                2008
              </div>
              <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-soft)" }}>
                起教授雅思，长期深耕英语考试教学。
              </p>
            </div>

            <div
              className="rounded-[var(--radius-md)] border p-5"
              style={softCardStyle}
            >
              <div
                className="text-3xl font-semibold"
                style={{ color: "var(--primary)" }}
              >
                18+
              </div>
              <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-soft)" }}>
                年教学经验，覆盖不同基础和目标分数学生。
              </p>
            </div>

            <div
              className="rounded-[var(--radius-md)] border p-5"
              style={softCardStyle}
            >
              <div
                className="text-3xl font-semibold"
                style={{ color: "var(--primary)" }}
              >
                PTE · IELTS
              </div>
              <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-soft)" }}>
                技巧、知识、逻辑与训练体系结合。
              </p>
            </div>
          </div>
        </div>
      </section>

      <ContactForm />
    </main>
  );
}
