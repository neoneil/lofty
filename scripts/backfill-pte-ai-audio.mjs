import crypto from "node:crypto";

import dotenv from "dotenv";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const PTE_AI_AUDIO_MODEL = "gpt-4o-mini-tts";
const PTE_AI_AUDIO_VOICES = [{ id: "marin" }, { id: "cedar" }, { id: "alloy" }, { id: "ash" }];
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

function getPteAiAudioRelativePath(questionType, questionId, voice) {
  const folder = questionType === "rs" ? "speaking/RS" : "listening/WFD";
  return `PTE/${folder}/${questionId}/${voice}.mp3`;
}

function getPteAiAudioR2Key(questionType, questionId, voice) {
  return `pte-audio/${getPteAiAudioRelativePath(questionType, questionId, voice)}`;
}

function estimateDurationSeconds(text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.round(words / 2.4));
}

function getTable(questionType) {
  return questionType === "rs" ? "rs" : "wfd";
}

function getExpectedAudioPrefix(questionType) {
  return questionType === "rs" ? "PTE/speaking/RS/" : "PTE/listening/WFD/";
}

function needsGeneratedAudio(questionType, question) {
  const audioUrl = String(question.audio_url ?? "");
  return question.audio_status !== "ready" || question.ai_voice !== "marin" || !audioUrl.startsWith(getExpectedAudioPrefix(questionType)) || !audioUrl.endsWith("/marin.mp3");
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
    model: PTE_AI_AUDIO_MODEL,
    voice,
    input: text,
    instructions: "Read this PTE practice sentence clearly in natural English. Keep a steady exam-style pace with no extra commentary.",
    response_format: "mp3",
  });
  return Buffer.from(await audio.arrayBuffer());
}

async function findCandidates(supabase, questionType, limit, { predictionOnly }) {
  const table = getTable(questionType);
  let query = supabase.schema("pte").from(table).select("id, question_text, audio_url, audio_status, ai_voice").not("question_text", "is", null).order("created_at", { ascending: false });

  if (questionType === "rs") query = query.eq("is_active", true);
  if (predictionOnly) query = query.eq("is_prediction", true);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).filter((question) => needsGeneratedAudio(questionType, question)).slice(0, limit);
}

async function countMissingCandidates(supabase, questionType, { predictionOnly }) {
  const table = getTable(questionType);
  let query = supabase.schema("pte").from(table).select("id, audio_url, audio_status, ai_voice").not("question_text", "is", null);

  if (questionType === "rs") query = query.eq("is_active", true);
  if (predictionOnly) query = query.eq("is_prediction", true);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).filter((question) => needsGeneratedAudio(questionType, question)).length;
}

async function generateOne(supabase, openai, questionType, question) {
  const table = getTable(questionType);
  const text = question.question_text?.trim();
  if (!text) throw new Error(`${questionType} ${question.id} has empty question_text`);

  const variants = [];
  await supabase.schema("pte").from(table).update({ audio_status: "generating", audio_error: null }).eq("id", question.id);

  try {
    for (const voice of PTE_AI_AUDIO_VOICES) {
      const key = getPteAiAudioR2Key(questionType, question.id, voice.id);
      const relativePath = getPteAiAudioRelativePath(questionType, question.id, voice.id);
      console.log(`  ${voice.id}: generating`);
      const body = await createSpeech(openai, voice.id, text);
      console.log(`  ${voice.id}: uploading ${key}`);
      await uploadAudio(key, body);
      variants.push({ voice: voice.id, model: PTE_AI_AUDIO_MODEL, audio_url: relativePath, r2_key: key, duration_seconds: estimateDurationSeconds(text) });
    }

    const defaultVariant = variants[0];
    const updatePayload = {
      audio_url: defaultVariant.audio_url,
      audio_duration_seconds: defaultVariant.duration_seconds,
      ai_voice: defaultVariant.voice,
      audio_status: "ready",
      audio_generated_at: new Date().toISOString(),
      audio_error: null,
    };

    if (questionType === "rs") {
      updatePayload.audio_variants_json = variants;
      updatePayload.audio_variant_count = variants.length;
    }

    const { error } = await supabase.schema("pte").from(table).update(updatePayload).eq("id", question.id);
    if (error) throw new Error(error.message);
    console.log(`${questionType.toUpperCase()} ${question.id} ready`);
  } catch (error) {
    await supabase.schema("pte").from(table).update({ audio_status: "error", audio_error: error instanceof Error ? error.message : "Unknown error" }).eq("id", question.id);
    throw error;
  }
}

const typeArg = getArg("type", "both");
const limit = Math.max(1, Math.min(20, Number(getArg("limit", "5")) || 5));
const predictionOnly = getBoolArg("prediction-only", false);
const untilEmpty = getBoolArg("until-empty", false);
const types = typeArg === "both" ? ["rs", "wfd"] : typeArg === "rs" || typeArg === "wfd" ? [typeArg] : null;

if (!types) throw new Error("--type must be rs, wfd, or both.");
if (!process.env.OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY.");
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) throw new Error("Missing Supabase admin env.");

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

for (const questionType of types) {
  let totalCompleted = 0;
  let batch = 1;

  while (true) {
    const remaining = await countMissingCandidates(supabase, questionType, { predictionOnly });
    console.log(`\n=== ${questionType.toUpperCase()} batch ${batch} limit ${limit} remaining ${remaining} predictionOnly=${predictionOnly} ===`);
    if (remaining === 0) break;

    const candidates = await findCandidates(supabase, questionType, limit, { predictionOnly });
    if (candidates.length === 0) break;

    for (const question of candidates) {
      console.log(`${questionType.toUpperCase()} ${question.id}`);
      await generateOne(supabase, openai, questionType, question);
      totalCompleted += 1;
    }

    console.log(`${questionType.toUpperCase()} batch ${batch} completed: ${candidates.length}`);
    if (!untilEmpty) break;
    batch += 1;
  }

  console.log(`${questionType.toUpperCase()} total completed this run: ${totalCompleted}`);
}
