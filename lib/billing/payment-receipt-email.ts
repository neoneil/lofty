import "server-only";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
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

function sanitizePdfText(value: string) {
  return value.replace(/[^\x20-\x7E]/g, "");
}

function wrapText(value: string, maxChars: number) {
  const words = sanitizePdfText(value).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

async function createReceiptPdf(params: SendPaymentReceiptEmailParams) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const { width } = page.getSize();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const primary = rgb(0.07, 0.43, 0.32);
  const text = rgb(0.09, 0.13, 0.18);
  const muted = rgb(0.39, 0.45, 0.55);
  const border = rgb(0.85, 0.88, 0.92);
  const soft = rgb(0.96, 0.98, 0.97);
  let y = 780;

  page.drawRectangle({ x: 0, y: 0, width, height: 842, color: rgb(0.985, 0.988, 0.992) });
  page.drawText("LOFTY EDUCATION", { x: 48, y, size: 12, font: bold, color: primary });
  page.drawText("Payment Receipt", { x: 48, y: y - 36, size: 30, font: bold, color: text });
  page.drawText(formatReceiptDate(params.paidAt), { x: 48, y: y - 60, size: 10, font, color: muted });

  page.drawRectangle({ x: 390, y: 725, width: 155, height: 70, color: primary, borderColor: primary, borderWidth: 1 });
  page.drawText("PAID", { x: 414, y: 760, size: 22, font: bold, color: rgb(1, 1, 1) });
  page.drawText(formatAud(params.amountAudCents), { x: 414, y: 742, size: 11, font, color: rgb(0.92, 1, 0.96) });

  y = 675;
  page.drawRectangle({ x: 48, y: y - 96, width: 499, height: 96, color: rgb(1, 1, 1), borderColor: border, borderWidth: 1 });
  page.drawText("Billed to", { x: 68, y: y - 26, size: 10, font: bold, color: muted });
  page.drawText(sanitizePdfText(params.studentName || "Student"), { x: 68, y: y - 46, size: 13, font: bold, color: text });
  page.drawText(sanitizePdfText(params.to ?? ""), { x: 68, y: y - 64, size: 10, font, color: muted });
  page.drawText("Receipt type", { x: 350, y: y - 26, size: 10, font: bold, color: muted });
  page.drawText(params.receiptType, { x: 350, y: y - 46, size: 13, font: bold, color: text });

  y = 530;
  page.drawText("Summary", { x: 48, y, size: 15, font: bold, color: text });
  y -= 24;
  page.drawRectangle({ x: 48, y: y - 34, width: 499, height: 38, color: soft, borderColor: border, borderWidth: 1 });
  page.drawText("Item", { x: 66, y: y - 12, size: 10, font: bold, color: muted });
  page.drawText("Qty", { x: 365, y: y - 12, size: 10, font: bold, color: muted });
  page.drawText("Amount", { x: 450, y: y - 12, size: 10, font: bold, color: muted });
  y -= 38;

  for (const item of params.lineItems) {
    const lines = wrapText(`${item.label} - ${item.description}`, 58);
    const rowHeight = Math.max(46, 22 + lines.length * 13);
    page.drawRectangle({ x: 48, y: y - rowHeight + 6, width: 499, height: rowHeight, color: rgb(1, 1, 1), borderColor: border, borderWidth: 1 });
    lines.forEach((line, index) => {
      page.drawText(line, { x: 66, y: y - 16 - index * 13, size: 10.5, font: index === 0 ? bold : font, color: text });
    });
    page.drawText(sanitizePdfText(item.quantity), { x: 365, y: y - 16, size: 10.5, font, color: text });
    page.drawText(formatAud(item.amountAudCents), { x: 450, y: y - 16, size: 10.5, font: bold, color: text });
    y -= rowHeight;
  }

  y -= 16;
  page.drawLine({ start: { x: 350, y }, end: { x: 547, y }, thickness: 1, color: border });
  page.drawText("Total paid", { x: 350, y: y - 24, size: 11, font: bold, color: text });
  page.drawText(formatAud(params.amountAudCents), { x: 450, y: y - 24, size: 13, font: bold, color: primary });

  y -= 78;
  page.drawText("Payment details", { x: 48, y, size: 15, font: bold, color: text });
  page.drawText(`Checkout Session: ${sanitizePdfText(params.checkoutSessionId)}`, { x: 48, y: y - 24, size: 9, font, color: muted });
  page.drawText(`Payment Intent: ${sanitizePdfText(params.paymentIntentId ?? "-")}`, { x: 48, y: y - 40, size: 9, font, color: muted });
  page.drawText("This receipt confirms payment received by Lofty Education. It is not a tax invoice.", { x: 48, y: 70, size: 9, font, color: muted });
  page.drawText("Lofty Education - Australia", { x: 48, y: 52, size: 9, font: bold, color: muted });

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
