import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import dotenv from "dotenv";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local", quiet: true });

const INPUT_PATH = getArg("input", path.join("tmp", "firefly", "rs-prediction.json"));
const REPORT_PATH = getArg("report", path.join("tmp", "firefly", "rs-sync-report.json"));
const EXECUTE = getBoolArg("execute", false);
const GENERATE_AUDIO = getBoolArg("generate-audio", EXECUTE);
const AUDIO_LIMIT = Math.max(1, Number(getArg("audio-limit", "500")) || 500);
const TABLE = "rs";
const SOURCE_PLATFORM = "firefly";
const QUESTION_TYPE = "RS";
const PTE_AI_AUDIO_MODEL = "gpt-4o-mini-tts";
const PTE_AI_AUDIO_VOICES = [{ id: "marin" }, { id: "cedar" }, { id: "alloy" }, { id: "ash" }];
const PAGE_SIZE = 1000;
const region = "auto";
const service = "s3";

function getArg(name, fallback) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

function getBoolArg(name, fallback = false) {
  if (process.argv.includes(`--${name}`)) return true;
  const value = getArg(name, fallback ? "true" : "false").toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function normalizeText(value) {
  return String(value ?? "")
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[。.!?]+$/g, "")
    .toLowerCase();
}

function cleanQuestionText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function stableSourceId(item) {
  if (item.sourceId) return String(item.sourceId).trim();
  const digest = crypto.createHash("sha1").update(cleanQuestionText(item.text)).digest("hex").slice(0, 14);
  return `firefly-rs-${digest}`;
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
  const endpoint = (process.env.CLOUDFLARE_R2_S3_API_ENDPOINT ?? process.env.CLOUDFLARE_R2_ENDPOINT ?? "").replace(/\/+$/, "");
  const accessKeyId = requireEnv("CLOUDFLARE_R2_ACCESS_KEY_ID");
  const secretAccessKey = requireEnv("CLOUDFLARE_R2_SECRET_ACCESS_KEY");
  const bucket = process.env.CLOUDFLARE_R2_BUCKET ?? "ted";

  if (!endpoint) throw new Error("Missing CLOUDFLARE_R2_S3_API_ENDPOINT or CLOUDFLARE_R2_ENDPOINT.");

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

function getPteAiAudioRelativePath(questionId, voice) {
  return `PTE/speaking/RS/${questionId}/${voice}.mp3`;
}

function getPteAiAudioR2Key(questionId, voice) {
  return `pte-audio/${getPteAiAudioRelativePath(questionId, voice)}`;
}

function estimateDurationSeconds(text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.round(words / 2.4));
}

function needsGeneratedAudio(question) {
  const audioUrl = String(question.audio_url ?? "");
  return question.audio_status !== "ready"
    || question.ai_voice !== "marin"
    || !audioUrl.startsWith("PTE/speaking/RS/")
    || !audioUrl.endsWith("/marin.mp3")
    || !Array.isArray(question.audio_variants_json)
    || Number(question.audio_variant_count ?? 0) < PTE_AI_AUDIO_VOICES.length;
}

