import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Mail,
  MapPin,
  MessageCircle,
  Sparkles,
} from "lucide-react";

import Container from "./container";

const serviceLinks = [
  {
    href: "/pte",
    label: "PTE 智能练习",
    description: "题库、AI 评分与分项训练",
  },
  {
    href: "/ielts",
    label: "IELTS 提分课程",
    description: "写作、口语与综合备考",
  },
  {
    href: "/courses",
    label: "课程方案",
    description: "一对一、小班与目标分数路径",
  },
];

const resourceLinks = [
  {
    href: "/posts",
    label: "备考文章",
  },
  {
    href: "/study-plan",
    label: "学习计划",
  },
  {
    href: "/contact",
    label: "预约咨询",
  },
];

const trustPoints = ["PTE · IELTS", "AI 智能评测", "墨尔本本地教学"];

function FooterLink({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-transparent px-3 py-2.5 transition hover:border-[var(--border)] hover:bg-[var(--card)] hover:shadow-[var(--shadow-xs)]"
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-[var(--text)]">
          {label}
        </span>
        {description ? (
          <span className="mt-1 block text-xs leading-5 text-[var(--text-soft)]">
            {description}
          </span>
        ) : null}
      </span>

      <ArrowRight
        size={15}
        className="shrink-0 text-[var(--text-faint)] transition group-hover:translate-x-0.5 group-hover:text-[var(--primary)]"
      />
    </Link>
  );
}

function ContactItem({
  icon,
  label,
  value,
  tone = "primary",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "primary" | "success" | "info";
}) {
  const toneClass =
    tone === "success"
      ? "bg-[var(--success-soft)] text-[var(--success)]"
      : tone === "info"
        ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
      : "bg-[var(--primary-soft)] text-[var(--primary)]";
  const labelClass =
    tone === "success"
      ? "text-[var(--success)]"
      : tone === "info"
        ? "text-sky-600 dark:text-sky-400"
      : "text-[var(--primary)]";

  return (
    <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-xs)]">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] ${toneClass}`}>
        {icon}
      </div>
      <div>
        <div className={`text-xs font-semibold uppercase tracking-[0.12em] ${labelClass}`}>
          {label}
        </div>
        <div className="mt-1 text-sm font-semibold leading-6 text-[var(--text)]">
          {value}
        </div>
      </div>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text)]">
      <Container>
        <div className="py-10 sm:py-12">
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] sm:p-6 lg:p-7">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--primary)]">
                  <Sparkles size={14} />
                  Lofty Education
                </div>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">
                  让备考路径更清楚，让每次练习更有效。
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-soft)]">
                  专注 PTE 与 IELTS 提分训练，结合老师反馈、题库练习和 AI
                  智能评测，帮助学生围绕目标分数建立稳定学习节奏。
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <Link
                  href="/contact"
                  className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary)] px-5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--primary-hover)]"
                >
                  预约咨询
                </Link>
                <Link
                  href="/pte"
                  className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-5 text-sm font-semibold text-[var(--text)] shadow-[var(--shadow-xs)] transition hover:bg-[var(--bg-soft)]"
                >
                  开始练习
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-8 py-10 lg:grid-cols-[1.1fr_1fr_0.8fr_1fr]">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]">
                  <GraduationCap size={22} />
                </div>
                <div>
                  <div className="text-lg font-semibold tracking-tight text-[var(--text)]">
                    Lofty Education
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
                    致远教育
                  </div>
                </div>
              </div>

              <p className="mt-5 text-sm leading-7 text-[var(--text-soft)]">
                位于澳大利亚墨尔本，提供 PTE、IELTS
                课程与智能练习系统，服务留学、工作签证、永居申请和职业注册目标。
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {trustPoints.map((point) => (
                  <span
                    key={point}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs font-medium text-[var(--text-soft)]"
                  >
                    <CheckCircle2 size={13} className="text-[var(--primary)]" />
                    {point}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                <BookOpen size={16} className="text-[var(--primary)]" />
                课程与练习
              </div>
              <div className="space-y-1">
                {serviceLinks.map((link) => (
                  <FooterLink key={link.href} {...link} />
                ))}
              </div>
            </div>

            <div>
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                <Sparkles size={16} className="text-[var(--primary)]" />
                资源入口
              </div>
              <div className="space-y-1">
                {resourceLinks.map((link) => (
                  <FooterLink key={link.href} {...link} />
                ))}
              </div>
            </div>

            <div>
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                <MessageCircle size={16} className="text-[var(--primary)]" />
                联系方式
              </div>
              <div className="space-y-3">
                <ContactItem
                  icon={<MapPin size={18} />}
                  label="地址"
                  value="CBD Melbourne, VIC Australia"
                  tone="info"
                />
                <ContactItem
                  icon={<MessageCircle size={18} />}
                  label="微信/WeChat"
                  value="auschi666"
                  tone="success"
                />
                <ContactItem
                  icon={<Mail size={18} />}
                  label="免费预约咨询"
                  value="通过联系页预约课程咨询"
                  tone="primary"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-[var(--border)] pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[var(--text-soft)]">
              © 2026 Lofty Education. All rights reserved.
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[var(--text-faint)]">
              <Link href="/posts" className="transition hover:text-[var(--primary)]">
                Articles
              </Link>
              <Link href="/contact" className="transition hover:text-[var(--primary)]">
                Contact
              </Link>
              <span>Melbourne · Australia</span>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
