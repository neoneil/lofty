import "server-only";

import { Resend } from "resend";

import { BRAND_NAME_CN } from "@/lib/brand";
import type { HomeworkExamType } from "@/lib/homework/types";

type SendHomeworkEmailParams = {
  to: string;
  studentName: string;
  teacherEmail: string | null;
  examType: HomeworkExamType;
  content: string;
  homeworkUrl: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatHomeworkContent(content: string) {
  return escapeHtml(content)
    .split(/\r?\n/)
    .map((line) => line.trim() ? `<p style="margin:0 0 10px;">${line}</p>` : `<div style="height:10px;"></div>`)
    .join("");
}

export async function sendHomeworkEmail({ to, studentName, teacherEmail, examType, content, homeworkUrl }: SendHomeworkEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    return { ok: false as const, error: "RESEND_API_KEY is not configured" };
  }

  const from = process.env.HOMEWORK_FROM_EMAIL || process.env.CONTACT_FROM_EMAIL;
  if (!from) {
    return { ok: false as const, error: "HOMEWORK_FROM_EMAIL or CONTACT_FROM_EMAIL is not configured" };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const subjectExam = examType === "General" ? "学习" : examType;
  const html = `
    <div style="background:#f6f8fb;padding:28px;font-family:Inter,Arial,sans-serif;color:#17212f;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e3e8ef;border-radius:14px;overflow:hidden;">
        <div style="padding:24px 28px;border-bottom:1px solid #e3e8ef;">
          <div style="font-size:13px;font-weight:700;color:#13795b;letter-spacing:.04em;">${escapeHtml(BRAND_NAME_CN)} Homework</div>
          <h1 style="margin:10px 0 0;font-size:22px;line-height:1.35;color:#0f172a;">你收到了一份新的${escapeHtml(subjectExam)}作业</h1>
        </div>
        <div style="padding:24px 28px;">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155;">${escapeHtml(studentName)}，老师已经为你布置了新的练习任务。</p>
          <div style="margin:18px 0;padding:18px;border:1px solid #d9e5dd;border-radius:12px;background:#f4fbf7;font-size:15px;line-height:1.75;color:#17212f;">
            ${formatHomeworkContent(content)}
          </div>
          <a href="${escapeHtml(homeworkUrl)}" style="display:inline-block;margin-top:8px;background:#13795b;color:#ffffff;text-decoration:none;border-radius:10px;padding:12px 18px;font-weight:700;font-size:14px;">查看我的作业</a>
          ${teacherEmail ? `<p style="margin:18px 0 0;font-size:12px;color:#64748b;">发送老师：${escapeHtml(teacherEmail)}</p>` : ""}
        </div>
      </div>
    </div>
  `;

  try {
    await resend.emails.send({
      from,
      to,
      subject: `新的${subjectExam}作业 - ${BRAND_NAME_CN}`,
      html,
      replyTo: teacherEmail ?? undefined,
    });

    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Email send failed" };
  }
}
