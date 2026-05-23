import Link from "next/link";

import {
  Mic,
  PenTool,
  BookOpen,
  Headphones,
  ArrowRight,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui-v2/card";
import { Button } from "@/components/ui-v2/button";
import { Badge } from "@/components/ui-v2/badge";

const sections = [
  {
    title: "口语",
    description:
      "练习 RA、RS、DI、RL、ASQ 等 PTE 口语题型，获得 AI 智能评分与反馈。",
    href: "/pte/speaking",
    icon: Mic,
  },
  {
    title: "写作",
    description:
      "提升 SWT 与 Essay 写作能力，支持结构分析、词汇建议与智能评分。",
    href: "/pte/writing",
    icon: PenTool,
  },
  {
    title: "阅读",
    description:
      "练习 RFIB、RWFIB、RO 以及多选题等核心阅读题型。",
    href: "/pte/reading",
    icon: BookOpen,
  },
  {
    title: "听力",
    description:
      "训练 SST、WFD、HIW 等高频听力题型，还原真实考试练习体验。",
    href: "/pte/listening",
    icon: Headphones,
  },
];

export default function PTEPage() {

  return (

    <main className="container-main py-1 sm:py-1">

      <div className="mb-2 sm:mb-3">

      </div>

      <section className="mb-3 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-3 shadow-[var(--shadow-md)] sm:mb-4 sm:p-7">

        <Badge className="mb-1 w-fit">

          PTE 学术英语考试

        </Badge>

        <h1 className="mb-4 max-w-3xl text-3xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">

          AI 智能 PTE 学习平台

        </h1>

        <p className="max-w-3xl text-sm leading-7 text-[var(--text-soft)] sm:text-base">

          通过 AI 智能评分、学习数据分析、词汇系统与真实考试题库，
          全面提升你的 PTE Academic 成绩。
          在一个统一的平台中系统训练口语、写作、阅读与听力能力。

        </p>

        <div className="mt-6 flex flex-wrap gap-3">

          <Link href="/pte/listening">

            <Button size="lg">

              开始练习

            </Button>

          </Link>

          <Link href="/mock-test">

            <Button
              variant="secondary"
              size="lg"
            >

              模考中心

            </Button>

          </Link>

        </div>

      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {sections.map((section) => {

          const Icon =
            section.icon;

          return (

            <Link
              key={section.title}
              href={section.href}
              className="block"
            >

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

                  关于 PTE Academic

                </h3>

                <p className="mt-1 text-sm text-[var(--text-soft)]">

                  Pearson 学术英语考试

                </p>

              </div>

              <Badge variant="secondary">

                AI 智能学习

              </Badge>

            </div>

            <p className="text-sm leading-7 text-[var(--text-soft)] sm:text-base">

              PTE Academic 是由 Pearson 推出的全球认可的学术英语考试，
              被众多大学、政府与移民机构接受。
              考试通过综合题型全面评估考生的口语、写作、阅读与听力能力，
              更贴近真实学术与生活场景。

            </p>

          </CardContent>

        </Card>

        <Card>

          <CardContent className="p-6">

            <div className="mb-4 flex items-center justify-between">

              <h3 className="text-lg font-semibold text-[var(--text)]">

                学习进度

              </h3>

              <Badge variant="success">

                即将上线

              </Badge>

            </div>

            <div className="space-y-4">

              <div className="rounded-2xl bg-[var(--bg-soft)] p-4">

                <div className="text-2xl font-bold text-[var(--text)]">

                  0

                </div>

                <div className="mt-1 text-sm text-[var(--text-soft)]">

                  已练习题目

                </div>

              </div>

              <div className="rounded-2xl bg-[var(--bg-soft)] p-4">

                <div className="text-2xl font-bold text-[var(--text)]">

                  0%

                </div>

                <div className="mt-1 text-sm text-[var(--text-soft)]">

                  平均正确率

                </div>

              </div>

            </div>

          </CardContent>

        </Card>

      </section>

    </main>

  );

}