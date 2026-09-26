"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, Check, Clock3, GraduationCap, Layers3, Sparkles, Target, Users, X, Zap } from "lucide-react";

import CourseMarkdownBody from "@/components/course-markdown/CourseMarkdownBody";
import { Badge } from "@/components/ui-v2/badge";

type Exam = "pte" | "ielts";
type CourseKind = "private" | "small-group" | "practice";
type Course = {
  kind: CourseKind; tag: string; title: string; summary: string; points: string[];
  suitable: string[]; modules: Array<{ title: string; description: string }>;
  services: string[]; rhythm: string;
};

const examCopy = {
  pte: { eyebrow: "PTE Academic Training", title: "PTE 课程大纲", intro: "围绕 PTE 评分逻辑与听、说、读、写核心题型，根据当前水平、目标分和备考周期匹配课程。" },
  ielts: { eyebrow: "IELTS Academic Training", title: "雅思课程大纲", intro: "围绕雅思听、说、读、写四项能力，根据当前水平、目标分和考试时间建立清晰的学习路径。" },
} as const;

const courseData: Record<Exam, Course[]> = {
  pte: [
    { kind: "private", tag: "PTE VIP Private", title: "PTE VIP 一对一", summary: "先诊断基础与题型短板，再按目标分定制课程节奏、模板和练习计划。", points: ["免费能力评估", "专属提分计划", "重点题型精讲", "课后复习反馈"], suitable: [], modules: [], services: [], rhythm: "根据课前评估动态安排" },
    { kind: "small-group", tag: "PTE Small Group", title: "PTE 3–5 人精品小班", summary: "同阶段学生小班学习，在完整题型讲解中保留课堂互动、点名练习与即时纠错。", points: ["3–5 人同阶段分班", "听说读写系统覆盖", "课堂轮流实练", "阶段检测与复盘"], suitable: ["希望系统学习全部 PTE 题型的学生", "需要固定课堂节奏与同伴推动的学生", "基础和目标分接近、适合共同进度的学生"], modules: [{ title: "方法建立", description: "讲清评分规则、题型优先级、答题步骤与时间分配。" }, { title: "课堂带练", description: "高频题逐人作答，老师当场纠正发音、模板与解题动作。" }, { title: "阶段复盘", description: "按班级进度安排练习与检测，集中解决共性错误。" }], services: ["开班前基础与目标确认", "课堂资料与重点练习", "阶段性学习建议", "班级答疑与作业反馈"], rhythm: "具体课时与班期根据学生水平和开班人数确认" },
    { kind: "practice", tag: "PTE Intensive Practice", title: "PTE 刷题班", summary: "面向已经学过方法的学生，以高频机经、限时训练和错题复盘提升答题稳定性。", points: ["高频机经集中训练", "限时完成与现场批改", "错题归因与二次练习", "考前节奏模拟"], suitable: ["已经完成基础题型学习、需要增加实战量的学生", "方法知道但正确率或输出稳定性不足的学生", "临近考试、需要集中覆盖高频题的学生"], modules: [{ title: "高频筛选", description: "按近期高频与个人薄弱题型组织当次练习，不做无目的题海。" }, { title: "限时实战", description: "按考试节奏完成口语、听力、阅读与写作重点题型。" }, { title: "错题闭环", description: "区分基础、技巧、速度与状态问题，安排同类题再次验证。" }], services: ["当期重点题单", "课堂即时纠错", "错题分类记录", "考前练习顺序建议"], rhythm: "适合短期强化；开班内容会随考期和题库变化调整" },
  ],
  ielts: [
    { kind: "private", tag: "IELTS VIP Private", title: "雅思 VIP 一对一", summary: "依据当前 Band、目标分与单项短板，定制基础补强、方法训练和考前冲刺方案。", points: ["四项能力诊断", "目标分定制方案", "口语写作精批", "灵活安排进度"], suitable: [], modules: [], services: [], rhythm: "根据课前评估动态安排" },
    { kind: "small-group", tag: "IELTS Small Group", title: "雅思 3–5 人精品小班", summary: "以小班节奏系统覆盖听说读写，在互动练习中建立方法并及时修正常见失分点。", points: ["3–5 人精品小班", "听说读写系统讲解", "写作口语重点反馈", "阶段测评与复盘"], suitable: ["需要系统建立雅思四项方法的学生", "希望保持固定学习节奏与课堂互动的学生", "基础和目标分相近、适合共同进度的学生"], modules: [{ title: "基础框架", description: "建立题型认知、时间安排、定位方法与评分标准理解。" }, { title: "四项训练", description: "听读讲定位与同义替换，口写讲结构并安排课堂输出。" }, { title: "阶段修正", description: "根据测评结果集中处理共性问题和个人高频错误。" }], services: ["开班前水平确认", "课堂资料与练习安排", "写作口语重点反馈", "阶段性学习建议"], rhythm: "具体课时与班期根据学生水平和开班人数确认" },
    { kind: "practice", tag: "IELTS Intensive Practice", title: "雅思刷题班", summary: "面向已有方法基础的学生，以剑桥真题、限时训练和讲评复盘提升正确率与输出质量。", points: ["剑桥真题分项训练", "限时完成与集中讲评", "写作口语输出练习", "错题归因与复盘"], suitable: ["已经学过基础方法、需要通过真题巩固的学生", "听力阅读正确率波动较大的学生", "口语写作需要持续输出和反馈的学生"], modules: [{ title: "真题训练", description: "围绕剑桥真题与高频话题安排听、说、读、写任务。" }, { title: "限时执行", description: "在规定时间内完成任务，修正做题顺序和时间分配。" }, { title: "讲评复盘", description: "定位同义替换、逻辑、表达和审题问题，再做同类强化。" }], services: ["阶段真题题单", "课堂答案讲评", "错题与表达问题归类", "下一阶段训练建议"], rhythm: "适合阶段强化与考前训练；内容根据学生考期动态安排" },
  ],
};

