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

const inputClass =
  "w-full rounded-2xl border px-4 py-3 text-sm outline-none transition duration-300 focus:-translate-y-0.5 focus:shadow-[0_0_0_4px_rgba(47,74,63,0.12)]";

const inputStyle = {
  borderColor: "var(--border)",
  background: "var(--bg)",
  color: "var(--text)",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="text-(--brand-accent) cursor-pointer inline-flex min-w-42 items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(47,74,63,0.28)] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "发送中... / Sending..." : "提交咨询 / Send Message"}
    </button>
  );
}

export default function ContactForm() {
  const [state, formAction] = useActionState(sendContactEmail, initialState);

  return (
    <section
      id="contact-form"
      className="border-t"
      style={{
        background: "var(--bg)",
        borderColor: "var(--border)",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        {state.message ? (
          <div
            className="mb-6 rounded-2xl border px-4 py-3 text-sm shadow-sm"
            style={{
              borderColor: state.ok
                ? "rgba(16,185,129,0.3)"
                : "rgba(244,63,94,0.3)",
              background: state.ok
                ? "rgba(16,185,129,0.08)"
                : "rgba(244,63,94,0.08)",
              color: "var(--text)",
            }}
          >
            {state.message}
          </div>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          {/* 左侧 */}
          <div
            className="rounded-[32px] border p-6 shadow-sm sm:p-8"
            style={{
              background: "var(--bg)",
              borderColor: "var(--border)",
            }}
          >
            <div
              className="text-sm font-medium uppercase tracking-[0.18em]"
              style={{ color: "var(--muted)" }}
            >
              Contact
            </div>

            <h2
              className="mt-4 text-2xl font-bold"
              style={{ color: "var(--text)" }}
            >
              联系老师
            </h2>

            <div className="mt-8 space-y-4">


              {/* 微信 */}
              <div
                className="rounded-3xl border p-3"
                style={{
                  borderColor: "var(--bg)",
                  background: "var(--bg)",
                }}
              >
                <div
                  className="text-sm font-medium"
                  style={{ color: "var(--muted)" }}
                >
                  WeChat / 微信
                </div>

                <div
                  className="mt-1 text-base font-semibold"
                  style={{ color: "var(--text)" }}
                >
                  auschi666
                </div>

                {/* ⭐ 居中 + 放大 QR */}
                <div className="mt-6 flex flex-col items-center justify-center">
                  <div
                    className="overflow-hidden rounded-3xl border p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:scale-[1.04] hover:shadow-xl"
                    style={{
                      borderColor: "var(--bg)",
                      background: "var(--bg)",
                    }}
                  >
                    <img
                      src="/qr.jpg"
                      alt="WeChat QR code"
                      className="w-56 h-auto rounded-2xl object-contain"
                    />
                  </div>

                  <p
                    className="mt-3 text-xs"
                    style={{ color: "var(--muted)" }}
                  >
                    扫码添加微信 / Scan to add WeChat
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧表单 */}
          <div
            className="rounded-[32px] border p-6 shadow-sm sm:p-8"
            style={{
              borderColor: "var(--border)",
              background: "var(--card)",
            }}
          >
            <div
              className="text-sm font-medium uppercase tracking-[0.18em]"
              style={{ color: "var(--muted)" }}
            >
              Send a Message
            </div>

            <h2
              className="mt-4 text-2xl font-bold"
              style={{ color: "var(--text)" }}
            >
              预约咨询 / Send an Inquiry
            </h2>

            <form action={formAction} className="mt-8 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <input id="name" name="name" required className={inputClass} style={inputStyle} placeholder="姓名 / Name" />
                <input id="email" name="email" type="email" className={inputClass} style={inputStyle} placeholder="邮箱 / Email" />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <input id="wechat" name="wechat" className={inputClass} style={inputStyle} placeholder="微信 / WeChat" />
                <input id="exam" name="exam" className={inputClass} style={inputStyle} placeholder="考试类型 / Exam Type" />
              </div>

              <input id="target" name="target" className={inputClass} style={inputStyle} placeholder="目标分数 / Target Score" />

              <textarea id="message" name="message" rows={6} required className={inputClass} style={inputStyle} placeholder="你的情况 / Message" />

              <div className="flex justify-between items-center">
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  请填写邮箱或微信其中一项
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