import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!;
const openaiApiKey = process.env.OPENAI_API_KEY!;

if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!supabaseSecretKey) throw new Error("Missing SUPABASE_SECRET_KEY");
if (!openaiApiKey) throw new Error("Missing OPENAI_API_KEY");

const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const openai = new OpenAI({ apiKey: openaiApiKey });

type VisualType =
  | "line_chart"
  | "bar_chart"
  | "pie_chart"
  | "table"
  | "flowchart"
  | "map"
  | "image"
  | "mixed"
  | "unknown";

type Confidence = "high" | "medium" | "low";

type DiRow = {
  id: string;
  title: string | null;
  question_text: string | null;
  image_url: string | null;
  tag1: number | null;
  tag2: number | null;
  tag3: number | null;
  tag4: number | null;
};

type Classification = {
  id: string;
  title: string | null;
  image_url: string | null;
  visual_type: VisualType;
  confidence: Confidence;
  reason: string;
};

const PAGE_SIZE = 200;
const VALID_TYPES = new Set<VisualType>([
  "line_chart",
  "bar_chart",
  "pie_chart",
  "table",
  "flowchart",
  "map",
  "image",
  "mixed",
  "unknown",
]);

const VALID_CONFIDENCE = new Set<Confidence>(["high", "medium", "low"]);
const VISUAL_TYPE_CODE: Record<VisualType, number> = {
  line_chart: 1,
  bar_chart: 2,
  pie_chart: 3,
  table: 4,
  flowchart: 5,
  map: 6,
  image: 7,
  mixed: 8,
  unknown: 9,
};
const CONFIDENCE_CODE: Record<Confidence, number> = {
  high: 1,
  medium: 2,
  low: 3,
};

function getPublicImageUrl(path: string) {
  if (path.startsWith("http")) return path;
  if (path.startsWith("/")) return `${process.env.NEXT_PUBLIC_SITE_URL}${path}`;
  return `${supabaseUrl}/storage/v1/object/public/pte-images/${path}`;
}

function isAlreadyClassified(row: DiRow) {
  return (
    row.tag1 != null &&
    row.tag1 >= 1 &&
    row.tag1 <= 9 &&
    row.tag2 != null &&
    row.tag2 >= 1 &&
    row.tag2 <= 3 &&
    row.tag3 == null &&
    row.tag4 == null
  );
}

async function fetchAllDiRows() {
  let from = 0;
  const rows: DiRow[] = [];

  while (true) {
    const { data, error } = await supabase
      .schema("pte")
      .from("di")
      .select("id, title, question_text, image_url, tag1, tag2, tag3, tag4")
      .order("created_at", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    rows.push(...(data as DiRow[]));

    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows.filter((row) => row.image_url);
}

function parseClassification(text: string): Omit<Classification, "id" | "title" | "image_url"> {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned) as {
    visual_type?: VisualType;
    confidence?: Confidence;
    reason?: string;
  };

  const visualType =
    parsed.visual_type && VALID_TYPES.has(parsed.visual_type)
      ? parsed.visual_type
      : "unknown";

  const confidence =
    parsed.confidence && VALID_CONFIDENCE.has(parsed.confidence)
      ? parsed.confidence
      : "low";

  return {
    visual_type: visualType,
    confidence,
    reason: parsed.reason || "",
  };
}

async function classifyRow(row: DiRow): Promise<Classification> {
  const imageUrl = getPublicImageUrl(row.image_url!);

  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              "Classify this PTE Describe Image visual into exactly one category: " +
              "line_chart, bar_chart, pie_chart, table, flowchart, map, image, mixed, unknown. " +
              "Use mixed only when multiple chart types are clearly present. " +
              "Return strict JSON only with keys visual_type, confidence, reason. " +
              "confidence must be high, medium, or low.",
          },
          {
            type: "input_image",
            image_url: imageUrl,
            detail: "low",
          },
        ],
      },
    ],
  });

  const result = parseClassification(response.output_text);

  return {
    id: row.id,
    title: row.title,
    image_url: row.image_url,
    ...result,
  };
}

async function updateTags(classification: Classification) {
  const { error } = await supabase
    .schema("pte")
    .from("di")
    .update({
      tag1: VISUAL_TYPE_CODE[classification.visual_type],
      tag2: CONFIDENCE_CODE[classification.confidence],
      tag3: null,
      tag4: null,
    })
    .eq("id", classification.id);

  if (error) throw error;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const resume = process.argv.includes("--resume");
  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : null;

  mkdirSync(join(process.cwd(), "tmp"), { recursive: true });

  const rows = await fetchAllDiRows();
  const resumableRows = resume ? rows.filter((row) => !isAlreadyClassified(row)) : rows;
  const targetRows =
    Number.isFinite(limit) && limit ? resumableRows.slice(0, limit) : resumableRows;

  console.log(`Found ${rows.length} DI rows with images.`);
  if (resume) {
    console.log(`Skipping ${rows.length - resumableRows.length} already classified rows.`);
  }
  console.log(`${apply ? "Applying" : "Previewing"} ${targetRows.length} rows.`);

  const results: Classification[] = [];

  for (const [index, row] of targetRows.entries()) {
    console.log(`[${index + 1}/${targetRows.length}] Classifying ${row.id}`);
    const classification = await classifyRow(row);
    results.push(classification);

    console.log(
      `  -> ${classification.visual_type} (${classification.confidence}) ${classification.title ?? ""}`,
    );

    if (apply) {
      await updateTags(classification);
    }
  }

  const reportPath = join(
    process.cwd(),
    "tmp",
    `di-visual-type-classification-${apply ? "applied" : "preview"}.json`,
  );

  writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`Report written: ${reportPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
