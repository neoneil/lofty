import { createHash, createHmac } from "crypto";
import { execFile } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { promisify } from "util";

import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const execFileAsync = promisify(execFile);
const SOURCE_DIR = process.env.TED_SOURCE_DIR || "/mnt/c/Users/adela/Downloads/ted";
const DEFAULT_PUBLIC_URL = "https://pub-b96989cc617f460facb9c254b7d2c5db.r2.dev";
const REGION = "auto";
const SERVICE = "s3";
const EXISTING_COURSES_BY_ORDER = new Map([
  [1, "two-us-governors"],
  [3, "why-you-should-be-able-to-vote-on-your-phone"],
]);

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

const config = {
  endpoint: (process.env.CLOUDFLARE_R2_S3_API_ENDPOINT || process.env.CLOUDFLARE_R2_ENDPOINT || "").replace(/\/+$/, ""),
  bucket: process.env.CLOUDFLARE_R2_BUCKET || "ted",
  accessKeyId: requiredEnv("CLOUDFLARE_R2_ACCESS_KEY_ID"),
  secretAccessKey: requiredEnv("CLOUDFLARE_R2_SECRET_ACCESS_KEY"),
  publicBaseUrl: (process.env.CLOUDFLARE_R2_TED_PUBLIC_URL || process.env.CLOUDFLARE_R2_PUBLIC_URL || DEFAULT_PUBLIC_URL).replace(/\/+$/, ""),
  supabaseUrl: requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseServiceKey: requiredEnv("SUPABASE_SECRET_KEY"),
};

if (!config.endpoint) {
  throw new Error("Missing required env: CLOUDFLARE_R2_S3_API_ENDPOINT");
}

function hmac(key, value) {
  return createHmac("sha256", key).update(value).digest();
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function encodePathKey(key) {
  return key
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function signingKey(secretAccessKey, dateStamp) {
  const dateKey = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const dateRegionKey = hmac(dateKey, REGION);
  const dateRegionServiceKey = hmac(dateRegionKey, SERVICE);
  return hmac(dateRegionServiceKey, "aws4_request");
}

function publicUrlForKey(key) {
  return `${config.publicBaseUrl}/${encodePathKey(key)}`;
}

function presignPutUrl(key, expiresInSeconds = 900) {
  const endpointUrl = new URL(config.endpoint);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const host = endpointUrl.host;
  const endpointPath = endpointUrl.pathname.replace(/\/+$/, "");
  const canonicalUri = `${endpointPath || `/${config.bucket}`}/${encodePathKey(key)}`;
  const credential = `${config.accessKeyId}/${credentialScope}`;
  const signedHeaders = "host";
  const params = new URLSearchParams({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": credential,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresInSeconds),
    "X-Amz-SignedHeaders": signedHeaders,
  });
  const canonicalQueryString = Array.from(params.entries())
    .map(([paramKey, value]) => `${encodeURIComponent(paramKey)}=${encodeURIComponent(value)}`)
    .sort()
    .join("&");
  const canonicalRequest = ["PUT", canonicalUri, canonicalQueryString, `host:${host}\n`, signedHeaders, "UNSIGNED-PAYLOAD"].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, sha256(canonicalRequest)].join("\n");
  const signature = createHmac("sha256", signingKey(config.secretAccessKey, dateStamp)).update(stringToSign).digest("hex");
  params.set("X-Amz-Signature", signature);
  return `${endpointUrl.protocol}//${host}${canonicalUri}?${params.toString()}`;
}

function createCourseSlug(value) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "course";
}

function stripExtension(fileName) {
  return fileName
    .replace(/\.en\.vtt$/i, "")
    .replace(/\.(mp4|jpg|jpeg|png|webp)$/i, "");
}

function parseTedStem(stem) {
  const order = Number(stem.slice(0, 2));
  const rest = stem.slice(3);
  const titleAndMeta = rest.length > 12 ? rest.slice(12) : rest;
  const parts = titleAndMeta.split("｜").map((part) => part.trim()).filter(Boolean);
  const rawTitle = parts[0] || titleAndMeta;
  const speaker = parts.find((part) => !/^TED$/i.test(part) && !/on the spot/i.test(part) && part !== rawTitle) || null;
  return {
    order,
    title: rawTitle.replace(/\s+/g, " ").trim(),
    speaker,
  };
}

function contentTypeFor(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".mp4") return "video/mp4";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".png") return "image/png";
  if (extension === ".webp") return "image/webp";
  if (extension === ".vtt") return "text/vtt; charset=utf-8";
  return "application/octet-stream";
}

