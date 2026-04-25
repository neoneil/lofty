"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
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
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-w-42 items-center justify-center rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
    >
      {pending ? "发送中... / Sending..." : "提交咨询 / Send Message"}
    </button>
  );
}

export default function ContactForm() {
  const [state, formAction] = useActionState(sendContactEmail, initialState);

  return (
    <section id="contact-form" className="border-t"  style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        {state.message ? (
          <div
            className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${
              state.ok
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            {state.message}
          </div>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border p-6 shadow-sm sm:p-8" style={{ background: "var(--card-soft)", borderColor: "var(--border)" }}>
            <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
              Contact
            </div>
            <h2 className="mt-4 text-2xl font-bold text-slate-950">联系致远教育</h2>

            <div className="mt-8 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-medium text-slate-500">Email</div>
                <a
                  href="mailto:hello@loftyeducation.com"
                  className="mt-1 block break-all text-base font-semibold text-slate-950 hover:underline"
                >
                  hello@loftyeducation.com
                </a>
              </div>

              <div id="wechat" className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-medium text-slate-500">WeChat / 微信</div>
                <div className="mt-1 text-base font-semibold text-slate-950">
                  LoftyEducation
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
              Send a Message
            </div>
            <h2 className="mt-4 text-2xl font-bold text-slate-950">
              预约咨询 / Send an Inquiry
            </h2>

            <form action={formAction} className="mt-8 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">
                    姓名 / Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                    邮箱 / Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="wechat" className="mb-2 block text-sm font-medium text-slate-700">
                    微信 / WeChat
                  </label>
                  <input
                    id="wechat"
                    name="wechat"
                    type="text"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div>
                  <label htmlFor="exam" className="mb-2 block text-sm font-medium text-slate-700">
                    考试类型 / Exam Type
                  </label>
                  <input
                    id="exam"
                    name="exam"
                    type="text"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="target" className="mb-2 block text-sm font-medium text-slate-700">
                  目标分数 / Target Score
                </label>
                <input
                  id="target"
                  name="target"
                  type="text"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label htmlFor="message" className="mb-2 block text-sm font-medium text-slate-700">
                  你的情况 / Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  required
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-6 text-slate-500">
                  请至少填写邮箱或微信其中一项。 / Please provide at least one of: email or WeChat.
                </p>
                <SubmitButton />
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}