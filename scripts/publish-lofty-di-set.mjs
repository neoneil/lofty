import crypto from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const ROOT = process.cwd();
const SOURCE = "LOFTY_GENERATED";
const PREFIX = "pte-images/PTE/speaking/DI/lofty-generated";
const PUBLIC_BASE = (process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL || "https://pub-b96989cc617f460facb9c254b7d2c5db.r2.dev").replace(/\/+$/, "");
const region = "auto";
const service = "s3";
const manifest = JSON.parse(readFileSync(path.join(ROOT, "content/pte/di-generated/lofty-di-set.json"), "utf8"));

const required = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SECRET_KEY", "CLOUDFLARE_R2_ACCESS_KEY_ID", "CLOUDFLARE_R2_SECRET_ACCESS_KEY"];
for (const key of required) if (!process.env[key]) throw new Error(`Missing ${key}`);

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const typeCodes = { line_chart: 1, bar_chart: 2, pie_chart: 3, table: 4, flowchart: 5, map: 6, image: 7 };
const difficultyLabels = { 1: "简", 2: "普", 3: "难" };

function stableUuid(value) {
  const bytes = crypto.createHash("sha256").update(`lofty-di:${value}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

function hmac(key, value) { return crypto.createHmac("sha256", key).update(value).digest(); }
function sha256(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
function encodePathKey(key) { return key.split("/").map(encodeURIComponent).join("/"); }
function signingKey(secret, date) {
  const kDate = hmac(`AWS4${secret}`, date);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, "aws4_request");
}

function presignedPutUrl(key) {
  const endpoint = (process.env.CLOUDFLARE_R2_S3_API_ENDPOINT || "https://a3258c7ea50842a467e9f67707e29858.r2.cloudflarestorage.com/ted").replace(/\/+$/, "");
  const url = new URL(endpoint);
  const bucket = process.env.CLOUDFLARE_R2_BUCKET || "ted";
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const date = amzDate.slice(0, 8);
  const scope = `${date}/${region}/${service}/aws4_request`;
  const endpointPath = url.pathname.replace(/\/+$/, "");
  const canonicalUri = `${endpointPath || `/${bucket}`}/${encodePathKey(key)}`;
  const params = new URLSearchParams({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${process.env.CLOUDFLARE_R2_ACCESS_KEY_ID}/${scope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": "900",
    "X-Amz-SignedHeaders": "host",
  });
  const query = [...params.entries()].map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).sort().join("&");
  const request = ["PUT", canonicalUri, query, `host:${url.host}\n`, "host", "UNSIGNED-PAYLOAD"].join("\n");
  const toSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(request)].join("\n");
  params.set("X-Amz-Signature", crypto.createHmac("sha256", signingKey(process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY, date)).update(toSign).digest("hex"));
  return `${url.protocol}//${url.host}${canonicalUri}?${params}`;
}

function publicUrl(key) { return `${PUBLIC_BASE}/${key.split("/").map(encodeURIComponent).join("/")}`; }

async function upload(key, file) {
  const existing = await fetch(publicUrl(key), { method: "HEAD", cache: "no-store" });
  if (existing.ok) return "existing";
  const body = readFileSync(file);
  const response = await fetch(presignedPutUrl(key), { method: "PUT", headers: { "Content-Type": "image/png" }, body });
  if (!response.ok) throw new Error(`R2 upload failed ${response.status}: ${key}`);
  const check = await fetch(publicUrl(key), { method: "HEAD", cache: "no-store" });
  if (!check.ok) throw new Error(`R2 verification failed ${check.status}: ${key}`);
  return "uploaded";
}

function rowFor(item, index) {
  const id = stableUuid(item.slug);
  const key = `${PREFIX}/${item.slug}.png`;
  const searchText = [item.title, item.subtitle, item.answerInfo, ...item.keywords].join(" ");
  return {
    id,
    question_type: "DI",
    source_platform: SOURCE,
    title: item.title,
    question_text: item.title,
    image_url: publicUrl(key),
    answer_info: item.answerInfo,
    video_url: null,
    ai_keywords: item.keywords.join(","),
    difficulty_level: difficultyLabels[item.difficulty] || "普",
    difficulty_raw: item.difficulty,
    is_prediction: true,
    is_real_exam: false,
    is_active: true,
    tag1: typeCodes[item.type],
    tag2: 1,
    tag3: null,
    tag4: manifest.items.length - index,
    raw_json: { origin: SOURCE, generator: manifest.model, generated_at: manifest.generatedAt, visual_type: item.type, variant: item.variant, unit: item.unit, labels: item.labels, series: item.series },
    search_text: searchText,
  };
}

async function main() {
  const rows = manifest.items.map(rowFor);
  mkdirSync(path.join(ROOT, "tmp/di-generated"), { recursive: true });
  writeFileSync(path.join(ROOT, "tmp/di-generated/rows.json"), JSON.stringify(rows, null, 2));

  for (const [index, item] of manifest.items.entries()) {
    const key = `${PREFIX}/${item.slug}.png`;
    const file = path.join(ROOT, "content/pte/di-generated/assets", `${item.slug}.png`);
    process.stdout.write(`[${index + 1}/${manifest.items.length}] ${item.slug} ... `);
    const result = await upload(key, file);
    console.log(result);
  }

  const { data: before, error: beforeError } = await supabase.schema("pte").from("di").select("id, title, image_url, tag4").eq("source_platform", SOURCE);
  if (beforeError) throw beforeError;
  writeFileSync(path.join(ROOT, "tmp/di-generated/database-before.json"), JSON.stringify(before, null, 2));

  const { error: upsertError } = await supabase.schema("pte").from("di").upsert(rows, { onConflict: "id" });
  if (upsertError) throw upsertError;

  const { data: verified, error: verifyError } = await supabase.schema("pte").from("di").select("id, title, image_url, tag1, tag4, is_prediction, is_active").eq("source_platform", SOURCE).order("tag4", { ascending: false });
  if (verifyError) throw verifyError;
  if (verified?.length !== manifest.items.length) throw new Error(`Expected ${manifest.items.length} rows, found ${verified?.length ?? 0}`);
  console.log(`Published and verified ${verified.length} DI questions.`);
}

main().catch((error) => { console.error(error); process.exit(1); });
