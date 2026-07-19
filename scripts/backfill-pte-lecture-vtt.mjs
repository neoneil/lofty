import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const execFileAsync = promisify(execFile);
const VOICES = ["marin", "cedar"];
const region = "auto";
const service = "s3";

function getArg(name, fallback) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

function hmac(key, value) {
  return crypto.createHmac("sha256", key).update(value).digest();
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function encodePathKey(key) {
  return key.split("/").map((part) => encodeURIComponent(part)).join("/");
}

function getSigningKey(secretAccessKey, dateStamp) {
  const dateKey = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const dateRegionKey = hmac(dateKey, region);
  const dateRegionServiceKey = hmac(dateRegionKey, service);
  return hmac(dateRegionServiceKey, "aws4_request");
}

function createR2PresignedPutUrl(key) {
  const endpoint = (process.env.CLOUDFLARE_R2_S3_API_ENDPOINT ?? process.env.CLOUDFLARE_R2_ENDPOINT ?? "https://a3258c7ea50842a467e9f67707e29858.r2.cloudflarestorage.com/ted").replace(/\/+$/, "");
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const bucket = process.env.CLOUDFLARE_R2_BUCKET ?? "ted";

  if (!endpoint || !accessKeyId || !secretAccessKey) throw new Error("Missing R2 env.");

  const endpointUrl = new URL(endpoint);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const host = endpointUrl.host;
  const endpointPath = endpointUrl.pathname.replace(/\/+$/, "");
  const canonicalUri = `${endpointPath || `/${bucket}`}/${encodePathKey(key)}`;
  const credential = `${accessKeyId}/${credentialScope}`;
  const signedHeaders = "host";
  const params = new URLSearchParams({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": credential,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": "900",
    "X-Amz-SignedHeaders": signedHeaders,
  });
  const canonicalQueryString = Array.from(params.entries()).map(([paramKey, value]) => `${encodeURIComponent(paramKey)}=${encodeURIComponent(value)}`).sort().join("&");
  const canonicalRequest = ["PUT", canonicalUri, canonicalQueryString, `host:${host}\n`, signedHeaders, "UNSIGNED-PAYLOAD"].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, sha256(canonicalRequest)].join("\n");
  const signature = crypto.createHmac("sha256", getSigningKey(secretAccessKey, dateStamp)).update(stringToSign).digest("hex");
  params.set("X-Amz-Signature", signature);
  return `${endpointUrl.protocol}//${host}${canonicalUri}?${params.toString()}`;
}

function getRelativePath(questionType, questionId, voice, extension) {
  const folder = questionType === "rl" ? "speaking/RL" : "listening/SST";
  return `PTE/${folder}/${questionId}/${voice}.${extension}`;
}

function getR2Key(questionType, questionId, voice, extension) {
  return `pte-audio/${getRelativePath(questionType, questionId, voice, extension)}`;
}

function getPublicUrl(relativePath) {
  const base = (process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL || "https://pub-b96989cc617f460facb9c254b7d2c5db.r2.dev").replace(/\/$/, "");
  return `${base}/${encodePathKey(`pte-audio/${relativePath}`)}`;
}

function normalizeLines(transcript) {
  return String(transcript || "")
    .replace(/\r\n?/g, "\n")
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function countWords(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

function formatTimestamp(seconds) {
  const safe = Math.max(0, seconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const wholeSeconds = Math.floor(safe % 60);
  const milliseconds = Math.floor((safe - Math.floor(safe)) * 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(wholeSeconds).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
}

function buildVtt(transcript, durationSeconds) {
  const lines = normalizeLines(transcript);
  if (!lines.length) return "WEBVTT\n\n";

  const available = Math.max(lines.length * 0.8, durationSeconds - 0.35);
  const weights = lines.map((line) => Math.max(2, countWords(line)));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let cursor = 0.15;
  const cues = ["WEBVTT", ""];

  lines.forEach((line, index) => {
    const isLast = index === lines.length - 1;
    const cueDuration = isLast ? Math.max(0.7, durationSeconds - cursor - 0.1) : Math.max(0.7, available * (weights[index] / totalWeight));
    const start = cursor;
    const end = Math.min(durationSeconds, cursor + cueDuration);
    cues.push(String(index + 1), `${formatTimestamp(start)} --> ${formatTimestamp(end)}`, line, "");
    cursor = end;
  });

  return cues.join("\n");
}

async function getAudioDuration(url) {
  const { stdout } = await execFileAsync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", url], { timeout: 45000 });
  const duration = Number(stdout.trim());
  if (!Number.isFinite(duration) || duration <= 0) throw new Error(`Invalid audio duration for ${url}`);
  return duration;
}

async function uploadText(key, content) {
  const response = await fetch(createR2PresignedPutUrl(key), {
    method: "PUT",
    headers: { "Content-Type": "text/vtt; charset=utf-8" },
    body: content,
  });

  if (!response.ok) throw new Error(`R2 upload failed for ${key}: ${response.status} ${response.statusText}`);
}

const typeArg = getArg("type", "both");
const limit = Math.max(1, Math.min(200, Number(getArg("limit", "200")) || 200));
const types = typeArg === "both" ? ["rl", "sst"] : typeArg === "rl" || typeArg === "sst" ? [typeArg] : null;

if (!types) throw new Error("--type must be rl, sst, or both.");
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) throw new Error("Missing Supabase admin env.");

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
let totalUploaded = 0;

for (const questionType of types) {
  const expectedPrefix = questionType === "rl" ? "PTE/speaking/RL/" : "PTE/listening/SST/";
  const { data, error } = await supabase
    .schema("pte")
    .from(questionType)
    .select("id, transcript, audio_url")
    .eq("is_prediction", true)
    .not("transcript", "is", null)
    .neq("transcript", "")
    .like("audio_url", `${expectedPrefix}%/marin.mp3`)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw new Error(`${questionType}: ${error.message}`);

  console.log(`\n=== ${questionType.toUpperCase()} ${data?.length ?? 0} questions ===`);

  for (const question of data ?? []) {
    for (const voice of VOICES) {
      const audioRelativePath = getRelativePath(questionType, question.id, voice, "mp3");
      const vttKey = getR2Key(questionType, question.id, voice, "vtt");
      const duration = await getAudioDuration(getPublicUrl(audioRelativePath));
      const vtt = buildVtt(question.transcript, duration);
      await uploadText(vttKey, vtt);
      totalUploaded += 1;
      console.log(`${questionType.toUpperCase()} ${question.id} ${voice}: ${duration.toFixed(2)}s -> ${vttKey}`);
    }
  }
}

console.log(JSON.stringify({ totalUploaded }));
