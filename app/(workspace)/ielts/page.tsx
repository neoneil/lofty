import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Headphones,
  LibraryBig,
  Mic,
  PenTool,
} from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Card, CardContent } from "@/components/ui-v2/card";

const sections = [
  {
    title: "口语",
    description:
      "练习 IELTS Speaking Part 1、Part 2 与 Part 3 题库，按话题分类快速复习。",
    href: "/ielts/speaking",
    icon: Mic,
  },
  {
    title: "写作",
    description:
      "浏览 IELTS Writing Task 题库，按题型与话题分类训练写作思路。",
    href: "/ielts/writing",
    icon: PenTool,
  },
  {
    title: "阅读",
    description:
      "使用剑桥雅思阅读练习工作区，对照题目与文章进行完整训练。",
    href: "/ielts/reading",
    icon: BookOpen,
  },
  {
    title: "听力",
    description:
      "IELTS Listening 练习模块即将上线，后续会接入听力题库与训练流程。",
    href: "/ielts/listening",
    icon: Headphones,
  },
  {
    title: "雅思练习题",
    description:
      "按剑桥雅思 21-16 浏览完整练习资料，集中查看听力、阅读、写作与后续口语内容。",
    href: "/ielts/practice",
    icon: LibraryBig,
  },
];

export default function IELTSPage() {
  return (
    <main className="container-main py-1 sm:py-1">
      <section className="mb-3 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-3 shadow-[var(--shadow-md)] sm:mb-4 sm:p-7">
        <Badge className="mb-1 w-fit">IELTS 学术英语考试</Badge>

        <h1 className="mb-4 max-w-3xl text-3xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">
          AI 智能 IELTS 学习平台
        </h1>

        <p className="max-w-3xl text-sm leading-7 text-[var(--text-soft)] sm:text-base">
          通过雅思口语、写作、阅读与听力模块化题库，
          系统训练考试所需的表达、审题、理解与答题能力。
          在统一的学习空间中切换不同题型，持续积累真实练习数据。
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/ielts/speaking">
            <Button size="lg">开始练习</Button>
          </Link>

          <Link href="/ielts/writing">
            <Button variant="secondary" size="lg">
              写作题库
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {sections.map((section) => {
          const Icon = section.icon;

          return (
            <Link key={section.title} href={section.href} className="block">
              <Card className="group h-full hover:-translate-y-1 hover:border-[var(--primary)] hover:shadow-[var(--shadow-md)]">
                <CardContent className="flex h-full flex-col p-5 sm:p-6">
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
                    <Icon size={24} />
                  </div>

                  <h2 className="mb-2 text-lg font-semibold text-[var(--text)]">
                    {section.title}
                  </h2>

                  <p className="mb-6 flex-1 text-sm leading-7 text-[var(--text-soft)]">
                    {section.description}
                  </p>

                  <div className="flex items-center gap-2 text-sm font-medium text-[var(--primary)]">
                    进入模块
                    <ArrowRight
                      size={16}
                      className="transition-transform duration-200 group-hover:translate-x-1"
                    />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </section>

      <section className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text)]">
                  关于 IELTS Academic
                </h3>
                <p className="mt-1 text-sm text-[var(--text-soft)]">
                  国际英语语言测试系统
                </p>
              </div>

              <Badge variant="secondary">AI 智能学习</Badge>
            </div>

            <p className="text-sm leading-7 text-[var(--text-soft)] sm:text-base">
              IELTS Academic 面向留学、移民与职业认证场景，
              通过听、说、读、写四项能力评估考生在真实学术环境中的英语使用能力。
              本平台将题库、练习工具与学习路径集中在同一个工作区中。
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--text)]">
                学习进度
              </h3>
              <Badge variant="success">即将上线</Badge>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl bg-[var(--bg-soft)] p-4">
                <div className="text-2xl font-bold text-[var(--text)]">0</div>
                <div className="mt-1 text-sm text-[var(--text-soft)]">
                  已练习题目
                </div>
              </div>

              <div className="rounded-2xl bg-[var(--bg-soft)] p-4">
                <div className="text-2xl font-bold text-[var(--text)]">0%</div>
                <div className="mt-1 text-sm text-[var(--text-soft)]">
                  平均完成率
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
