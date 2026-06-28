import type { LucideIcon } from "lucide-react";
import { AudioLines, BadgeDollarSign, Brain, Braces, Briefcase, Building2, CircleAlert, CircleCheckBig, CircleHelp, CircleX, Drama, FastForward, FlaskConical, GraduationCap, KeyRound, Languages, Lightbulb, ListChecks, ListOrdered, ListTodo, Mail, MessageCircle, NotebookPen, Presentation, Route, ScanSearch, ScrollText, StickyNote, Target, Trophy, TriangleAlert, UserRound, Zap } from "lucide-react";

export const courseAdmonitionTypes = ["note", "tip", "success", "warning", "important", "example", "question", "summary", "goal", "outcome", "agenda", "keypoint", "strategy", "exam", "common-mistake", "teacher-says", "action", "checklist", "homework", "vocabulary", "pronunciation", "grammar", "case-study", "business", "script", "roleplay", "client", "email", "meeting", "sales", "mindset", "reflection", "next"] as const;

export type CourseAdmonitionType = (typeof courseAdmonitionTypes)[number];

type CourseAdmonitionStyle = {
  title: string;
  Icon: LucideIcon;
  cardClassName: string;
  accentClassName: string;
};

export const courseAdmonitionConfig: Record<CourseAdmonitionType, CourseAdmonitionStyle> = {
  note: { title: "说明", Icon: StickyNote, cardClassName: "border-blue-500/35 bg-blue-500/10", accentClassName: "text-blue-600" },
  tip: { title: "技巧提示", Icon: Lightbulb, cardClassName: "border-emerald-500/35 bg-emerald-500/10", accentClassName: "text-emerald-600" },
  success: { title: "成功", Icon: CircleCheckBig, cardClassName: "border-green-500/35 bg-green-500/10", accentClassName: "text-green-600" },
  warning: { title: "注意事项", Icon: TriangleAlert, cardClassName: "border-amber-500/40 bg-amber-500/10", accentClassName: "text-amber-600" },
  important: { title: "重要内容", Icon: CircleAlert, cardClassName: "border-red-500/35 bg-red-500/10", accentClassName: "text-red-600" },
  example: { title: "示例", Icon: FlaskConical, cardClassName: "border-violet-500/35 bg-violet-500/10", accentClassName: "text-violet-600" },
  question: { title: "思考题", Icon: CircleHelp, cardClassName: "border-cyan-500/35 bg-cyan-500/10", accentClassName: "text-cyan-600" },
  summary: { title: "本节总结", Icon: ListChecks, cardClassName: "border-zinc-500/35 bg-zinc-500/10", accentClassName: "text-zinc-500" },
  goal: { title: "学习目标", Icon: Target, cardClassName: "border-indigo-500/35 bg-indigo-500/10", accentClassName: "text-indigo-600" },
  outcome: { title: "学习成果", Icon: Trophy, cardClassName: "border-emerald-400/40 bg-emerald-400/10", accentClassName: "text-emerald-500" },
  agenda: { title: "课程流程", Icon: ListOrdered, cardClassName: "border-sky-500/35 bg-sky-500/10", accentClassName: "text-sky-600" },
  keypoint: { title: "核心重点", Icon: KeyRound, cardClassName: "border-violet-400/40 bg-violet-400/10", accentClassName: "text-violet-500" },
  strategy: { title: "学习策略", Icon: Route, cardClassName: "border-teal-500/35 bg-teal-500/10", accentClassName: "text-teal-600" },
  exam: { title: "考试技巧", Icon: GraduationCap, cardClassName: "border-orange-500/35 bg-orange-500/10", accentClassName: "text-orange-600" },
  "common-mistake": { title: "常见错误", Icon: CircleX, cardClassName: "border-rose-500/35 bg-rose-500/10", accentClassName: "text-rose-600" },
  "teacher-says": { title: "老师提醒", Icon: MessageCircle, cardClassName: "border-pink-500/35 bg-pink-500/10", accentClassName: "text-pink-600" },
  action: { title: "立即行动", Icon: Zap, cardClassName: "border-lime-500/40 bg-lime-500/10", accentClassName: "text-lime-600" },
  checklist: { title: "检查清单", Icon: ListTodo, cardClassName: "border-green-500/35 bg-green-500/10", accentClassName: "text-green-600" },
  homework: { title: "今日作业", Icon: NotebookPen, cardClassName: "border-amber-400/40 bg-amber-400/10", accentClassName: "text-amber-500" },
  vocabulary: { title: "单词与术语", Icon: Languages, cardClassName: "border-blue-400/40 bg-blue-400/10", accentClassName: "text-blue-500" },
  pronunciation: { title: "发音技巧", Icon: AudioLines, cardClassName: "border-fuchsia-500/35 bg-fuchsia-500/10", accentClassName: "text-fuchsia-600" },
  grammar: { title: "语法提醒", Icon: Braces, cardClassName: "border-purple-500/35 bg-purple-500/10", accentClassName: "text-purple-600" },
  "case-study": { title: "案例分析", Icon: Briefcase, cardClassName: "border-zinc-400/40 bg-zinc-400/10", accentClassName: "text-zinc-500" },
  business: { title: "商务应用", Icon: Building2, cardClassName: "border-indigo-400/40 bg-indigo-400/10", accentClassName: "text-indigo-500" },
  script: { title: "课堂讲稿", Icon: ScrollText, cardClassName: "border-neutral-500/35 bg-neutral-500/10", accentClassName: "text-neutral-500" },
  roleplay: { title: "角色扮演", Icon: Drama, cardClassName: "border-cyan-400/40 bg-cyan-400/10", accentClassName: "text-cyan-500" },
  client: { title: "客户场景", Icon: UserRound, cardClassName: "border-sky-400/40 bg-sky-400/10", accentClassName: "text-sky-500" },
  email: { title: "商务邮件", Icon: Mail, cardClassName: "border-blue-600/30 bg-blue-600/10", accentClassName: "text-blue-600" },
  meeting: { title: "会议表达", Icon: Presentation, cardClassName: "border-violet-600/30 bg-violet-600/10", accentClassName: "text-violet-600" },
  sales: { title: "销售话术", Icon: BadgeDollarSign, cardClassName: "border-orange-400/40 bg-orange-400/10", accentClassName: "text-orange-500" },
  mindset: { title: "思维方式", Icon: Brain, cardClassName: "border-emerald-600/30 bg-emerald-600/10", accentClassName: "text-emerald-600" },
  reflection: { title: "课后反思", Icon: ScanSearch, cardClassName: "border-slate-500/35 bg-slate-500/10", accentClassName: "text-slate-500" },
  next: { title: "下一节课", Icon: FastForward, cardClassName: "border-[var(--primary)]/35 bg-[var(--primary-soft)]", accentClassName: "text-[var(--primary)]" },
};
