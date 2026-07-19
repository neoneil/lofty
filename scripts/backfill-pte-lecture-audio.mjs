import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import dotenv from "dotenv";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const MODEL = "gpt-4o-mini-tts";
const VOICES = ["marin", "cedar"];
const region = "auto";
const service = "s3";

function getArg(name, fallback) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

function getBoolArg(name, fallback = false) {
  const value = getArg(name, fallback ? "true" : "false").toLowerCase();
  return value === "1" || value === "true" || value === "yes";
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

function getRelativePath(questionType, questionId, voice) {
  const folder = questionType === "rl" ? "speaking/RL" : "listening/SST";
  return `PTE/${folder}/${questionId}/${voice}.mp3`;
}

function getR2Key(questionType, questionId, voice) {
  return `pte-audio/${getRelativePath(questionType, questionId, voice)}`;
}

function expectedMarinPath(questionType, questionId) {
  return getRelativePath(questionType, questionId, "marin");
}

async function uploadAudio(key, body) {
  const response = await fetch(createR2PresignedPutUrl(key), {
    method: "PUT",
    headers: { "Content-Type": "audio/mpeg" },
    body,
  });

  if (!response.ok) throw new Error(`R2 upload failed for ${key}: ${response.status} ${response.statusText}`);
}

async function createSpeech(openai, voice, text) {
  const audio = await openai.audio.speech.create({
    model: MODEL,
    voice,
    input: text,
    instructions: "Read this as a natural academic lecture for PTE listening practice. Use clear pacing, varied intonation, moderate emphasis, and brief pauses between ideas. Do not add extra commentary.",
    response_format: "mp3",
  });
  return Buffer.from(await audio.arrayBuffer());
}

async function findCandidates(supabase, questionType, limit, predictionOnly) {
  let query = supabase
    .schema("pte")
    .from(questionType)
    .select("id, transcript, audio_url, source_audio_url, storage_path")
    .not("transcript", "is", null)
    .neq("transcript", "")
    .order("created_at", { ascending: true });

  if (predictionOnly) query = query.eq("is_prediction", true);

  const { data, error } = await query;
  if (error) throw new Error(`${questionType}: ${error.message}`);

  return (data ?? []).filter((row) => row.audio_url !== expectedMarinPath(questionType, row.id)).slice(0, limit);
}

async function countCandidates(supabase, questionType, predictionOnly) {
  let query = supabase
    .schema("pte")
    .from(questionType)
    .select("id, audio_url", { count: "exact" })
    .not("transcript", "is", null)
    .neq("transcript", "");

  if (predictionOnly) query = query.eq("is_prediction", true);

  const { data, error } = await query;
  if (error) throw new Error(`${questionType}: ${error.message}`);
  return (data ?? []).filter((row) => row.audio_url !== expectedMarinPath(questionType, row.id)).length;
}

async function generateOne({ supabase, openai, questionType, question }) {
  const transcript = question.transcript.trim();
  const variants = [];

  for (const voice of VOICES) {
    const key = getR2Key(questionType, question.id, voice);
    const relativePath = getRelativePath(questionType, question.id, voice);
    console.log(`${questionType.toUpperCase()} ${question.id} ${voice}: generating`);
    const body = await createSpeech(openai, voice, transcript);
    console.log(`${questionType.toUpperCase()} ${question.id} ${voice}: uploading`);
    await uploadAudio(key, body);
    variants.push({ voice, audio_url: relativePath, r2_key: key, model: MODEL });
  }

  const { error } = await supabase.schema("pte").from(questionType).update({ audio_url: expectedMarinPath(questionType, question.id) }).eq("id", question.id);
  if (error) throw new Error(`${questionType} ${question.id}: ${error.message}`);

  return variants;
}

const typeArg = getArg("type", "both");
const limit = Math.max(1, Math.min(20, Number(getArg("limit", "5")) || 5));
const predictionOnly = getBoolArg("prediction-only", true);
const untilEmpty = getBoolArg("until-empty", false);
const types = typeArg === "both" ? ["rl", "sst"] : typeArg === "rl" || typeArg === "sst" ? [typeArg] : null;

if (!types) throw new Error("--type must be rl, sst, or both.");
if (!process.env.OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY.");
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) throw new Error("Missing Supabase admin env.");

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const backup = { created_at: new Date().toISOString(), prediction_only: predictionOnly, rows: [] };

for (const questionType of types) {
  let batch = 1;
  let completed = 0;

  while (true) {
    const remaining = await countCandidates(supabase, questionType, predictionOnly);
    console.log(`\n=== ${questionType.toUpperCase()} batch ${batch} remaining ${remaining} limit ${limit} predictionOnly=${predictionOnly} ===`);
    if (remaining === 0) break;

    const candidates = await findCandidates(supabase, questionType, limit, predictionOnly);
    if (candidates.length === 0) break;

    backup.rows.push(...candidates.map((row) => ({ table: questionType, id: row.id, audio_url: row.audio_url, source_audio_url: row.source_audio_url, storage_path: row.storage_path })));

    for (const question of candidates) {
      await generateOne({ supabase, openai, questionType, question });
      completed += 1;
    }

    console.log(`${questionType.toUpperCase()} batch ${batch} completed: ${candidates.length}`);
    if (!untilEmpty) break;
    batch += 1;
  }

  console.log(`${questionType.toUpperCase()} total completed this run: ${completed}`);
}

fs.mkdirSync("tmp", { recursive: true });
const backupPath = path.join("tmp", `pte-lecture-audio-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
console.log(JSON.stringify({ backupPath }));