async function uploadFile(filePath, key) {
  const body = await fs.readFile(filePath);
  const response = await fetch(presignPutUrl(key), {
    method: "PUT",
    headers: {
      "Content-Type": contentTypeFor(filePath),
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`R2 upload failed ${response.status} for ${key}: ${errorText.slice(0, 400)}`);
  }

  return publicUrlForKey(key);
}

async function getDurationSeconds(filePath) {
  try {
    const { stdout } = await execFileAsync("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      filePath,
    ]);
    const seconds = Number.parseFloat(stdout.trim());
    return Number.isFinite(seconds) ? Math.round(seconds) : null;
  } catch {
    return null;
  }
}

async function collectCourses() {
  const files = await fs.readdir(SOURCE_DIR);
  const groups = new Map();

  for (const fileName of files) {
    if (!/\.(mp4|jpe?g|en\.vtt)$/i.test(fileName)) continue;
    const stem = stripExtension(fileName);
    const group = groups.get(stem) || { stem, files: {} };
    if (/\.mp4$/i.test(fileName)) group.files.video = path.join(SOURCE_DIR, fileName);
    if (/\.jpe?g$/i.test(fileName)) group.files.thumbnail = path.join(SOURCE_DIR, fileName);
    if (/\.en\.vtt$/i.test(fileName)) group.files.subtitle = path.join(SOURCE_DIR, fileName);
    groups.set(stem, group);
  }

  return Array.from(groups.values())
    .filter((group) => group.files.video)
    .map((group) => ({ ...group, ...parseTedStem(group.stem) }))
    .sort((a, b) => a.order - b.order);
}

async function main() {
  const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  const courses = await collectCourses();
  const { data: existingRows, error: existingError } = await supabase
    .from("courses")
    .select("slug,created_by")
    .eq("category", "ted");

  if (existingError) throw existingError;

  const existingSlugs = new Set((existingRows || []).map((row) => row.slug));
  const createdBy = existingRows?.find((row) => row.created_by)?.created_by || null;
  if (!createdBy) throw new Error("Cannot infer created_by from existing TED courses.");

  const inserted = [];
  const skipped = [];

  for (const [order, slug] of EXISTING_COURSES_BY_ORDER.entries()) {
    if (!existingSlugs.has(slug)) continue;
    const { error } = await supabase.from("courses").update({ sort_order: order }).eq("slug", slug).eq("category", "ted");
    if (error) throw error;
  }

  for (const course of courses) {
    const slug = createCourseSlug(course.title);
    const existingSlugForOrder = EXISTING_COURSES_BY_ORDER.get(course.order);
    if (existingSlugForOrder && existingSlugs.has(existingSlugForOrder)) {
      const durationSeconds = await getDurationSeconds(course.files.video);
      const { error } = await supabase
        .from("courses")
        .update({
          duration_seconds: durationSeconds,
          sort_order: course.order,
        })
        .eq("slug", existingSlugForOrder)
        .eq("category", "ted");
      if (error) throw error;
      skipped.push(existingSlugForOrder);
      console.log(`skip existing order ${course.order}: ${existingSlugForOrder}`);
      continue;
    }

    if (existingSlugs.has(slug)) {
      skipped.push(slug);
      console.log(`skip existing slug: ${slug}`);
      continue;
    }

    const baseKey = `ted/${slug}`;
    console.log(`uploading ${course.order}: ${course.title}`);
    const [videoUrl, thumbnailUrl, subtitleEnUrl, durationSeconds] = await Promise.all([
      uploadFile(course.files.video, `${baseKey}/video.mp4`),
      course.files.thumbnail ? uploadFile(course.files.thumbnail, `${baseKey}/thumbnail.jpg`) : Promise.resolve(null),
      course.files.subtitle ? uploadFile(course.files.subtitle, `${baseKey}/subtitle-en.vtt`) : Promise.resolve(null),
      getDurationSeconds(course.files.video),
    ]);

    const { data, error } = await supabase
      .from("courses")
      .insert({
        title: course.title,
        slug,
        description: null,
        category: "ted",
        level: null,
        tags: [],
        speaker: course.speaker,
        source_name: "TED",
        source_url: null,
        license: null,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        poster_url: thumbnailUrl,
        subtitle_en_url: subtitleEnUrl,
        duration_seconds: durationSeconds,
        language: "en",
        sort_order: course.order,
        is_featured: true,
        is_published: true,
        published_at: new Date().toISOString(),
        created_by: createdBy,
      })
      .select("id,title,slug")
      .single();

    if (error) throw error;
    inserted.push(data);
    console.log(`created course: ${data.slug}`);
  }

  console.log(JSON.stringify({ inserted, skipped }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
