import Link from "next/link";
import { ArrowRight, BarChart3, CalendarCheck2, GraduationCap, Medal, Presentation } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Card, CardContent } from "@/components/ui-v2/card";

const navigationItems = [
  { href: "/classroom", label: "直播课堂", description: "使用老师提供的课堂信息进入直播课程", icon: Presentation },
  { href: "/study-plan", label: "学习计划", description: "安排目标、考试日期和每日学习节奏", icon: CalendarCheck2 },
  { href: "/analytics", label: "学习分析", description: "查看模块完成量、正确率与学习时间", icon: BarChart3 },
  { href: "/achievements", label: "学习成就", description: "查看已解锁称号和下一阶段目标", icon: Medal },
];

export function EnrollmentPanel() {
  return (
    <Card className="overflow-hidden border-[var(--border-strong)]">
      <CardContent className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]"><GraduationCap size={23} /></div>
          <div>
            <Badge variant="outline">Course Enrollment</Badge>
            <h2 className="mt-3 text-xl font-semibold text-[var(--text)] sm:text-2xl">需要系统课程与老师带学？</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">查看 PTE、IELTS 一对一与精品小班课程，了解适用人群、课程结构、课后服务与当前班期。</p>
            <div className="mt-3 flex flex-wrap gap-2"><Badge variant="secondary">PTE VIP 一对一</Badge><Badge variant="secondary">PTE 精品小班</Badge><Badge variant="secondary">IELTS VIP 一对一</Badge><Badge variant="secondary">IELTS 精品小班</Badge></div>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
          <Link href="/courses" className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--primary)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-hover)]">查看报课课程<ArrowRight size={15} /></Link>
          <Link href="/contact" className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-5 text-sm font-semibold text-[var(--text)] transition-colors hover:bg-[var(--bg-soft)]">咨询课程顾问</Link>
        </div>
      </CardContent>
    </Card>
  );
}

export function CourseNavigation() {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-4"><div><h2 className="text-lg font-semibold text-[var(--text)]">学习服务</h2><p className="mt-1 text-sm text-[var(--text-soft)]">快速进入课程配套功能</p></div></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="group flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)] transition-all duration-200 hover:border-[var(--border-strong)] hover:bg-[var(--bg-soft)]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]"><Icon size={19} /></div>
              <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><h3 className="font-semibold text-[var(--text)]">{item.label}</h3><ArrowRight size={15} className="shrink-0 text-[var(--text-faint)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--primary)]" /></div><p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">{item.description}</p></div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
