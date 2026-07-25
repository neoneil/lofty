import { NextRequest } from "next/server";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  degrees,
  PDFFont,
} from "pdf-lib";
import { requireApiRole } from "@/lib/auth/require-api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 50;
const MARGIN_TOP = 60;
const MARGIN_BOTTOM = 50;

const BODY_SIZE = 11;
const SMALL_SIZE = 9;
const TITLE_SIZE = 20;
const LINE_GAP = 4;

type ExportPayload = {
  exportKey: string;
};

type ExportRow = Record<string, string | number | boolean | null | undefined>;

type ExportConfig = {
  title: string;
  schema: string;
  table: string;
  select: string;
  sortColumns?: { column: string; ascending?: boolean }[];
  formatter: (item: ExportRow, index: number) => string[];
};

const EXPORT_CONFIG: Record<string, ExportConfig> = {
  "pte-wfd": {
    title: "PTE WFD",
    schema: "pte",
    table: "wfd",
    select: "id, question_text, created_at",
    sortColumns: [{ column: "created_at", ascending: false }],
    formatter: (item, index) => [
      `${index + 1}. ${item.question_text || ""}`,
      "",
      "------------------------------------------------------------",
      "",
    ],
  },

  "pte-ra": {
    title: "PTE RA",
    schema: "pte",
    table: "ra",
    select: "id, question_text, created_at",
    sortColumns: [{ column: "created_at", ascending: false }],
    formatter: (item, index) => [
      `${index + 1}. ${item.question_text || ""}`,
      "",
      "------------------------------------------------------------",
      "",
    ],
  },

  "pte-rs": {
    title: "PTE RS",
    schema: "pte",
    table: "rs",
    select: "id, question_text, created_at",
    sortColumns: [{ column: "created_at", ascending: false }],
    formatter: (item, index) => [
      `${index + 1}. ${item.question_text || ""}`,
      "",
      "------------------------------------------------------------",
      "",
    ],
  },

  "pte-di": {
    title: "PTE DI",
    schema: "pte",
    table: "di",
    select: "id, question_text, created_at",
    sortColumns: [{ column: "created_at", ascending: false }],
    formatter: (item, index) => [
      `${index + 1}. ${item.question_text || item.prompt_text || ""}`,
      "",
      "------------------------------------------------------------",
      "",
    ],
  },

  "pte-rl": {
    title: "PTE RL",
    schema: "pte",
    table: "rl",
    select: "id, question_text, created_at",
    sortColumns: [{ column: "created_at", ascending: false }],
    formatter: (item, index) => [
      `${index + 1}. ${item.question_text || item.prompt_text || ""}`,
      "",
      "------------------------------------------------------------",
      "",
    ],
  },

  "pte-asq": {
    title: "PTE ASQ",
    schema: "pte",
    table: "asq",
    select: "id, question_text, answer_text, created_at",
    sortColumns: [{ column: "created_at", ascending: false }],
    formatter: (item, index) => [
      `${index + 1}. ${item.question_text || ""}`,
      item.answer_text ? `Answer: ${item.answer_text}` : "",
      "",
      "------------------------------------------------------------",
      "",
    ],
  },

  "pte-sst": {
    title: "PTE SST",
    schema: "pte",
    table: "sst",
    select: "id, question_text, transcript_text, created_at",
    sortColumns: [{ column: "created_at", ascending: false }],
    formatter: (item, index) => [
      `${index + 1}. ${item.question_text || item.prompt_text || item.title || ""}`,
      "",
      `Transcript:`,
      `${item.transcript_text || ""}`,
      "",
      "------------------------------------------------------------",
      "",
    ],
  },

  "pte-fib-rw": {
    title: "PTE FIB-RW",
    schema: "pte",
    table: "fib_rw",
    select: "id, question_text, created_at",
    sortColumns: [{ column: "created_at", ascending: false }],
    formatter: (item, index) => [
      `${index + 1}. ${item.question_text || ""}`,
      "",
      "------------------------------------------------------------",
      "",
    ],
  },

  "pte-fib-r": {
    title: "PTE FIB-R",
    schema: "pte",
    table: "fib_r",
    select: "id, question_text, created_at",
    sortColumns: [{ column: "created_at", ascending: false }],
    formatter: (item, index) => [
      `${index + 1}. ${item.question_text || ""}`,
      "",
      "------------------------------------------------------------",
      "",
    ],
  },

  "pte-ro": {
    title: "PTE RO",
    schema: "pte",
    table: "ro",
    select: "id, question_text, created_at",
    sortColumns: [{ column: "created_at", ascending: false }],
    formatter: (item, index) => [
      `${index + 1}. ${item.question_text || ""}`,
      "",
      "------------------------------------------------------------",
      "",
    ],
  },

  "pte-hiw": {
    title: "PTE HIW",
    schema: "pte",
    table: "hiw",
    select: "id, question_text, created_at",
    sortColumns: [{ column: "created_at", ascending: false }],
    formatter: (item, index) => [
      `${index + 1}. ${item.question_text || ""}`,
      "",
      "------------------------------------------------------------",
      "",
    ],
  },

  "pte-smw": {
    title: "PTE SMW",
    schema: "pte",
    table: "smw",
    select: "id, question_text, created_at",
    sortColumns: [{ column: "created_at", ascending: false }],
    formatter: (item, index) => [
      `${index + 1}. ${item.question_text || ""}`,
      "",
      "------------------------------------------------------------",
      "",
    ],
  },
};

