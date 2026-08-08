import "server-only";

import { Resend } from "resend";

import { BRAND_NAME_CN } from "@/lib/brand";
import type { MockAttemptStatus, MockExamType } from "@/lib/mock-test/types";

type SendMockScoreEmailParams = {
  to: string;
  studentName: string;
  examType: MockExamType;
  title: string;
  status: MockAttemptStatus;
  overallBand: number | null;
  pteOverallScore: number | null;
  answeredCount: number;
  correctCount: number;
  sectionScores: Record<string, unknown>;
  reportUrl: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function displayScore(params: SendMockScoreEmailParams) {
  if (params.examType === "ielts") {
    return params.overallBand ? `Overall Band ${params.overallBand}` : `${params.correctCount}/${params.answeredCount || 82}`;
  }
  return params.pteOverallScore ? `Overall ${params.pteOverallScore}` : "老师已完成确认";
}

function sectionRows(sectionScores: Record<string, unknown>) {
  const entries = Object.entries(sectionScores ?? {});
  if (entries.length === 0) return "";
  return entries.map(([key, value]) => {
    const row = value && typeof value === "object" ? value as Record<string, unknown> : {};
    const correct = typeof row.correctCount === "number" ? row.correctCount : row.rawScore;
    const band = row.bandScore ?? row.score ?? row.overallScore;
    return `<tr><td style="padding:8px 10px;border-bottom:1px solid #e3e8ef;">${escapeHtml(key)}</td><td style="padding:8px 10px;border-bottom:1px solid #e3e8ef;">${escapeHtml(String(correct ?? "-"))}</td><td style="padding:8px 10px;border-bottom:1px solid #e3e8ef;">${escapeHtml(String(band ?? "-"))}</td></tr>`;
  }).join("");
}

export async function sendMockScoreEmail(params: SendMockScoreEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    return { ok: false as const, error: "RESEND_API_KEY is not configured" };
  }

  const from = process.env.HOMEWORK_FROM_EMAIL || process.env.CONTACT_FROM_EMAIL;
  if (!from) {
    return { ok: false as const, error: "HOMEWORK_FROM_EMAIL or CONTACT_FROM_EMAIL is not configured" };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const examLabel = params.examType.toUpperCase();
  const rows = sectionRows(params.sectionScores);
  const html = `
    <div style="background:#f6f8fb;padding:28px;font-family:Inter,Arial,sans-serif;color:#17212f;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e3e8ef;border-radius:14px;overflow:hidden;">
        <div style="padding:24px 28px;border-bottom:1px solid #e3e8ef;">
          <div style="font-size:13px;font-weight:700;color:#13795b;letter-spacing:.04em;">${escapeHtml(BRAND_NAME_CN)} Mock Test</div>
          <h1 style="margin:10px 0 0;font-size:22px;line-height:1.35;color:#0f172a;">你的${examLabel}模考成绩已发布</h1>
        </div>
        <div style="padding:24px 28px;">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155;">${escapeHtml(params.studentName)}，老师已经确认并发布了本次模考结果。</p>
          <div style="margin:18px 0;padding:18px;border:1px solid #d9e5dd;border-radius:12px;background:#f4fbf7;">
            <p style="margin:0;font-size:13px;color:#64748b;">${escapeHtml(params.title)}</p>
            <p style="margin:8px 0 0;font-size:28px;font-weight:800;color:#13795b;">${escapeHtml(displayScore(params))}</p>
            <p style="margin:8px 0 0;font-size:13px;color:#64748b;">答题 ${params.answeredCount} 题${params.examType === "ielts" ? ` · 正确 ${params.correctCount} 题` : ""}</p>
          </div>
          ${rows ? `<table style="width:100%;border-collapse:collapse;margin:12px 0 18px;font-size:13px;color:#334155;"><thead><tr><th align="left" style="padding:8px 10px;border-bottom:1px solid #cbd5e1;">Section</th><th align="left" style="padding:8px 10px;border-bottom:1px solid #cbd5e1;">Raw</th><th align="left" style="padding:8px 10px;border-bottom:1px solid #cbd5e1;">Score</th></tr></thead><tbody>${rows}</tbody></table>` : ""}
          <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#475569;">完整报告包含原题全文、学生答案、正确答案、录音链接和逐题反馈。请登录你的账户查看。</p>
          <a href="${escapeHtml(params.reportUrl)}" style="display:inline-block;background:#13795b;color:#ffffff;text-decoration:none;border-radius:10px;padding:12px 18px;font-weight:700;font-size:14px;">查看完整报告</a>
        </div>
      </div>
    </div>
  `;

  try {
    await resend.emails.send({
      from,
      to: params.to,
      subject: `${examLabel} 模考成绩已发布 - ${BRAND_NAME_CN}`,
      html,
    });
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Email send failed" };
  }
}
