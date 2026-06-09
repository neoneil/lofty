"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

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
    <Button
      type="submit"
      disabled={pending}
      fullWidth
      className="sm:w-auto"
    >
      {pending ? "发送中..." : "提交咨询"}
    </Button>
  );
}

export default function ContactForm() {
  const [state, formAction] = useActionState(sendContactEmail, initialState);

  return (
    <section
      id="contact-form"
      className="border-t border-[var(--border)] bg-[var(--bg)] px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
    >
      <div className="mx-auto max-w-7xl">
        {state.message ? (
          <div
            className={`mb-6 rounded-[var(--radius-md)] border px-4 py-3 text-sm font-medium shadow-[var(--shadow-sm)] ${
              state.ok
                ? "border-[var(--success)]/25 bg-[var(--success-soft)] text-[var(--success)]"
                : "border-[var(--danger)]/25 bg-[var(--danger-soft)] text-[var(--danger)]"
            }`}
          >
            {state.message}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[390px_1fr]">
          <Card className="rounded-[var(--radius-lg)]">
            <CardHeader className="flex-col items-start gap-1">
              <Badge variant="secondary">联系方式</Badge>
              <CardTitle>联系老师</CardTitle>
              <CardDescription>
                扫码添加微信，或填写右侧表单说明你的目标分数和备考时间。
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-soft)] p-5">
                <div className="text-sm font-semibold text-[var(--text-soft)]">
                  微信
                </div>
                <div className="mt-1 text-xl font-semibold text-[var(--text)]">
                  auschi666
                </div>

                <div className="mt-6 flex flex-col items-center justify-center">
                  <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)] transition hover:shadow-[var(--shadow-md)]">
                    <img
                      src="/qr.jpg"
                      alt="WeChat QR code"
                      className="h-auto w-56 rounded-[var(--radius-md)] object-contain"
                    />
                  </div>

                  <p className="mt-3 text-xs text-[var(--text-soft)]">
                    扫码添加微信
                  </p>
                </div>
              </div>

              <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card-soft)] p-5">
                <div className="text-sm font-semibold text-[var(--text)]">
                  咨询前可以简单准备
                </div>
                <div className="mt-3 space-y-2 text-sm leading-6 text-[var(--text-soft)]">
                  <p>当前考试类型和基础分数</p>
                  <p>目标分数和预计考试时间</p>
                  <p>目前最薄弱的题型或技能</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[var(--radius-lg)]">
            <CardHeader className="flex-col items-start gap-1">
              <Badge variant="default">预约咨询</Badge>
              <CardTitle>提交你的学习情况</CardTitle>
              <CardDescription>
                老师会根据你的目标、时间和当前基础给出下一步建议。
              </CardDescription>
            </CardHeader>

            <CardContent>
            <form action={formAction} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Input id="name" name="name" required placeholder="姓名" />
                <Input id="email" name="email" type="email" placeholder="邮箱" />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Input id="wechat" name="wechat" placeholder="微信" />
                <Input id="exam" name="exam" placeholder="考试类型，例如 PTE / IELTS" />
              </div>

              <Input id="target" name="target" placeholder="目标分数" />

              <Textarea
                id="message"
                name="message"
                rows={7}
                required
                placeholder="简单说明你的目前水平、目标分数、考试时间和想解决的问题"
              />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[var(--text-soft)]">
                  请填写邮箱或微信其中一项
                </p>
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
