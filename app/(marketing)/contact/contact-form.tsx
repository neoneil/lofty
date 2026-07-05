"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, BookOpenCheck, CheckCircle2, CircleAlert, GraduationCap, Loader2, Mail, MessageCircle, ShieldCheck, Target, UserRound } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-v2/card";
import { Input } from "@/components/ui-v2/input";
import { Textarea } from "@/components/ui-v2/textarea";

import { sendContactEmail } from "./actions";

type FormState = {
  ok: boolean;
  message: string;
};

const initialState: FormState = {
  ok: false,
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} fullWidth className="gap-2 shadow-[var(--shadow-md)] sm:w-auto">
      {pending ? <><Loader2 size={16} className="animate-spin" />发送中...</> : <>提交咨询<ArrowRight size={16} /></>}
    </Button>
  );
}

function FieldLabel({ htmlFor, children, required }: { htmlFor: string; children: React.ReactNode; required?: boolean }) {
  return <label htmlFor={htmlFor} className="mb-2 block text-xs font-bold text-[var(--text)]">{children}{required ? <span className="ml-1 text-[var(--danger)]">*</span> : null}</label>;
}

export default function ContactForm() {
  const [state, formAction] = useActionState(sendContactEmail, initialState);

  return (
    <section
      id="contact-form"
      className="border-t border-[var(--border)] bg-[var(--bg-soft)] px-4 py-12 sm:px-6 lg:px-8 lg:py-16"
    >
      <div className="mx-auto max-w-7xl">
        {state.message ? (
          <div className={`mb-6 flex items-center gap-3 rounded-[var(--radius-md)] border px-4 py-3 text-sm font-medium shadow-[var(--shadow-sm)] ${
              state.ok
                ? "border-[var(--success)]/25 bg-[var(--success-soft)] text-[var(--success)]"
                : "border-[var(--danger)]/25 bg-[var(--danger-soft)] text-[var(--danger)]"
            }`}>
            {state.ok ? <CheckCircle2 size={18} className="shrink-0" /> : <CircleAlert size={18} className="shrink-0" />}
            {state.message}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[390px_1fr]">
          <Card className="overflow-hidden rounded-[var(--radius-lg)] border-[var(--border-strong)] shadow-[var(--shadow-md)]">
            <CardHeader className="flex-col items-start gap-1 border-b border-[var(--border)] bg-[var(--card)] px-5 pb-5 pt-5 sm:px-6 sm:pb-6 sm:pt-6">
              <Badge variant="secondary">联系方式</Badge>
              <CardTitle className="mt-2 text-xl font-bold">联系老师</CardTitle>
              <CardDescription className="leading-6">
                扫码添加微信，或填写右侧表单说明你的目标分数和备考时间。
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 bg-[var(--card)] p-5 sm:p-6">
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-5">
                <div className="flex items-start justify-between gap-4"><div><div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-faint)]">WeChat</div><div className="mt-1 text-xl font-bold text-[var(--text)]">auschi666</div></div><span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]"><MessageCircle size={18} /></span></div>

                <div className="mt-6 flex flex-col items-center justify-center">
                  <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-white p-3 shadow-[var(--shadow-sm)] transition hover:shadow-[var(--shadow-md)]">
                    <img
                      src="/qr.png"
                      alt="WeChat QR code"
                      className="h-auto w-56 rounded-[var(--radius-md)] object-contain"
                    />
                  </div>

                  <p className="mt-3 text-xs font-medium text-[var(--text-soft)]">
                    扫码添加微信
                  </p>
                </div>
              </div>

              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-5">
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--text)]"><BookOpenCheck size={17} className="text-[var(--primary)]" />
                  咨询前可以简单准备
                </div>
                <div className="mt-4 space-y-3 text-sm leading-6 text-[var(--text-soft)]">
                  <p className="flex gap-2"><CheckCircle2 size={15} className="mt-1 shrink-0 text-[var(--primary)]" />当前考试类型和基础分数</p>
                  <p className="flex gap-2"><CheckCircle2 size={15} className="mt-1 shrink-0 text-[var(--primary)]" />目标分数和预计考试时间</p>
                  <p className="flex gap-2"><CheckCircle2 size={15} className="mt-1 shrink-0 text-[var(--primary)]" />目前最薄弱的题型或技能</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden rounded-[var(--radius-lg)] border-[var(--border-strong)] shadow-[var(--shadow-lg)]">
            <div className="absolute inset-x-0 top-0 h-1 bg-[var(--primary)]" />
            <CardHeader className="flex-col items-start gap-1 border-b border-[var(--border)] bg-[var(--card)] px-5 pb-5 pt-6 sm:px-7 sm:pb-6 sm:pt-7">
              <div className="flex w-full items-start justify-between gap-4"><div><Badge variant="default">预约咨询</Badge><CardTitle className="mt-3 text-xl font-bold sm:text-2xl">提交你的学习情况</CardTitle></div><div className="hidden text-right sm:block"><div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-faint)]">Consultation</div><div className="mt-1 text-sm font-semibold text-[var(--primary)]">专业学习诊断</div></div></div>
              <CardDescription className="mt-2 max-w-2xl leading-6">老师会根据你的目标、时间和当前基础给出下一步建议。</CardDescription>
            </CardHeader>

            <CardContent className="bg-[var(--card)] p-5 sm:p-7">
              <form action={formAction} className="space-y-7">
                <div>
                  <div className="mb-5 flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] text-xs font-bold text-[var(--primary)]">01</span><div><h3 className="text-sm font-bold text-[var(--text)]">基本信息</h3><p className="mt-0.5 text-xs text-[var(--text-faint)]">用于老师联系并了解你的情况</p></div></div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div><FieldLabel htmlFor="name" required>姓名</FieldLabel><div className="relative"><UserRound size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" /><Input id="name" name="name" required placeholder="请输入姓名" className="bg-[var(--bg-soft)] pl-10 focus:bg-[var(--card)]" /></div></div>
                    <div><FieldLabel htmlFor="email">邮箱</FieldLabel><div className="relative"><Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" /><Input id="email" name="email" type="email" placeholder="name@example.com" className="bg-[var(--bg-soft)] pl-10 focus:bg-[var(--card)]" /></div></div>
                    <div><FieldLabel htmlFor="wechat">微信</FieldLabel><div className="relative"><MessageCircle size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" /><Input id="wechat" name="wechat" placeholder="请输入微信号" className="bg-[var(--bg-soft)] pl-10 focus:bg-[var(--card)]" /></div></div>
                    <div><FieldLabel htmlFor="exam">考试类型</FieldLabel><div className="relative"><GraduationCap size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" /><Input id="exam" name="exam" placeholder="例如 PTE / IELTS" className="bg-[var(--bg-soft)] pl-10 focus:bg-[var(--card)]" /></div></div>
                  </div>
                </div>

                <div className="border-t border-[var(--border)] pt-7">
                  <div className="mb-5 flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] text-xs font-bold text-[var(--primary)]">02</span><div><h3 className="text-sm font-bold text-[var(--text)]">备考目标</h3><p className="mt-0.5 text-xs text-[var(--text-faint)]">说明目标与目前最需要解决的问题</p></div></div>
                  <div className="space-y-5">
                    <div><FieldLabel htmlFor="target">目标分数</FieldLabel><div className="relative"><Target size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" /><Input id="target" name="target" placeholder="例如 PTE 79 / IELTS 7" className="bg-[var(--bg-soft)] pl-10 focus:bg-[var(--card)]" /></div></div>
                    <div><FieldLabel htmlFor="message" required>学习情况与咨询内容</FieldLabel><div className="relative"><BookOpenCheck size={16} className="pointer-events-none absolute left-3.5 top-4 text-[var(--text-faint)]" /><Textarea id="message" name="message" rows={7} required placeholder="简单说明你的目前水平、目标分数、考试时间和想解决的问题" className="rounded-[var(--radius-md)] bg-[var(--bg-soft)] pl-10 focus:bg-[var(--card)]" /></div></div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-3"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-[var(--primary)]" /><div><p className="text-xs font-bold text-[var(--text)]">联系信息仅用于本次咨询</p><p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">请填写邮箱或微信其中一项</p></div></div>
                  <SubmitButton />
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