async function fetchAllRsRows(supabase) {
  const rows = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .schema("pte")
      .from(TABLE)
      .select("id, question_text, source_platform, source_question_id, question_type, is_prediction, is_real_exam, is_active, audio_url, audio_status, ai_voice, audio_variants_json, audio_variant_count, created_at")
      .not("question_text", "is", null)
      .order("created_at", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(error.message);
    if (!data?.length) break;

    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
}

function buildPlan(scrapedItems, dbRows) {
  const fireflyItems = scrapedItems
    .map((item, index) => ({
      index: index + 1,
      text: cleanQuestionText(item.text),
      sourceId: stableSourceId(item),
      rawSourceId: item.sourceId ?? null,
      normalizedText: normalizeText(item.text),
    }))
    .filter((item) => item.text && item.normalizedText);

  const dedupedItems = [];
  const seenFirefly = new Set();

  for (const item of fireflyItems) {
    if (seenFirefly.has(item.normalizedText)) continue;
    seenFirefly.add(item.normalizedText);
    dedupedItems.push(item);
  }

  const rowsByText = new Map();
  const rowsBySourceId = new Map();

  for (const row of dbRows) {
    const normalized = normalizeText(row.question_text);
    if (normalized && !rowsByText.has(normalized)) rowsByText.set(normalized, row);

    const sourceId = String(row.source_question_id ?? "").trim();
    if (sourceId && !rowsBySourceId.has(sourceId)) rowsBySourceId.set(sourceId, row);
  }

  const keepPredictionIds = new Set();
  const existingPrediction = [];
  const promoteExisting = [];
  const updateChangedText = [];
  const insertNew = [];

  for (const item of dedupedItems) {
    const byText = rowsByText.get(item.normalizedText);
    const bySource = item.rawSourceId ? rowsBySourceId.get(String(item.rawSourceId).trim()) : null;
    const row = byText ?? bySource;

    if (!row) {
      insertNew.push(item);
      continue;
    }

    keepPredictionIds.add(row.id);

    if (!row.is_prediction) {
      promoteExisting.push({ item, row });
    } else {
      existingPrediction.push({ item, row });
    }

    if (bySource && normalizeText(bySource.question_text) !== item.normalizedText) {
      updateChangedText.push({ item, row: bySource });
    }
  }

  const demoteMissing = dbRows.filter((row) => row.is_prediction && !keepPredictionIds.has(row.id));
  const audioCandidates = [...existingPrediction, ...promoteExisting, ...updateChangedText]
    .map(({ row }) => row)
    .filter((row, index, rows) => rows.findIndex((candidate) => candidate.id === row.id) === index)
    .filter(needsGeneratedAudio);

  return {
    fireflyItems: dedupedItems,
    currentPredictionRows: dbRows.filter((row) => row.is_prediction),
    existingPrediction,
    promoteExisting,
    updateChangedText,
    insertNew,
    demoteMissing,
    audioCandidates,
  };
}

async function updateInChunks(supabase, ids, payload) {
  const chunks = [];
  for (let index = 0; index < ids.length; index += 100) chunks.push(ids.slice(index, index + 100));

  for (const chunk of chunks) {
    const { error } = await supabase.schema("pte").from(TABLE).update(payload).in("id", chunk);
    if (error) throw new Error(error.message);
  }
}

async function insertQuestions(supabase, items) {
  if (items.length === 0) return [];

  const payload = items.map((item) => ({
    question_type: QUESTION_TYPE,
    source_platform: SOURCE_PLATFORM,
    source_question_id: item.sourceId,
    question_text: item.text,
    is_prediction: true,
    is_real_exam: false,
    is_active: true,
    audio_status: "pending",
    audio_error: null,
  }));

  const { data, error } = await supabase.schema("pte").from(TABLE).insert(payload).select("id, question_text, audio_url, audio_status, ai_voice, audio_variants_json, audio_variant_count");
  if (error) throw new Error(error.message);
  return data ?? [];
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

async function generateAudioForQuestion(supabase, openai, question) {
  const text = cleanQuestionText(question.question_text);
  const variants = [];

  await supabase.schema("pte").from(TABLE).update({ audio_status: "generating", audio_error: null }).eq("id", question.id);

  try {
    for (const voice of PTE_AI_AUDIO_VOICES) {
      const key = getPteAiAudioR2Key(question.id, voice.id);
      const relativePath = getPteAiAudioRelativePath(question.id, voice.id);
      console.log(`  ${voice.id}: generating and uploading`);
      const body = await createSpeech(openai, voice.id, text);
      await uploadAudio(key, body);
      variants.push({ voice: voice.id, model: PTE_AI_AUDIO_MODEL, audio_url: relativePath, r2_key: key, duration_seconds: estimateDurationSeconds(text) });
    }

    const defaultVariant = variants[0];
    const { error } = await supabase.schema("pte").from(TABLE).update({
      audio_url: defaultVariant.audio_url,
      audio_duration_seconds: defaultVariant.duration_seconds,
      ai_voice: defaultVariant.voice,
      audio_status: "ready",
      audio_generated_at: new Date().toISOString(),
      audio_error: null,
      audio_variants_json: variants,
      audio_variant_count: variants.length,
    }).eq("id", question.id);

    if (error) throw new Error(error.message);
    return { id: question.id, ok: true, variants: variants.length };
  } catch (error) {
    await supabase.schema("pte").from(TABLE).update({
      audio_status: "error",
      audio_error: error instanceof Error ? error.message : "Unknown audio generation error",
    }).eq("id", question.id);
    throw error;
  }
}

function printSummary(plan) {
  console.log(`\n=== Firefly RS Prediction ${EXECUTE ? "Execute Plan" : "Dry Run"} ===`);
  console.log(`Firefly prediction texts: ${plan.fireflyItems.length}`);
  console.log(`Lofty current prediction rows: ${plan.currentPredictionRows.length}`);
  console.log(`Already prediction: ${plan.existingPrediction.length}`);
  console.log(`Existing in full bank but is_prediction=false: ${plan.promoteExisting.length}`);
  console.log(`New rows to insert: ${plan.insertNew.length}`);
  console.log(`Prediction rows to set false: ${plan.demoteMissing.length}`);
  console.log(`Existing prediction rows missing generated RS audio: ${plan.audioCandidates.length}`);

  if (plan.promoteExisting.length) {
    console.log("\nPromote existing examples:");
    for (const { row, item } of plan.promoteExisting.slice(0, 10)) console.log(`  ${row.id}: ${item.text}`);
  }

  if (plan.insertNew.length) {
    console.log("\nInsert new examples:");
    for (const item of plan.insertNew.slice(0, 10)) console.log(`  ${item.sourceId}: ${item.text}`);
  }

  if (plan.demoteMissing.length) {
    console.log("\nSet is_prediction=false examples:");
    for (const row of plan.demoteMissing.slice(0, 10)) console.log(`  ${row.id}: ${row.question_text}`);
  }

  console.log("\nSQL shape for execute mode:");
  console.log("  update pte.rs set is_prediction = false where id in (...missing from Firefly predictions);");
  console.log("  update pte.rs set is_prediction = true, is_active = true where id in (...existing full-bank matches);");
  console.log("  insert into pte.rs (question_type, source_platform, source_question_id, question_text, is_prediction, is_real_exam, is_active, audio_status) values (...new Firefly texts);");
  console.log("  update pte.rs set audio_url = ..., ai_voice = 'marin', audio_status = 'ready', audio_variants_json = ... where id = ... after each OpenAI/R2 audio generation;");
}

async function main() {
  const parsed = readJson(INPUT_PATH);
  const scrapedItems = Array.isArray(parsed.items) ? parsed.items : [];

  const supabase = createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SECRET_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });
  const dbRows = await fetchAllRsRows(supabase);
  const plan = buildPlan(scrapedItems, dbRows);

  printSummary(plan);

  const report = {
    inputPath: INPUT_PATH,
    execute: EXECUTE,
    generateAudio: GENERATE_AUDIO,
    scrapedAt: parsed.scrapedAt ?? null,
    syncedAt: new Date().toISOString(),
    counts: {
      fireflyPrediction: plan.fireflyItems.length,
      loftyCurrentPrediction: plan.currentPredictionRows.length,
      alreadyPrediction: plan.existingPrediction.length,
      promoteExisting: plan.promoteExisting.length,
      insertNew: plan.insertNew.length,
      demoteMissing: plan.demoteMissing.length,
      existingAudioCandidates: plan.audioCandidates.length,
    },
    promoteExisting: plan.promoteExisting.map(({ row, item }) => ({ id: row.id, text: item.text })),
    insertNew: plan.insertNew.map((item) => ({ sourceId: item.sourceId, text: item.text })),
    demoteMissing: plan.demoteMissing.map((row) => ({ id: row.id, text: row.question_text })),
    audioCandidates: plan.audioCandidates.map((row) => ({ id: row.id, text: row.question_text })),
    insertedRows: [],
    generatedAudio: [],
  };

  if (!EXECUTE) {
    writeJson(REPORT_PATH, report);
    console.log(`\nDry run only. Wrote ${REPORT_PATH}. Add --execute to update pte.rs and generate audio.`);
    return;
  }

  const now = new Date().toISOString();

  await updateInChunks(supabase, plan.demoteMissing.map((row) => row.id), { is_prediction: false, updated_at: now });
  await updateInChunks(supabase, plan.promoteExisting.map(({ row }) => row.id), { is_prediction: true, is_active: true, updated_at: now });

  for (const { item, row } of plan.updateChangedText) {
    const { error } = await supabase.schema("pte").from(TABLE).update({
      question_text: item.text,
      is_prediction: true,
      is_active: true,
      audio_url: null,
      audio_duration_seconds: null,
      ai_voice: null,
      audio_status: "pending",
      audio_error: null,
      audio_variants_json: [],
      audio_variant_count: 0,
      updated_at: now,
    }).eq("id", row.id);
    if (error) throw new Error(error.message);
  }

  const insertedRows = await insertQuestions(supabase, plan.insertNew);
  report.insertedRows = insertedRows.map((row) => ({ id: row.id, text: row.question_text }));

  if (GENERATE_AUDIO) {
    requireEnv("OPENAI_API_KEY");
    requireEnv("CLOUDFLARE_R2_ACCESS_KEY_ID");
    requireEnv("CLOUDFLARE_R2_SECRET_ACCESS_KEY");

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const candidatesById = new Map();

    for (const row of [...plan.audioCandidates, ...insertedRows]) {
      candidatesById.set(row.id, row);
    }

    const candidates = Array.from(candidatesById.values()).slice(0, AUDIO_LIMIT);
    console.log(`\nGenerating RS audio for ${candidates.length} row(s).`);

    for (const [index, question] of candidates.entries()) {
      console.log(`RS audio ${index + 1}/${candidates.length}: ${question.id}`);
      const result = await generateAudioForQuestion(supabase, openai, question);
      report.generatedAudio.push(result);
    }
  }

  writeJson(REPORT_PATH, report);
  console.log(`\nExecute complete. Wrote ${REPORT_PATH}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
