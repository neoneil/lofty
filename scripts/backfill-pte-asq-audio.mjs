import crypto from "node:crypto";

import dotenv from "dotenv";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const MODEL = "gpt-4o-mini-tts";
const VOICES = ["marin", "cedar", "alloy", "ash", "coral", "sage"];
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

function getRelativePath(questionId, voice) {
  return `PTE/speaking/ASQ/${questionId}/${voice}.mp3`;
}

function getR2Key(questionId, voice) {
  return `pte-audio/${getRelativePath(questionId, voice)}`;
}

function estimateDurationSeconds(text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.ceil(words / 2.5));
}

function getVoiceForIndex(index) {
  return VOICES[index % VOICES.length];
}

function isReady(row) {
  return row.audio_status === "ready" && row.ai_voice && row.audio_url === getRelativePath(row.id, row.ai_voice);
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
    instructions: "Read this short PTE Answer Short Question clearly and naturally. Use an exam-style pace. Do not add the answer or any extra commentary.",
    response_format: "mp3",
  });
  return Buffer.from(await audio.arrayBuffer());
}

async function fetchAllAsq(supabase, predictionOnly) {
  const pageSize = 1000;
  const rows = [];

  for (let from = 0; ; from += pageSize) {
    let query = supabase
      .schema("pte")
      .from("asq")
      .select("id, question_text, audio_url, ai_voice, audio_status")
      .not("question_text", "is", null)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);

    if (predictionOnly) query = query.eq("is_prediction", true);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }

  return rows;
}

const limit = Math.max(1, Math.min(200, Number(getArg("limit", "50")) || 50));
const untilEmpty = getBoolArg("until-empty", false);
const predictionOnly = getBoolArg("prediction-only", true);

if (!process.env.OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY.");
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) throw new Error("Missing Supabase admin env.");

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

let batch = 1;
let completed = 0;

while (true) {
  const allRows = await fetchAllAsq(supabase, predictionOnly);
  const indexedRows = allRows.map((row, index) => ({ ...row, plannedVoice: getVoiceForIndex(index) }));
  const candidates = indexedRows.filter((row) => !isReady(row)).slice(0, limit);
  const remaining = indexedRows.filter((row) => !isReady(row)).length;

  console.log(`\n=== ASQ batch ${batch} remaining ${remaining} limit ${limit} predictionOnly=${predictionOnly} ===`);
  if (remaining === 0 || candidates.length === 0) break;

  for (const question of candidates) {
    const text = question.question_text.trim();
    const voice = question.plannedVoice;
    const audioUrl = getRelativePath(question.id, voice);
    const key = getR2Key(question.id, voice);

    await supabase.schema("pte").from("asq").update({ audio_status: "generating", audio_error: null }).eq("id", question.id);

    try {
      console.log(`ASQ ${question.id} ${voice}: generating`);
      const body = await createSpeech(openai, voice, text);
      console.log(`ASQ ${question.id} ${voice}: uploading`);
      await uploadAudio(key, body);
      const { error } = await supabase.schema("pte").from("asq").update({
        audio_url: audioUrl,
        audio_duration_seconds: estimateDurationSeconds(text),
        ai_voice: voice,
        audio_status: "ready",
        audio_generated_at: new Date().toISOString(),
        audio_error: null,
      }).eq("id", question.id);
      if (error) throw new Error(error.message);
      completed += 1;
    } catch (error) {
      await supabase.schema("pte").from("asq").update({ audio_status: "error", audio_error: error instanceof Error ? error.message : "Unknown error" }).eq("id", question.id);
      throw error;
    }
  }

  console.log(`ASQ batch ${batch} completed: ${candidates.length}`);
  if (!untilEmpty) break;
  batch += 1;
}

console.log(JSON.stringify({ completed }));
