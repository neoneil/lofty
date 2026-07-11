import { PDFDocument, type PDFFont, rgb, StandardFonts } from "pdf-lib";
import { getServerUser, getServerUserWithRole } from "@/lib/auth/server-auth";
import { pteTemplateData } from "@/lib/pte-templates";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 48;
const MARGIN_TOP = 56;
const MARGIN_BOTTOM = 46;
const BODY_SIZE = 10.5;
const SMALL_SIZE = 8.5;
const TITLE_SIZE = 19;
const SUBTITLE_SIZE = 13;
const LINE_GAP = 4;

function toPdfResponseBuffer(bytes: Uint8Array) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function safePdfText(text: string | null | undefined) {
  if (!text) return "";
  return text
    .replace(/【[^】]*】/g, "[placeholder]")
    .replace(/[•]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u00A0/g, " ")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
}

function wrapText(text: string, maxWidth: number, font: PDFFont, fontSize: number) {
  const paragraphs = safePdfText(text).split("\n");
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const p = paragraph.trim();
    if (!p) {
      lines.push("");
      continue;
    }

    const words = p.split(/\s+/);
    let current = "";

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
        current = candidate;
        continue;
      }

      if (current) lines.push(current);
      if (font.widthOfTextAtSize(word, fontSize) <= maxWidth) {
        current = word;
        continue;
      }

      let chunk = "";
      for (const ch of word) {
        const test = chunk + ch;
        if (font.widthOfTextAtSize(test, fontSize) <= maxWidth) {
          chunk = test;
        } else {
          if (chunk) lines.push(chunk);
          chunk = ch;
        }
      }
      current = chunk;
    }

    if (current) lines.push(current);
  }

  return lines;
}

export async function GET() {
  const context = await getServerUser();
  if (!context) return new Response("Unauthorized", { status: 401 });

  const adminContext = await getServerUserWithRole(["admin"], context);
  if (!adminContext) return new Response("Forbidden", { status: 403 });

  try {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const contentWidth = PAGE_WIDTH - MARGIN_X * 2;
    let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let y = PAGE_HEIGHT - MARGIN_TOP;

    const ensureSpace = (neededHeight: number) => {
      if (y - neededHeight < MARGIN_BOTTOM) {
        page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        y = PAGE_HEIGHT - MARGIN_TOP;
      }
    };

    const drawLine = (text: string, opts?: { size?: number; bold?: boolean; color?: [number, number, number] }) => {
      const size = opts?.size ?? BODY_SIZE;
      const usedFont = opts?.bold ? boldFont : font;
      const color = opts?.color ?? [0, 0, 0];
      const lines = wrapText(text, contentWidth, usedFont, size);

      for (const line of lines) {
        ensureSpace(size + LINE_GAP);
        page.drawText(line || " ", { x: MARGIN_X, y, size, font: usedFont, color: rgb(color[0], color[1], color[2]) });
        y -= size + LINE_GAP;
      }
    };

    const addGap = (amount = 8) => {
      y -= amount;
    };

    drawLine("PTE Templates", { size: TITLE_SIZE, bold: true, color: [0.12, 0.16, 0.22] });
    drawLine(`Exam: ${safePdfText(pteTemplateData.exam) || "PTE Academic"}`, { size: SUBTITLE_SIZE });
    drawLine(`Version: ${safePdfText(pteTemplateData.version) || "1.0.0"} | Groups: ${pteTemplateData.templateGroups.length}`, { size: SMALL_SIZE, color: [0.35, 0.38, 0.44] });
    addGap(14);

    pteTemplateData.templateGroups.forEach((group) => {
      drawLine(`${group.questionType} - ${group.title}`, { size: SUBTITLE_SIZE, bold: true, color: [0.1, 0.24, 0.48] });
      drawLine(`Template status: ${group.needTemplate ? "Required" : "Not required"}`, { size: SMALL_SIZE, color: [0.35, 0.38, 0.44] });
      addGap(5);

      group.scores.forEach((score) => {
        drawLine(`Level ${score.level}`, { size: BODY_SIZE, bold: true });
        score.categories.forEach((category, index) => {
          drawLine(`${index + 1}. ${safePdfText(category.key) || "template"}`, { size: BODY_SIZE, bold: true, color: [0.18, 0.18, 0.18] });
          drawLine(category.template);
          addGap(7);
        });
        addGap(6);
      });
      addGap(10);
    });

    const pages = pdfDoc.getPages();
    pages.forEach((pdfPage, index) => {
      const pageLabel = `Page ${index + 1} of ${pages.length}`;
      pdfPage.drawText("LOFTY EDUCATION", { x: MARGIN_X, y: 22, size: SMALL_SIZE, font, color: rgb(0.45, 0.48, 0.54) });
      pdfPage.drawText(pageLabel, { x: PAGE_WIDTH - MARGIN_X - font.widthOfTextAtSize(pageLabel, SMALL_SIZE), y: 22, size: SMALL_SIZE, font, color: rgb(0.45, 0.48, 0.54) });
    });

    const pdfBytes = await pdfDoc.save();

    return new Response(toPdfResponseBuffer(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=\"pte-templates.pdf\"",
      },
    });
  } catch (error) {
    console.error("PTE templates PDF export error:", error);
    return new Response("Failed to export PTE templates PDF", { status: 500 });
  }
}
