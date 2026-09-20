import dotenv from "dotenv";
import OpenAI from "openai";
import crypto from "node:crypto";
import type { PteAiAudioVoice } from "../lib/pte-ai-audio/voices";

dotenv.config({ path: ".env.local", quiet: true });

async function main() {
const [{ RS_CORE_DRILLS }, voiceModule] = await Promise.all([
  import("../content/pte/rs-core-drills"),
  import("../lib/pte-ai-audio/voices"),
]);

const { PTE_AI_AUDIO_MODEL, PTE_AI_AUDIO_VOICES, getPteAiAudioPublicUrl, getPteAiAudioR2Key } = voiceModule;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function hmac(key: Buffer | string, value: string) { return crypto.createHmac("sha256", key).update(value).digest(); }
function sha256(value: string) { return crypto.createHash("sha256").update(value).digest("hex"); }
function encodePathKey(key: string) { return key.split("/").map((part) => encodeURIComponent(part)).join("/"); }
function getSigningKey(secret: string, date: string) {
  const dateKey = hmac(`AWS4${secret}`, date);
  const regionKey = hmac(dateKey, "auto");
  const serviceKey = hmac(regionKey, "s3");
  return hmac(serviceKey, "aws4_request");
}
function createUploadUrl(key: string) {
  const endpoint = (process.env.CLOUDFLARE_R2_S3_API_ENDPOINT ?? "").replace(/\/+$/, "");
  const accessKey = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secret = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const bucket = process.env.CLOUDFLARE_R2_BUCKET ?? "ted";
  if (!endpoint || !accessKey || !secret) throw new Error("Missing R2 environment.");
  const endpointUrl = new URL(endpoint);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const date = amzDate.slice(0, 8);
  const scope = `${date}/auto/s3/aws4_request`;
  const host = endpointUrl.host;
  const endpointPath = endpointUrl.pathname.replace(/\/+$/, "");
  const canonicalUri = `${endpointPath || `/${bucket}`}/${encodePathKey(key)}`;
  const params = new URLSearchParams({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${accessKey}/${scope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": "900",
    "X-Amz-SignedHeaders": "host",
  });
  const query = Array.from(params.entries()).map(([name, value]) => `${encodeURIComponent(name)}=${encodeURIComponent(value)}`).sort().join("&");
  const request = ["PUT", canonicalUri, query, `host:${host}\n`, "host", "UNSIGNED-PAYLOAD"].join("\n");
  const signature = crypto.createHmac("sha256", getSigningKey(secret, date)).update(["AWS4-HMAC-SHA256", amzDate, scope, sha256(request)].join("\n")).digest("hex");
  params.set("X-Amz-Signature", signature);
  return `${endpointUrl.protocol}//${host}${canonicalUri}?${params.toString()}`;
}

type Job = {
  questionId: string;
  text: string;
  voice: PteAiAudioVoice;
};

const allJobs: Job[] = RS_CORE_DRILLS.flatMap((question) =>
  PTE_AI_AUDIO_VOICES.map((voice) => ({ questionId: question.id, text: question.question_text, voice: voice.id })),
);
const limitArg = process.argv.find((argument) => argument.startsWith("--limit="));
const limit = limitArg ? Math.max(1, Number.parseInt(limitArg.slice(8), 10) || 1) : allJobs.length;
const jobs = allJobs.slice(0, limit);

async function exists(job: Job) {
  const response = await fetch(getPteAiAudioPublicUrl("rs", job.questionId, job.voice), { method: "HEAD" });
  return response.ok;
}

async function generate(job: Job) {
  const result = await openai.audio.speech.create({
    model: PTE_AI_AUDIO_MODEL,
    voice: job.voice,
    input: job.text,
    instructions: "Read this PTE Repeat Sentence item once in clear, natural English. Use a steady exam-style pace. Do not add any commentary.",
    response_format: "mp3",
  });
  return Buffer.from(await result.arrayBuffer());
}

async function upload(job: Job, audio: Buffer) {
  const key = getPteAiAudioR2Key("rs", job.questionId, job.voice);
  const response = await fetch(createUploadUrl(key), { method: "PUT", headers: { "Content-Type": "audio/mpeg" }, body: new Uint8Array(audio) });
  if (!response.ok) throw new Error(`R2 ${response.status} ${response.statusText}`);
}

async function runWithRetry(job: Job) {
  if (await exists(job)) return "skipped" as const;
  let audio: Buffer | null = null;
  let lastError: unknown;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      audio = await generate(job);
      break;
    } catch (error) {
      lastError = error;
      if (attempt < 5) await new Promise((resolve) => setTimeout(resolve, 1500 * attempt * attempt));
    }
  }
  if (!audio) throw lastError;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      await upload(job, audio);
      return "generated" as const;
    } catch (error) {
      lastError = error;
      if (attempt < 5) await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
  throw lastError;
}

let cursor = 0;
let generated = 0;
let skipped = 0;
const failures: Array<{ job: Job; error: string }> = [];

async function worker() {
  while (cursor < jobs.length) {
    const current = cursor;
    cursor += 1;
    const job = jobs[current];
    try {
      const result = await runWithRetry(job);
      if (result === "generated") generated += 1;
      else skipped += 1;
      console.log(`[${current + 1}/${jobs.length}] ${result} ${job.questionId} ${job.voice}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push({ job, error: message });
      console.error(`[${current + 1}/${jobs.length}] failed ${job.questionId} ${job.voice}: ${message}`);
    }
  }
}

await Promise.all(Array.from({ length: 3 }, () => worker()));
console.log(JSON.stringify({ total: jobs.length, generated, skipped, failed: failures.length, failures }, null, 2));
if (failures.length > 0) process.exitCode = 1;
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
