"use server";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type ContactFormState = {
  ok: boolean;
  message: string;
};

export async function sendContactEmail(
  _prevState: ContactFormState,
  formData: FormData
) {
  try {
    const name = String(formData.get("name") || "");
    const email = String(formData.get("email") || "");
    const wechat = String(formData.get("wechat") || "");
    const message = String(formData.get("message") || "");

    if (!name || !message || (!email && !wechat)) {
      return {
        ok: false,
        message: "请填写必要信息 / Missing required fields",
      };
    }

    await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL!,
      to: process.env.CONTACT_TO_EMAIL!,
      subject: `New Inquiry - ${name}`,
      replyTo: email || undefined,
      html: `
        <h2>New Contact</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email || "N/A"}</p>
        <p><b>WeChat:</b> ${wechat || "N/A"}</p>
        <p><b>Message:</b></p>
        <p>${message}</p>
      `,
    });

    return {
      ok: true,
      message: "提交成功，我们会联系你！",
    };
  } catch {
    return {
      ok: false,
      message: "发送失败，请稍后再试",
    };
  }
}
