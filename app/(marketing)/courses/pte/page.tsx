"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const allCourses = [
  {
    tag: "PTE VIP Private",
    title: "PTE VIP 一对一",
    desc: "根据当前分数、目标分数与备考时间，制定专属提分计划。",
    button: "咨询课程",
    points: [
      "精准能力评估 + 学习规划",
      "专项分析弱点题型",
      "当堂带练巩固技巧",
      "课后每日练习反馈批改",
    ],
    details:
      "PTE VIP 一对一课程会依据考生当前考试分数和能力水准，制定专属提分计划。授课教师会在课上对提分技巧进行讲解和带练，帮助考生高效提升弱项题型，并在课程最终生成阶段性复习计划，结合课后反馈体系，帮助考生巩固所学技巧。",
    suitable: [
      "已系统参加过 PTE 培训的考生",
      "自学过 PTE，且参加过两次以上考试的考生",
      "需要进行专项能力提升的考生",
      "备考时间非常急迫的考生",
    ],
    service: [
      "VIP 私人定制学习计划",
      "VIP 考前评估 + 私人定制考前冲刺计划",
      "课后每日练习反馈批改",
      "学习顾问全程跟进监督",
    ],
  },
  {
    tag: "PTE Small Group",
    title: "PTE 3–5人精品小班",
    desc: "小班互动教学，兼顾个性化与性价比。",
    button: "查看班期",
    points: ["3–5人小班互动", "同水平分班训练", "核心题型技巧精讲", "课堂练习 + 课后反馈"],
    details:
      "PTE 精品小班适合希望系统学习，同时保留课堂互动和答疑机会的学生。课程围绕 PTE 听说读写核心题型进行技巧拆解、课堂带练和阶段性复习。",
    suitable: ["想系统学习 PTE 的考生", "需要课堂氛围推动的学生", "预算比一对一更灵活的学生"],
    service: ["阶段性学习计划", "课堂互动答疑", "重点题型训练", "课后练习反馈"],
  },
  {
    tag: "IELTS VIP Private",
    title: "雅思 VIP 一对一",
    desc: "针对听说读写单项弱点，定制雅思提分路径。",
    button: "咨询课程",
    points: ["听说读写专项诊断", "目标分数定制方案", "口语 / 写作重点突破", "灵活排课"],
    details:
      "雅思 VIP 一对一课程会根据学生当前水平、目标分数和考试时间，设计个性化学习路径。适合需要快速突破写作、口语或单项短板的学生。",
    suitable: ["雅思目标分数明确的学生", "写作或口语长期卡分的学生", "备考时间紧张的学生"],
    service: ["专属学习计划", "作文批改与讲解", "口语模拟与反馈", "考前冲刺安排"],
  },
  {
    tag: "IELTS Small Group",
    title: "雅思 3–5人精品小班",
    desc: "小班系统学习雅思核心方法，适合稳定节奏学习。",
    button: "查看班期",
    points: ["3–5人精品小班", "系统讲解考试方法", "写作口语重点训练", "阶段性测试反馈"],
    details:
      "雅思精品小班适合希望系统学习雅思方法、提升学习节奏和课堂互动的学生。课程覆盖听力、阅读、写作、口语，并重点强化高频失分点。",
    suitable: ["雅思基础需要系统梳理的学生", "希望固定节奏学习的学生", "希望性价比更高的学生"],
    service: ["阶段性学习安排", "课堂练习与讲解", "写作口语反馈", "班主任学习跟进"],
  },
];

const courses = allCourses.filter((course) => course.tag.startsWith('PTE'));

