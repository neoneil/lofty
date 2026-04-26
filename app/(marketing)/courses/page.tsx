"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const courses = [
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

export default function CoursesPage() {
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
      <section className="px-5 pt-14 pb-10 md:pt-20 md:pb-16">
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-4 text-sm tracking-wide text-neutral-500">
            IELTS · PTE Training
          </p>

          <h1 className="text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
            高效提分 · 定制学习路径
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-neutral-500 md:text-base">
            近20年一线教学经验，核心技巧拆解，精准定位薄弱项，
            帮助你在最短时间内实现分数突破。
          </p>
        </div>
      </section>

      {/* 班型 */}
      <section className="px-5 pt-1 pb-10 md:pt-2 md:pb-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center">
            <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
              选择适合你的课程
            </h2>
            <p className="mt-3 text-sm text-neutral-500">
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
                  className={`flex min-h-[360px] flex-col rounded-[28px] border p-6 text-left shadow-[0_10px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 md:p-7 ${
                    active
                      ? "border-[var(--brand-accent)] bg-white shadow-[0_18px_50px_rgba(0,0,0,0.12)]"
                      : "border-white/60 bg-white/80"
                  }`}
                >
                  <p className="text-sm text-neutral-500">{course.tag}</p>

                  <h3 className="mt-2 text-xl font-semibold leading-snug">
                    {course.title}
                  </h3>

                  <p className="mt-4 text-sm leading-6 text-neutral-500">
                    {course.desc}
                  </p>

                  <ul className="mt-6 space-y-3 text-sm text-neutral-600">
                    {course.points.map((point) => (
                      <li key={point}>✔ {point}</li>
                    ))}
                  </ul>

                  <div className="mt-auto pt-6">
                    <div className="cursor-pointer w-full rounded-xl bg-[var(--brand-accent)] px-4 py-3 text-center text-sm font-semibold text-white">
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
            className="mx-auto mt-12 max-w-5xl rounded-[36px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.12)] backdrop-blur-xl md:p-10"
          >
            <div className="text-center">
              <p className="text-sm tracking-wide text-neutral-500">
                Selected Course
              </p>

              <h2 className="mt-3 text-2xl font-semibold md:text-4xl">
                {selectedCourse.title}
              </h2>

              <p className="mx-auto mt-5 max-w-3xl text-sm leading-7 text-neutral-600 md:text-base">
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

          <div className="relative max-h-[88vh] w-full max-w-4xl animate-[modalIn_0.28s_ease-out] overflow-y-auto rounded-[32px] bg-white p-6 shadow-[0_30px_120px_rgba(0,0,0,0.35)] md:p-10">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-xl leading-none text-neutral-600 transition hover:bg-neutral-200"
            >
              ×
            </button>

            <p className="text-sm tracking-wide text-neutral-500">
              Course Detail
            </p>

            <h2 className="mt-3 pr-10 text-2xl font-semibold md:text-4xl">
              {selectedCourse.title}
            </h2>

            <p className="mt-5 text-sm leading-7 text-neutral-600 md:text-base">
              {selectedCourse.details}
            </p>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <div className="rounded-3xl bg-[var(--primary)]/5 p-5">
                <h3 className="font-semibold">适用人群</h3>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-neutral-600">
                  {selectedCourse.suitable.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl bg-[var(--primary)]/5 p-5">
                <h3 className="font-semibold">课后服务</h3>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-neutral-600">
                  {selectedCourse.service.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="rounded-xl bg-[var(--brand-accent)] px-6 py-3 text-center text-sm font-semibold text-white"
              >
                预约试听 / 咨询详情
              </Link>

              <button
                onClick={() => setModalOpen(false)}
                className="cursor-pointer rounded-xl border border-neutral-300 px-6 py-3 text-sm font-semibold"
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
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            课程结构
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ["基础梳理", "系统整理考试知识体系，建立正确理解框架。"],
              ["技巧突破", "拆解核心题型技巧，提升答题效率与准确率。"],
              ["强化训练", "每日刷题 + 实战模拟，稳定输出能力。"],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-2xl bg-white/70 p-5 shadow-sm">
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-neutral-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-14 text-center">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-semibold md:text-3xl">
            先试听，再决定
          </h2>

          <p className="mt-4 text-sm text-neutral-500">
            提供试听课程与能力评估，了解最适合你的学习方案。
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/contact"
              className="rounded-xl bg-[var(--brand-accent)] px-6 py-3 text-sm font-semibold text-white"
            >
              预约试听
            </Link>

            <Link
              href="/contact"
              className="rounded-xl border border-neutral-300 px-6 py-3 text-sm font-semibold"
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