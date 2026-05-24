import Link from "next/link";
import Container from "./container";

import {
  ArrowRight,
  BookOpen,
  Globe,
  GraduationCap,
  Mail,
  MapPin,
  MessageCircle,
  Play,
  Send,
  Sparkles,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative mt-24 border-t border-[var(--border)] bg-[var(--bg-soft)]">
      {/* Top Glow Line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/40 to-transparent" />

      <Container>
        {/* Main */}
        <div className="grid gap-14 py-14 md:grid-cols-[1.2fr_0.9fr_1fr]">
          {/* Left */}
          <div className="max-w-[420px]">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)] shadow-[var(--shadow-sm)]">
                <GraduationCap size={22} />
              </div>

              <div>
                <h3 className="text-xl font-black tracking-tight text-[var(--text)]">
                  Lofty Education
                </h3>

                <p className="text-xs font-semibold tracking-[0.18em] text-[var(--primary)] uppercase">
                  IELTS · PTE Academic
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="mt-5 text-sm leading-8 text-[var(--text-soft)]">
              Professional IELTS and PTE preparation platform with AI-assisted
              speaking, writing, listening and reading practice.
            </p>

            {/* Feature Tags */}
            <div className="mt-6 flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs font-medium text-[var(--text-soft)] shadow-[var(--shadow-sm)]">
                <Sparkles size={13} className="text-[var(--primary)]" />
                AI Learning
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs font-medium text-[var(--text-soft)] shadow-[var(--shadow-sm)]">
                <BookOpen size={13} className="text-[var(--primary)]" />
                PTE Practice
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs font-medium text-[var(--text-soft)] shadow-[var(--shadow-sm)]">
                <MessageCircle size={13} className="text-[var(--primary)]" />
                IELTS Writing
              </div>
            </div>

            {/* Social */}
            <div className="mt-7 flex items-center gap-3">
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] text-[var(--text-soft)] shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-0.5 hover:text-[var(--primary)] hover:shadow-[var(--shadow-md)]"
              >
                <Play size={18} />
              </a>

              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] text-[var(--text-soft)] shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-0.5 hover:text-[var(--primary)] hover:shadow-[var(--shadow-md)]"
              >
                <MessageCircle size={18} />
              </a>

              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] text-[var(--text-soft)] shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-0.5 hover:text-[var(--primary)] hover:shadow-[var(--shadow-md)]"
              >
                <Send size={18} />
              </a>

              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] text-[var(--text-soft)] shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-0.5 hover:text-[var(--primary)] hover:shadow-[var(--shadow-md)]"
              >
                <Globe size={18} />
              </a>
            </div>
          </div>

          {/* Middle */}
          <div>
            {/* Header */}
            <div className="mb-6">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
                Navigation
              </div>

              <h4 className="mt-2 text-lg font-black tracking-tight text-[var(--text)]">
                快速导航
              </h4>
            </div>

            {/* Links */}
            <div className="space-y-3 -ml-6">
              <Link
                href="/ielts"
                className="group flex items-center gap-30 rounded-[var(--radius-md)] border border-transparent px-4 py-3 transition-all duration-300 hover:border-[var(--border)] hover:bg-[var(--card)] hover:shadow-[var(--shadow-sm)]"
              >
                <div>
                  <div className="text-sm font-semibold text-[var(--text)]">
                    IELTS Courses
                  </div>

                  <div className="mt-1 text-xs text-[var(--text-soft)]">
                    雅思课程与学习资源
                  </div>
                </div>

                <ArrowRight
                  size={16}
                  className="shrink-0 text-[var(--text-faint)] transition-all duration-300 group-hover:translate-x-1 group-hover:text-[var(--primary)]"
                />
              </Link>

              <Link
                href="/pte"
                className="group flex items-center gap-30 rounded-[var(--radius-md)] border border-transparent px-4 py-3 transition-all duration-300 hover:border-[var(--border)] hover:bg-[var(--card)] hover:shadow-[var(--shadow-sm)]"
              >
                <div>
                  <div className="text-sm font-semibold text-[var(--text)]">
                    PTE Practice
                  </div>

                  <div className="mt-1 text-xs text-[var(--text-soft)]">
                    AI 智能练习与题库
                  </div>
                </div>

                <ArrowRight
                  size={16}
                  className="shrink-0 text-[var(--text-faint)] transition-all duration-300 group-hover:translate-x-1 group-hover:text-[var(--primary)]"
                />
              </Link>

              <Link
                href="/posts"
                className="group flex items-center gap-30 rounded-[var(--radius-md)] border border-transparent px-4 py-3 transition-all duration-300 hover:border-[var(--border)] hover:bg-[var(--card)] hover:shadow-[var(--shadow-sm)]"
              >
                <div>
                  <div className="text-sm font-semibold text-[var(--text)]">
                    Blog & Resources
                  </div>

                  <div className="mt-1 text-xs text-[var(--text-soft)]">
                    备考文章与学习资料
                  </div>
                </div>

                <ArrowRight
                  size={16}
                  className="shrink-0 text-[var(--text-faint)] transition-all duration-300 group-hover:translate-x-1 group-hover:text-[var(--primary)]"
                />
              </Link>

              <Link
                href="/contact"
                className="group flex items-center gap-30 rounded-[var(--radius-md)] border border-transparent px-4 py-3 transition-all duration-300 hover:border-[var(--border)] hover:bg-[var(--card)] hover:shadow-[var(--shadow-sm)]"
              >
                <div>
                  <div className="text-sm font-semibold text-[var(--text)]">
                    Contact
                  </div>

                  <div className="mt-1 text-xs text-[var(--text-soft)]">
                    联系老师与课程咨询
                  </div>
                </div>

                <ArrowRight
                  size={16}
                  className="shrink-0 text-[var(--text-faint)] transition-all duration-300 group-hover:translate-x-1 group-hover:text-[var(--primary)]"
                />
              </Link>
            </div>
          </div>

          {/* Right */}
          <div>
            {/* Header */}
            <div className="mb-6">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
                Contact
              </div>

              <h4 className="mt-2 text-lg font-black tracking-tight text-[var(--text)]">
                联系方式
              </h4>
            </div>

            {/* Cards */}
            <div className="space-y-4">
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)]">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary-soft)] text-[var(--primary)]">
                    <MapPin size={18} />
                  </div>

                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
                      Location
                    </div>

                    <p className="mt-1 text-sm leading-7 text-[var(--text-soft)]">
                      CBD Melbourne, VIC Australia
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[var(--radius-md)] border border-[#D7F5DF] bg-[#F3FFF6] p-4 shadow-[var(--shadow-sm)]">
                <div className="flex items-start gap-3">
                  {/* WeChat Icon */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[#22C55E]/12 text-[#22C55E]">
                    <MessageCircle size={18} />
                  </div>

                  {/* Content */}
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-[#16A34A]">
                      WeChat
                    </div>

                    <p className="mt-1 text-sm leading-7 text-[#4B5563]">
                      auschi666
                    </p>
                  </div>
                </div>
              </div>

<div className="rounded-[var(--radius-md)] border border-[#E7E2FF] bg-[#F8F7FF] p-4 shadow-[var(--shadow-sm)]">
  <div className="flex items-start gap-3">
    
    {/* Icon */}
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[#7C6BFF]/12 text-[#7C6BFF]">
      <Sparkles size={18} />
    </div>

    {/* Content */}
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-[#6D5DFC]">
        AI Powered
      </div>

      <p className="mt-1 text-sm leading-7 text-[#5B5675]">
        Smart learning platform for IELTS & PTE students
      </p>
    </div>
  </div>
</div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col gap-4 border-t border-[var(--border)] py-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[var(--text-soft)]">
            © 2026 Lofty Education. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-3 text-[var(--text-faint)]">
            <span>Built by Chi</span>

            <div className="h-1 w-1 rounded-full bg-[var(--border-strong)]" />

            <span>SEO Optimized</span>

            <div className="h-1 w-1 rounded-full bg-[var(--border-strong)]" />

            <span>Mobile First</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