export default function PteCoursesPage() {
  const [selectedCourse, setSelectedCourse] = useState(courses[0]);
  const [modalOpen, setModalOpen] = useState(false);
  const detailRef = useRef<HTMLDivElement | null>(null);

  function openCourse(course: (typeof courses)[number]) {
    setSelectedCourse(course);
    setModalOpen(true);

    setTimeout(() => {
      detailRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 80);
  }

  useEffect(() => {
    document.body.style.overflow = modalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalOpen]);

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* HERO */}
      <section className="px-5 pt-24 pb-10 md:pt-28 md:pb-16">
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-4 inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-xs font-semibold tracking-[0.18em] text-[var(--primary)] uppercase shadow-[var(--shadow-sm)]">
            PTE Academic Training
          </p>

          <h1 className="text-2xl font-black leading-tight tracking-tight text-[var(--text)] md:text-3xl">
            PTE 课程大纲
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[var(--text-soft)] md:text-base">
            围绕 PTE 听说读写高频题型，结合当前分数、目标分数和备考时间，
            安排清晰的专项提分训练。
          </p>
        </div>
      </section>

      {/* 班型 */}
      <section className="px-5 pt-1 pb-10 md:pt-2 md:pb-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center">
            <h2 className="text-xl font-black tracking-tight text-[var(--text)] md:text-2xl">
              选择适合你的课程
            </h2>
            <p className="mt-3 text-sm text-[var(--text-soft)]">
              一对一精准提分，小班课高互动训练，适合不同目标和备考节奏。
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {courses.map((course) => {
              const active = selectedCourse.title === course.title;

              return (
                <button
                  key={course.title}
                  onClick={() => openCourse(course)}
                  className={`group flex min-h-[360px] cursor-pointer flex-col rounded-[var(--radius-md)] border p-6 text-left backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-md)] md:p-7 ${
                    active
                      ? "border-[var(--primary)] bg-[var(--card)] shadow-[var(--shadow-md)] ring-2 ring-[var(--primary-soft)]"
                      : "border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]"
                  }`}
                >
                  <p className="inline-flex w-fit items-center rounded-full border border-[var(--border)] bg-[var(--primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--primary)]">
                    {course.tag}
                  </p>

                  <h3 className="mt-4 text-xl font-black leading-snug text-[var(--text)]">
                    {course.title}
                  </h3>

                  <p className="mt-4 text-sm leading-6 text-[var(--text-soft)]">
                    {course.desc}
                  </p>

                  <ul className="mt-6 space-y-3 text-sm text-[var(--text-soft)]">
                    {course.points.map((point) => (
                      <li key={point} className="flex gap-2">
                        <span className="mt-0.5 text-[var(--primary)]">✓</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto pt-6">
                    <div className="w-full rounded-[var(--radius-sm)] bg-[var(--primary)] px-4 py-3 text-center text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition group-hover:bg-[var(--primary-hover)]">
                      {course.button}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 页面里的详情定位区 */}
          <div
            ref={detailRef}
            className="mx-auto mt-12 max-w-5xl rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-lg)] backdrop-blur-xl md:p-10"
          >
            <div className="text-center">
              <p className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--primary-soft)] px-3 py-1 text-xs font-semibold tracking-wide text-[var(--primary)]">
                Selected Course
              </p>

              <h2 className="mt-4 text-2xl font-black text-[var(--text)] md:text-4xl">
                {selectedCourse.title}
              </h2>

              <p className="mx-auto mt-5 max-w-3xl text-sm leading-7 text-[var(--text-soft)] md:text-base">
                {selectedCourse.details}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Modal 浮层 */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            aria-label="Close course detail"
            onClick={() => setModalOpen(false)}
            className="absolute inset-0 bg-black/45 backdrop-blur-md"
          />

          <div className="relative max-h-[88vh] w-full max-w-4xl animate-[modalIn_0.28s_ease-out] overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.35)] md:p-10">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute right-5 top-5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] text-xl leading-none text-[var(--text-soft)] transition hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"
            >
              ×
            </button>

            <p className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--primary-soft)] px-3 py-1 text-xs font-semibold tracking-wide text-[var(--primary)]">
              Course Detail
            </p>

            <h2 className="mt-4 pr-10 text-2xl font-black text-[var(--text)] md:text-4xl">
              {selectedCourse.title}
            </h2>

            <p className="mt-5 text-sm leading-7 text-[var(--text-soft)] md:text-base">
              {selectedCourse.details}
            </p>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-5">
                <h3 className="font-bold text-[var(--text)]">适用人群</h3>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--text-soft)]">
                  {selectedCourse.suitable.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-[var(--primary)]">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-5">
                <h3 className="font-bold text-[var(--text)]">课后服务</h3>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--text-soft)]">
                  {selectedCourse.service.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-[var(--primary)]">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="rounded-[var(--radius-sm)] bg-[var(--primary)] px-6 py-3 text-center text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--primary-hover)]"
              >
                预约试听 / 咨询详情
              </Link>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="cursor-pointer rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-6 py-3 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--bg-soft)]"
              >
                继续查看课程
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 课程结构 */}
      <section className="px-5 py-10 md:py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-black tracking-tight text-[var(--text)] md:text-3xl">
            课程结构
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ["基础梳理", "系统整理考试知识体系，建立正确理解框架。"],
              ["技巧突破", "拆解核心题型技巧，提升答题效率与准确率。"],
              ["强化训练", "每日刷题 + 实战模拟，稳定输出能力。"],
            ].map(([title, desc]) => (
              <div
                key={title}
                className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
              >
                <h3 className="text-lg font-bold text-[var(--text)]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-14 text-center">
        <div className="mx-auto max-w-3xl rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-8 shadow-[var(--shadow-md)] md:p-10">
          <h2 className="text-2xl font-black text-[var(--text)] md:text-3xl">
            先试听，再决定
          </h2>

          <p className="mt-4 text-sm leading-7 text-[var(--text-soft)]">
            提供试听课程与能力评估，了解最适合你的学习方案。
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/contact"
              className="rounded-[var(--radius-sm)] bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:bg-[var(--primary-hover)] hover:shadow-[var(--shadow-md)]"
            >
              预约试听
            </Link>

            <Link
              href="/contact"
              className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-6 py-3 text-sm font-semibold text-[var(--text)] transition hover:-translate-y-0.5 hover:bg-[var(--bg-soft)]"
            >
              课程咨询
            </Link>
          </div>
        </div>
      </section>

      <style jsx global>{`
        @keyframes modalIn {
          from {
            opacity: 0;
            transform: translateY(24px) scale(0.94);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </main>
  );
}
