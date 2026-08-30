import "server-only";

import fontkit from "@pdf-lib/fontkit";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, rgb, type PDFFont } from "pdf-lib";
import { Resend } from "resend";

import { BRAND_NAME_CN } from "@/lib/brand";

type ReceiptLineItem = {
  label: string;
  description: string;
  quantity: string;
  amountAudCents: number;
};

type SendPaymentReceiptEmailParams = {
  to: string | null | undefined;
  studentName?: string | null;
  receiptTitle: string;
  receiptType: "AI Access" | "Tuition";
  checkoutSessionId: string;
  paymentIntentId: string | null;
  paidAt: Date;
  amountAudCents: number | null;
  lineItems: ReceiptLineItem[];
};

type ReceiptDisplayItem = {
  itemCn: string;
  itemEn: string;
  descriptionCn: string;
  descriptionEn: string;
  quantity: string;
  amountAudCents: number;
};

type DrawTextOptions = {
  size: number;
  font: PDFFont;
  color: ReturnType<typeof rgb>;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatAud(cents: number | null | undefined) {
  if (typeof cents !== "number" || !Number.isFinite(cents)) return "A$0";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(cents / 100);
}

function formatReceiptDate(date: Date) {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatReceiptDateCode(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Sydney",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "00";
  const day = parts.find((part) => part.type === "day")?.value ?? "00";
  return `${year}${month}${day}`;
}

function getStableReceiptNumber(date: Date, checkoutSessionId: string) {
  let hash = 0;
  for (const char of checkoutSessionId) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  const sequence = 24 + (hash % 900);
  return `LFY-${formatReceiptDateCode(date)}-${String(sequence).padStart(3, "0")}`;
}

function extractFirstNumber(value: string, fallback: number) {
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : fallback;
}

function normalizeDisplayItem(params: SendPaymentReceiptEmailParams): ReceiptDisplayItem {
  const first = params.lineItems[0];
  const amountAudCents = first?.amountAudCents ?? params.amountAudCents ?? 0;
  const rawLabel = first?.label ?? params.receiptTitle;
  const rawDescription = first?.description ?? "";

  if (params.receiptType === "Tuition") {
    const numbers = rawDescription.match(/\d+/g)?.map(Number).filter(Number.isFinite) ?? [];
    const lessons = numbers[0] ?? extractFirstNumber(rawLabel, 1);
    const hours = numbers[1] ?? lessons * 2;
    return {
      itemCn: "一对一课程学费",
      itemEn: "1-on-1 tuition fee",
      descriptionCn: lessons === 1 ? "单次课 / 2 小时" : `${lessons} 次课 / ${hours} 小时`,
      descriptionEn: `${lessons} lesson${lessons > 1 ? "s" : ""} / ${hours} hours`,
      quantity: lessons === 1 ? "1 次" : `${lessons} 次`,
      amountAudCents,
    };
  }

  const scope = rawLabel.toUpperCase().includes("PTE") ? "PTE" : "IELTS";
  const days = extractFirstNumber(rawDescription, extractFirstNumber(rawLabel, 30));
  return {
    itemCn: `${scope} AI 学习助手`,
    itemEn: `${scope} AI study assistant`,
    descriptionCn: `${days} 天一次性时间包`,
    descriptionEn: `${days}-day one-time access package`,
    quantity: `${days} 天`,
    amountAudCents,
  };
}

async function loadReceiptFont() {
  return readFile(join(process.cwd(), "public", "fonts", "NotoSansSC-VF.ttf"));
}

function drawText(page: Parameters<PDFDocument["addPage"]>[0] extends never ? never : ReturnType<PDFDocument["addPage"]>, text: string, x: number, y: number, options: DrawTextOptions) {
  page.drawText(text, {
    x,
    y,
    size: options.size,
    font: options.font,
    color: options.color,
  });
}

function drawLabel(page: ReturnType<PDFDocument["addPage"]>, cn: string, en: string, x: number, y: number, font: PDFFont, color: ReturnType<typeof rgb>, muted: ReturnType<typeof rgb>) {
  drawText(page, cn, x, y, { size: 9.5, font, color });
  drawText(page, en, x, y - 15, { size: 7.5, font, color: muted });
}

function drawWrappedLines(page: ReturnType<PDFDocument["addPage"]>, lines: string[], x: number, y: number, font: PDFFont, color: ReturnType<typeof rgb>) {
  lines.forEach((line, index) => {
    drawText(page, line, x, y - index * 16, { size: 9, font, color });
  });
}

export async function createReceiptPdf(params: SendPaymentReceiptEmailParams) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);

  const page = pdf.addPage([595, 842]);
  const { width } = page.getSize();
  const fontBytes = await loadReceiptFont();
  const font = await pdf.embedFont(fontBytes, { subset: true });
  const primary = rgb(0.07, 0.43, 0.32);
  const text = rgb(0.09, 0.13, 0.18);
  const muted = rgb(0.39, 0.45, 0.55);
  const faint = rgb(0.58, 0.63, 0.70);
  const border = rgb(0.85, 0.88, 0.92);
  const pageBg = rgb(0.985, 0.988, 0.992);
  const cardBg = rgb(0.97, 0.98, 0.985);
  const softGreen = rgb(0.94, 0.985, 0.955);
  const item = normalizeDisplayItem(params);
  const amount = formatAud(params.amountAudCents);
  const receiptTitleCn = params.receiptType === "Tuition" ? "学费付款收据" : "AI 权限付款收据";
  const receiptTitleEn = params.receiptType === "Tuition" ? "Tuition Payment Receipt" : "AI Access Payment Receipt";
  const payerName = params.studentName?.trim() || "N/A";
  const payerEmail = params.to?.trim() || "N/A";
  const receiptNumber = getStableReceiptNumber(params.paidAt, params.checkoutSessionId);

  page.drawRectangle({ x: 0, y: 0, width, height: 842, color: pageBg });

  drawText(page, "小马哥教育", 48, 780, { size: 16, font, color: primary });
  drawText(page, "Lofty Education", 48, 763, { size: 8, font, color: muted });
  drawText(page, receiptTitleCn, 48, 708, { size: 23, font, color: text });
  drawText(page, receiptTitleEn, 48, 686, { size: 8.5, font, color: muted });
  drawText(page, formatReceiptDate(params.paidAt), 48, 660, { size: 8.5, font, color: muted });

  page.drawRectangle({ x: 410, y: 706, width: 137, height: 72, color: primary, borderColor: primary, borderWidth: 1 });
  drawText(page, "已付款", 430, 750, { size: 16, font, color: rgb(1, 1, 1) });
  drawText(page, "Paid", 430, 734, { size: 8, font, color: rgb(0.92, 1, 0.96) });
  drawText(page, amount, 430, 708, { size: 16, font, color: rgb(1, 1, 1) });
  drawText(page, "Australian dollars", 430, 693, { size: 7.5, font, color: rgb(0.92, 1, 0.96) });

  page.drawLine({ start: { x: 48, y: 635 }, end: { x: 547, y: 635 }, thickness: 1, color: border });

  page.drawRectangle({ x: 48, y: 535, width: 238, height: 78, color: cardBg, borderColor: border, borderWidth: 1 });
  drawLabel(page, "交费方", "Paid by", 68, 584, font, muted, faint);
  drawText(page, payerName, 68, 552, { size: 12.5, font, color: text });
  drawText(page, payerEmail, 68, 535 + 15, { size: 9.5, font, color: muted });

  page.drawRectangle({ x: 309, y: 535, width: 238, height: 78, color: cardBg, borderColor: border, borderWidth: 1 });
  drawLabel(page, "收款方", "Merchant", 329, 584, font, muted, faint);
  drawText(page, "小马哥教育", 329, 552, { size: 12.5, font, color: text });
  drawText(page, "Lofty Education, Australia", 329, 535 + 15, { size: 9, font, color: muted });
  drawText(page, "Melbourne, Australia", 329, 535 + 2, { size: 8, font, color: faint });

  drawText(page, "付款明细", 48, 492, { size: 17, font, color: text });
  drawText(page, "Payment summary", 48, 475, { size: 8, font, color: muted });
  drawText(page, "收据编号 / Receipt No.", 410, 492, { size: 8, font, color: muted });
  drawText(page, receiptNumber, 410, 476, { size: 9, font, color: text });

  page.drawRectangle({ x: 48, y: 425, width: 499, height: 36, color: softGreen, borderColor: border, borderWidth: 1 });
  drawLabel(page, "项目", "Item", 66, 446, font, muted, faint);
  drawLabel(page, "数量", "Quantity", 365, 446, font, muted, faint);
  drawLabel(page, "金额", "Amount", 465, 446, font, muted, faint);

  page.drawRectangle({ x: 48, y: 352, width: 499, height: 74, color: rgb(1, 1, 1), borderColor: border, borderWidth: 1 });
  drawText(page, item.itemCn, 66, 401, { size: 11, font, color: text });
  drawText(page, item.itemEn, 66, 384, { size: 8.5, font, color: muted });
  drawText(page, item.descriptionCn, 66, 365, { size: 8.8, font, color: muted });
  drawText(page, item.descriptionEn, 66, 351 + 2, { size: 8, font, color: faint });
  drawText(page, item.quantity, 365, 392, { size: 10, font, color: text });
  drawText(page, formatAud(item.amountAudCents), 465, 392, { size: 11, font, color: text });

  page.drawRectangle({ x: 350, y: 286, width: 197, height: 58, color: cardBg, borderColor: border, borderWidth: 1 });
  drawText(page, "合计", 370, 318, { size: 9, font, color: muted });
  drawText(page, "Total paid", 370, 303, { size: 8, font, color: muted });
  drawText(page, amount, 458, 304, { size: 18, font, color: primary });

  page.drawRectangle({ x: 48, y: 160, width: 499, height: 92, color: softGreen, borderColor: rgb(0.82, 0.92, 0.86), borderWidth: 1 });
  drawText(page, "付款说明", 68, 226, { size: 10.5, font, color: text });
  drawText(page, "Payment notes", 68, 211, { size: 7.8, font, color: muted });
  drawWrappedLines(page, [
    "本收据用于确认 Lofty Education 已收到对应服务款项。",
    "This receipt confirms payment received by Lofty Education for the selected service.",
    "本文件不是 tax invoice。如需课程安排、付款核对或退款协助，请联系 Lofty Education 管理员。",
    "This document is not a tax invoice. For scheduling, payment checks, or refund support, please contact Lofty Education.",
  ], 68, 190, font, muted);

  page.drawLine({ start: { x: 48, y: 110 }, end: { x: 547, y: 110 }, thickness: 1, color: border });
  drawText(page, "小马哥教育", 48, 88, { size: 9, font, color: text });
  drawText(page, "Lofty Education - Australia", 48, 73, { size: 8, font, color: muted });
  drawText(page, "Generated securely after successful payment", 346, 80, { size: 8, font, color: muted });

  return Buffer.from(await pdf.save());
}

