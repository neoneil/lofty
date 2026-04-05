"use client";

import { useState } from "react";
import Link from "next/link";

type SectionItem = {
  title: string;
  href: string;
  description: string;
};

const ieltsSections: SectionItem[] = [
  {
    title: "听力 Listening",
    href: "/ielts/listening",
    description: "后续可接入听力题库、练习记录和错题回顾。",
  },
  {
    title: "口语 Speaking",
    href: "/ielts/speaking",
    description: "查看口语题库，后续可扩展 Part 1 / Part 2 / Part 3。",
  },
  {
    title: "阅读 Reading",
    href: "/ielts/reading",
    description: "后续可接入阅读文章、题目和计时训练。",
  },
  {
    title: "写作 Writing",
    href: "/ielts/writing",
    description: "查看写作题库，后续可接入 AI 批改与提交记录。",
  },
];

const pteSections: SectionItem[] = [
  {
    title: "听力 Listening",
    href: "/pte/listening",
    description: "查看 WFD、SST、FIB-L 等题型。",
  },
  {
    title: "口语 Speaking",
    href: "/pte/speaking",
    description: "后续可接入 RA、RS、DI、RL。",
  },
  {
    title: "阅读 Reading",
    href: "/pte/reading",
    description: "后续可接入阅读题库和专项训练。",
  },
  {
    title: "写作 Writing",
    href: "/pte/writing",
    description: "后续可接入 SWT、Essay 和 AI 批改。",
  },
];

export default function ExamTabs() {
  const [activeTab, setActiveTab] = useState<"ielts" | "pte">("ielts");

  const sections =
    activeTab === "ielts" ? ieltsSections : pteSections;

  return (
    <section>
      <div className="mb-8 flex gap-3">
        <button
          onClick={() => setActiveTab("ielts")}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition
            ${
              activeTab === "ielts"
                ? "bg-(--theme) text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
        >
          IELTS
        </button>

        <button
          onClick={() => setActiveTab("pte")}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition
            ${
              activeTab === "pte"
                ? "bg-(--theme) text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
        >
          PTE
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-(--theme)">
          {activeTab === "ielts"
            ? "雅思 IELTS"
            : "PTE 学术英语"}
        </h2>
      </div>

      <div className="grid gap-5 sm:gap-6 md:grid-cols-2">
        {sections.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="card block"
          >
            <h3 className="mb-3 text-xl font-semibold text-(--theme)">
              {item.title}
            </h3>

            <p className="text-sm leading-7 text-gray-600 sm:text-base">
              {item.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}