const kindIcons = { private: GraduationCap, "small-group": Users, practice: Zap } satisfies Record<CourseKind, typeof GraduationCap>;

export function ExamCourseCatalog({ exam, privateCourseContent }: { exam: Exam; privateCourseContent: string }) {
  const copy = examCopy[exam];
  const courses = courseData[exam];
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    document.body.style.overflow = selectedCourse ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selectedCourse]);

  useEffect(() => {
    if (!selectedCourse) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setSelectedCourse(null); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedCourse]);

  return (
    <main className="min-h-screen bg-[var(--bg)] pb-16 pt-24 text-[var(--text)] md:pt-28">
      <section className="px-4 sm:px-6">
        <div className="mx-auto max-w-6xl border-b border-[var(--border)] pb-8 sm:pb-10">
          <Badge>{copy.eyebrow}</Badge>
          <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{copy.title}</h1><p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)] sm:text-base">{copy.intro}</p></div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[["3", "课程方向"], ["1h", "免费诊断"], ["1:1", "学习建议"]].map(([value, label]) => <div key={label} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-3 py-3 shadow-[var(--shadow-xs)]"><div className="text-lg font-bold text-[var(--primary)]">{value}</div><div className="mt-1 text-[11px] font-medium text-[var(--text-soft)]">{label}</div></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-9 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)]">Course Options</p><h2 className="mt-2 text-2xl font-bold">选择课程方向</h2></div><p className="text-sm text-[var(--text-soft)]">先免费评估，再确认课程类型与学习周期。</p></div>
          <div className="grid gap-4 lg:grid-cols-3">
            {courses.map((course, index) => {
              const Icon = kindIcons[course.kind];
              return <article key={course.kind} className="flex min-h-[390px] flex-col rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] transition hover:-translate-y-1 hover:border-[var(--primary)]/40 hover:shadow-[var(--shadow-md)] sm:p-6">
                <div className="flex items-start justify-between gap-4"><span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]"><Icon size={21} /></span><span className="text-xs font-bold text-[var(--text-faint)]">0{index + 1}</span></div>
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.12em] text-[var(--primary)]">{course.tag}</p><h3 className="mt-2 text-xl font-bold">{course.title}</h3><p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">{course.summary}</p>
                <ul className="mt-5 space-y-2.5">{course.points.map((point) => <li key={point} className="flex gap-2 text-sm text-[var(--text-soft)]"><Check className="mt-0.5 shrink-0 text-[var(--success)]" size={15} /><span>{point}</span></li>)}</ul>
                <button type="button" onClick={() => setSelectedCourse(course)} className="mt-auto inline-flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--primary)] px-4 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--primary-hover)]">查看课程详情 <ArrowRight size={15} /></button>
              </article>;
            })}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6"><div className="mx-auto grid max-w-6xl gap-4 border-t border-[var(--border)] pt-9 md:grid-cols-3">
        {[{ icon: Target, title: "先诊断", text: "先了解当前水平、目标与考试时间，不用课程时长代替学习诊断。" }, { icon: Layers3, title: "再匹配", text: "根据基础和薄弱项选择一对一、小班或刷题班，不重复学习已掌握内容。" }, { icon: Sparkles, title: "持续复盘", text: "课堂训练与课后练习形成闭环，定期调整下一阶段重点。" }].map(({ icon: Icon, title, text }) => <div key={title} className="flex gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4"><Icon className="mt-0.5 shrink-0 text-[var(--primary)]" size={18} /><div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">{text}</p></div></div>)}
      </div></section>

      {selectedCourse ? <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="course-detail-title">
        <button type="button" aria-label="关闭课程详情" className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setSelectedCourse(null)} />
        <div className="relative max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--bg)] shadow-[0_30px_100px_rgba(0,0,0,0.38)]">
          <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[var(--border)] bg-[var(--card)]/95 px-5 py-4 backdrop-blur-xl sm:px-7"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">{selectedCourse.tag}</p><h2 id="course-detail-title" className="mt-1 text-xl font-bold sm:text-2xl">{selectedCourse.title}</h2></div><button type="button" onClick={() => setSelectedCourse(null)} aria-label="关闭" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text-soft)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"><X size={18} /></button></header>
          <div className="p-4 sm:p-7">
            {selectedCourse.kind === "private" ? <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] sm:p-8 lg:p-10" data-course-markdown-content="true"><CourseMarkdownBody content={privateCourseContent} /></div> : <div className="space-y-5">
              <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] sm:p-7"><p className="max-w-4xl text-sm leading-7 text-[var(--text-soft)] sm:text-base">{selectedCourse.summary}</p><div className="mt-5 inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--primary)]/25 bg-[var(--primary-soft)] px-3 py-2 text-sm font-semibold text-[var(--primary)]"><Clock3 size={16} />{selectedCourse.rhythm}</div></section>
              <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
                <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] sm:p-6"><div className="flex items-center gap-2"><Users size={18} className="text-[var(--primary)]" /><h3 className="font-bold">适用人群</h3></div><ul className="mt-4 space-y-3">{selectedCourse.suitable.map((item) => <li key={item} className="flex gap-2 text-sm leading-6 text-[var(--text-soft)]"><Check className="mt-1 shrink-0 text-[var(--success)]" size={14} />{item}</li>)}</ul></section>
                <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] sm:p-6"><div className="flex items-center gap-2"><BookOpenCheck size={18} className="text-[var(--primary)]" /><h3 className="font-bold">课程流程</h3></div><div className="mt-4 grid gap-3 sm:grid-cols-3">{selectedCourse.modules.map((module, index) => <div key={module.title} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4"><span className="text-xs font-bold text-[var(--primary)]">0{index + 1}</span><h4 className="mt-2 text-sm font-bold">{module.title}</h4><p className="mt-2 text-xs leading-5 text-[var(--text-soft)]">{module.description}</p></div>)}</div></section>
              </div>
              <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] sm:p-6"><h3 className="font-bold">课程支持</h3><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{selectedCourse.services.map((item) => <div key={item} className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--bg-soft)] px-3 py-3 text-sm text-[var(--text-soft)]"><Check className="shrink-0 text-[var(--success)]" size={14} />{item}</div>)}</div></section>
            </div>}
            <div className="mt-6 flex flex-col gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={() => setSelectedCourse(null)} className="h-10 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-5 text-sm font-semibold transition hover:bg-[var(--bg-soft)]">继续查看课程</button><Link href="/contact" className="inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--primary)] px-5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--primary-hover)]">预约免费诊断 <ArrowRight size={15} /></Link></div>
          </div>
        </div>
      </div> : null}
    </main>
  );
}