function safePdfText(text: string | null | undefined) {
  if (!text) return "";

  return text
    .replace(/[•]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u00A0/g, " ")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
}

function wrapText(
  text: string,
  maxWidth: number,
  font: PDFFont,
  fontSize: number
): string[] {
  const raw = safePdfText(text);
  const paragraphs = raw.split("\n");
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      lines.push("");
      continue;
    }

    const words = paragraph.split(/\s+/);
    let current = "";

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      const width = font.widthOfTextAtSize(candidate, fontSize);

      if (width <= maxWidth) {
        current = candidate;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    }

    if (current) lines.push(current);
  }

  return lines;
}

function addWatermarkAndFooter(
  pdfDoc: PDFDocument,
  font: PDFFont,
  boldFont: PDFFont
) {
  const pages = pdfDoc.getPages();
  const totalPages = pages.length;

  pages.forEach((page, index) => {
    const { width, height } = page.getSize();

    page.drawText("LOFTY EDUCATION", {
      x: width / 2 - 200,
      y: height / 2 - 170,
      size: 58,
      font: boldFont,
      color: rgb(0.85, 0.85, 0.85),
      rotate: degrees(45),
      opacity: 0.18,
    });

    page.drawText("Generated by Chi", {
      x: 40,
      y: 20,
      size: 9,
      font,
      color: rgb(0.55, 0.55, 0.55),
    });

    const pageLabel = `Page ${index + 1} of ${totalPages}`;
    const pageLabelWidth = font.widthOfTextAtSize(pageLabel, 9);

    page.drawText(pageLabel, {
      x: width - 40 - pageLabelWidth,
      y: 20,
      size: 9,
      font,
      color: rgb(0.55, 0.55, 0.55),
    });
  });
}

function toPdfResponseBuffer(bytes: Uint8Array) {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiRole(["admin", "teacher", "editor"]);
    if (!auth.ok) return auth.response;

    const payload = (await req.json()) as ExportPayload;
    const config = EXPORT_CONFIG[payload.exportKey];

    if (!config) {
      return new Response("Invalid export type", { status: 400 });
    }

    const supabase = createAdminClient();

    let query = supabase.schema(config.schema).from(config.table).select(config.select);

    if (config.sortColumns?.length) {
      for (const item of config.sortColumns) {
        query = query.order(item.column, {
          ascending: item.ascending ?? true,
        });
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error("Export query error:", {
        exportKey: payload.exportKey,
        schema: config.schema,
        table: config.table,
        error,
      });

      return new Response(
        `读取 ${config.schema}.${config.table} 失败：${error.message}`,
        { status: 500 }
      );
    }

    const items = (data ?? []) as unknown as ExportRow[];

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let y = PAGE_HEIGHT - MARGIN_TOP;

    const contentWidth = PAGE_WIDTH - MARGIN_X * 2;

    const ensureSpace = (neededHeight: number) => {
      if (y - neededHeight < MARGIN_BOTTOM) {
        page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        y = PAGE_HEIGHT - MARGIN_TOP;
      }
    };

    const drawLine = (text: string, size = BODY_SIZE, bold = false) => {
      const usedFont = bold ? boldFont : font;
      const lines = wrapText(text, contentWidth, usedFont, size);

      for (const line of lines) {
        ensureSpace(size + LINE_GAP);

        page.drawText(line || " ", {
          x: MARGIN_X,
          y,
          size,
          font: usedFont,
          color: rgb(0, 0, 0),
        });

        y -= size + LINE_GAP;
      }
    };

    drawLine(safePdfText(config.title), TITLE_SIZE, true);
    drawLine(`Total questions: ${items.length}`, SMALL_SIZE, false);
    y -= 15;

    items.forEach((item, index) => {
      const lines = config.formatter(item, index);
      lines.forEach((line) => drawLine(safePdfText(line)));
      y -= 8;
    });

    addWatermarkAndFooter(pdfDoc, font, boldFont);

    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = toPdfResponseBuffer(pdfBytes);

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${payload.exportKey}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Export PDF route error:", error);

    return new Response(
      error instanceof Error ? error.message : "Export failed",
      { status: 500 }
    );
  }
}