export async function sendPaymentReceiptEmail(params: SendPaymentReceiptEmailParams) {
  if (!params.to) {
    return { ok: false as const, error: "Missing receipt email recipient" };
  }

  if (!process.env.RESEND_API_KEY) {
    return { ok: false as const, error: "RESEND_API_KEY is not configured" };
  }

  const from = process.env.HOMEWORK_FROM_EMAIL || process.env.CONTACT_FROM_EMAIL;
  if (!from) {
    return { ok: false as const, error: "HOMEWORK_FROM_EMAIL or CONTACT_FROM_EMAIL is not configured" };
  }

  const pdf = await createReceiptPdf(params);
  const resend = new Resend(process.env.RESEND_API_KEY);
  const html = `
    <div style="background:#f6f8fb;padding:28px;font-family:Inter,Arial,sans-serif;color:#17212f;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e3e8ef;border-radius:14px;overflow:hidden;">
        <div style="padding:24px 28px;border-bottom:1px solid #e3e8ef;">
          <div style="font-size:13px;font-weight:700;color:#13795b;letter-spacing:.04em;">${escapeHtml(BRAND_NAME_CN)} Receipt</div>
          <h1 style="margin:10px 0 0;font-size:22px;line-height:1.35;color:#0f172a;">付款收据 / Payment receipt</h1>
        </div>
        <div style="padding:24px 28px;">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155;">你的付款已成功记录。收据 PDF 已附在本邮件中。</p>
          <div style="margin:18px 0;padding:18px;border:1px solid #d9e5dd;border-radius:12px;background:#f4fbf7;">
            <p style="margin:0;font-size:13px;color:#64748b;">${escapeHtml(params.receiptTitle)}</p>
            <p style="margin:8px 0 0;font-size:28px;font-weight:800;color:#13795b;">${escapeHtml(formatAud(params.amountAudCents))}</p>
            <p style="margin:8px 0 0;font-size:13px;color:#64748b;">${escapeHtml(formatReceiptDate(params.paidAt))}</p>
          </div>
          <p style="margin:0;font-size:13px;line-height:1.7;color:#64748b;">如付款信息有误，请联系 Lofty Education 管理员处理。</p>
        </div>
      </div>
    </div>
  `;

  try {
    await resend.emails.send({
      from,
      to: params.to,
      subject: `${params.receiptTitle} - ${BRAND_NAME_CN}`,
      html,
      attachments: [{
        filename: `lofty-receipt-${params.checkoutSessionId}.pdf`,
        content: pdf,
        contentType: "application/pdf",
      }],
    });

    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Receipt email send failed" };
  }
}
