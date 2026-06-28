import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpenCheck, Columns3, FileText } from "lucide-react";

import { courseAdmonitionConfig, courseAdmonitionTypes } from "@/components/course-markdown/course-admonition-config";
import { Badge } from "@/components/ui-v2/badge";
import { Card, CardContent } from "@/components/ui-v2/card";
import { requireAdminOrEditor } from "@/lib/auth/require-admin";

export const metadata: Metadata = {
  title: "Markdown 语法备忘录 | Lofty Admin",
};

const frontMatterExample = `---
id: ra-lesson-01
title: Read Aloud Lesson 01
subtitle: 什么是 Read Aloud？
course: pte
module: speaking
question_type: ra
lesson: 1
mode: article
difficulty: beginner
duration: 20
estimated_read_time: 8
author: Vivi
tags:
  - speaking
  - ra
  - beginner
cover: /images/pte/ra/lesson01.png
video:
quiz:
published: true
updated: 2026-06-28
---`;

const extendedSyntaxExample = `==重点内容==

{red}错误表达{/red}
{green}正确表达{/green}
{yellow}考试重点{/yellow}
{blue}知识点{/blue}
{purple}高级表达{/purple}

[badge: Beginner]
[badge: High Frequency]
[badge: PTE Speaking]`;

const animationExample = `> [!ANIMATE:fade-in]
> 淡入内容

> [!ANIMATE:slide-up]
> 向上出现

> [!ANIMATE:zoom-in]
> 放大出现

> [!ANIMATE:highlight]
> 高亮闪一下

> [!ANIMATE:typing]
> 打字机效果`;

const fullLessonExample = `---
id: ra-lesson-01
title: Read Aloud Lesson 01
subtitle: 什么是 Read Aloud？
course: pte
module: speaking
question_type: ra
lesson: 1
mode: slides
difficulty: beginner
duration: 20
estimated_read_time: 8
author: Vivi
tags:
  - speaking
  - ra
  - beginner
published: true
updated: 2026-06-28
---

# 什么是 Read Aloud？

欢迎来到 **PTE Speaking** 第一节课。

> [!GOAL]
> 本节课你会了解 RA 的考试流程、评分标准和训练方向。

<!-- slide -->

# RA 考什么？

> [!KEYPOINT]
> RA 重点考 Pronunciation、Oral Fluency 和 Content。

==Fluency 比完美发音更重要。==

<!-- slide -->

# 常见错误

> [!COMMON-MISTAKE]
> 不要一个单词一个单词读。

> [!WARNING]
> 不要读错以后回头重读。

<!-- slide -->

# Homework

> [!HOMEWORK]
> - [ ] 朗读示例文章 5 遍
> - [ ] 录音 1 次
> - [ ] 回听并找出 3 个问题`;

function MemoCodeBlock({ children }: { children: string }) {
  return <pre className="mt-4 overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 text-xs leading-6 text-[var(--text)] shadow-[var(--shadow-sm)] sm:text-sm"><code>{children}</code></pre>;
}

function MemoSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card className="rounded-[var(--radius-lg)]">
      <CardContent className="p-5 sm:p-7">
        <h2 className="text-xl font-semibold text-[var(--text)]">{title}</h2>
        {description ? <p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">{description}</p> : null}
        {children}
      </CardContent>
    </Card>
  );
}

export default async function MarkdownMemoPage() {
  await requireAdminOrEditor("/admin/markdown-memo");

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-6 text-[var(--text)] sm:px-6 sm:py-8 lg:px-8">
      <section className="mx-auto max-w-6xl">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-soft)] transition hover:text-[var(--primary)]"><ArrowLeft size={16} />返回管理中心</Link>

        <header className="mt-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-md)] sm:p-8">
          <Badge>Course Markdown</Badge>
          <div className="mt-4 flex items-start gap-4">
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)] sm:flex"><BookOpenCheck size={24} /></div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text)] sm:text-3xl">Markdown 课程语法备忘录</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">编写 Lofty PTE、IELTS 和商务课程时使用。Article 与 Slides 共用同一套课程组件和扩展语法。</p>
            </div>
          </div>
        </header>

        <div className="mt-6 grid gap-5">
          <MemoSection title="Front matter" description="必须放在 Markdown 文件顶部。mode 未填写时默认使用 article。"><MemoCodeBlock>{frontMatterExample}</MemoCodeBlock></MemoSection>

          <MemoSection title="Article 与 Slides 模式">
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4"><div className="flex items-center gap-2 font-semibold text-[var(--text)]"><FileText size={18} className="text-[var(--primary)]" />Article</div><p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">设置 <code>mode: article</code>，课程从上到下连续阅读，适合复习、知识库和 AI 助教引用。</p></div>
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4"><div className="flex items-center gap-2 font-semibold text-[var(--text)]"><Columns3 size={18} className="text-[var(--primary)]" />Slides</div><p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">设置 <code>mode: slides</code>，使用分隔符分页，并获得缩略图、键盘翻页和底部导航。</p></div>
            </div>
            <MemoCodeBlock>{`第一张 slide 内容\n\n<!-- slide -->\n\n第二张 slide 内容`}</MemoCodeBlock>
          </MemoSection>

          <MemoSection title="Admonition 课程卡片" description="所有类型都使用统一的圆角、边框和间距，并根据语义提供不同颜色和图标。">
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {courseAdmonitionTypes.map((type) => {
                const config = courseAdmonitionConfig[type];
                const Icon = config.Icon;
                return <div key={type} className={`rounded-[var(--radius-md)] border p-3 ${config.cardClassName}`}><div className={`flex items-center gap-2 text-sm font-semibold ${config.accentClassName}`}><Icon size={16} />{config.title}</div><code className="mt-2 block text-xs text-[var(--text-soft)]">{`> [!${type.toUpperCase()}]`}</code></div>;
              })}
            </div>
          </MemoSection>

          <MemoSection title="高亮、彩色文字与 Badge"><MemoCodeBlock>{extendedSyntaxExample}</MemoCodeBlock><p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">普通的 <code>---</code> 会渲染为带品牌强调点的课程分割线。</p></MemoSection>

          <MemoSection title="动画语法" description="动画使用 framer-motion 在客户端执行。未知动画类型会降级为 NOTE 卡片。"><MemoCodeBlock>{animationExample}</MemoCodeBlock></MemoSection>

          <MemoSection title="完整 lesson01.md 示例" description="下面的内容可直接作为 slides 课程模板。"><MemoCodeBlock>{fullLessonExample}</MemoCodeBlock></MemoSection>
        </div>
      </section>
    </main>
  );
}
