import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local", quiet: true });

const REGION = "auto";
const SERVICE = "s3";
const DEFAULT_BUCKET = "ted";
const DEFAULT_PUBLIC_URL = "https://pub-b96989cc617f460facb9c254b7d2c5db.r2.dev";
const MANIFEST_PATH = path.join(process.cwd(), "download/supabase-storage-inventory.json");
const execute = process.argv.includes("--execute");
const privateDestination = process.argv.includes("--private");
const onlyArg = process.argv.find((arg) => arg.startsWith("--only="));
const onlyPrefix = onlyArg ? onlyArg.slice("--only=".length).replace(/^\/+|\/+$/g, "") : null;
const REPORT_PATH = path.join(process.cwd(), execute ? "download/supabase-storage-r2-copy-execute-report.json" : "download/supabase-storage-r2-copy-report.json");
const includePrivate = process.argv.includes("--include-private");
const force = process.argv.includes("--force");
const concurrencyArg = process.argv.find((arg) => arg.startsWith("--concurrency="));
const concurrency = Math.max(1, Math.min(8, Number(concurrencyArg?.split("=")[1] ?? 3)));
const requestTimeoutMs = 600_000;
const retryCount = 3;

const projectRefPath = path.join(process.cwd(), "supabase/.temp/project-ref");
const projectRef = fs.existsSync(projectRefPath) ? fs.readFileSync(projectRefPath, "utf8").trim() : "";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || (projectRef ? `https://${projectRef}.supabase.co` : "");
const serviceKey = process.env.SUPABASE_SECRET_KEY;
const r2Endpoint = (process.env.CLOUDFLARE_R2_S3_API_ENDPOINT ?? process.env.CLOUDFLARE_R2_ENDPOINT ?? `https://a3258c7ea50842a467e9f67707e29858.r2.cloudflarestorage.com/${DEFAULT_BUCKET}`).replace(/\/+$/, "");
const r2Bucket = privateDestination ? process.env.CLOUDFLARE_R2_PRIVATE_BUCKET : process.env.CLOUDFLARE_R2_BUCKET ?? DEFAULT_BUCKET;
const r2PublicUrl = (process.env.CLOUDFLARE_R2_PUBLIC_URL ?? process.env.CLOUDFLARE_R2_TED_PUBLIC_URL ?? DEFAULT_PUBLIC_URL).replace(/\/+$/, "");
const r2AccessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const r2SecretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error("Missing Supabase env. Required: NEXT_PUBLIC_SUPABASE_URL or supabase/.temp/project-ref, and SUPABASE_SECRET_KEY.");
}

if (!r2AccessKeyId || !r2SecretAccessKey) {
  throw new Error("Missing R2 env. Required: CLOUDFLARE_R2_ACCESS_KEY_ID and CLOUDFLARE_R2_SECRET_ACCESS_KEY.");
}

if (!r2Bucket) {
  throw new Error(privateDestination ? "Missing CLOUDFLARE_R2_PRIVATE_BUCKET." : "Missing CLOUDFLARE_R2_BUCKET.");
}

if (!fs.existsSync(MANIFEST_PATH)) {
  throw new Error(`Missing inventory manifest. Run: node scripts/inventory-supabase-storage.mjs --write`);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

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
  const dateRegionKey = hmac(dateKey, REGION);
  const dateRegionServiceKey = hmac(dateRegionKey, SERVICE);
  return hmac(dateRegionServiceKey, "aws4_request");
}

function createR2PresignedUrl({ method, key, expiresInSeconds = 900 }) {
  const endpointUrl = new URL(r2Endpoint);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const host = endpointUrl.host;
  const endpointPath = endpointUrl.pathname.replace(/\/+$/, "");
  const canonicalUri = `${endpointPath || `/${r2Bucket}`}/${encodePathKey(key)}`;
  const credential = `${r2AccessKeyId}/${credentialScope}`;
  const signedHeaders = "host";
  const params = new URLSearchParams({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": credential,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresInSeconds),
    "X-Amz-SignedHeaders": signedHeaders,
  });
  const canonicalQueryString = Array.from(params.entries()).map(([paramKey, value]) => `${encodeURIComponent(paramKey)}=${encodeURIComponent(value)}`).sort().join("&");
  const canonicalRequest = [method, canonicalUri, canonicalQueryString, `host:${host}\n`, signedHeaders, "UNSIGNED-PAYLOAD"].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, sha256(canonicalRequest)].join("\n");
  const signature = crypto.createHmac("sha256", getSigningKey(r2SecretAccessKey, dateStamp)).update(stringToSign).digest("hex");
  params.set("X-Amz-Signature", signature);
  return `${endpointUrl.protocol}//${host}${canonicalUri}?${params.toString()}`;
}

function publicR2Url(key) {
  if (privateDestination) return null;
  return `${r2PublicUrl}/${encodePathKey(key)}`;
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function withRetry(label, task) {
  let lastError;

  for (let attempt = 1; attempt <= retryCount; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      console.error(`${label} attempt ${attempt}/${retryCount} failed: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    }
  }

  throw lastError;
}

async function downloadSupabaseObject(object) {
  const url = `${supabaseUrl}/storage/v1/object/${encodeURIComponent(object.bucket)}/${encodePathKey(object.path)}`;
  const response = await withRetry(`Supabase GET ${object.bucket}/${object.path}`, () => fetchWithTimeout(url, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  }));

  if (!response.ok) {
    throw new Error(`Supabase GET failed for ${object.bucket}/${object.path}: ${response.status} ${response.statusText}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

function destinationKey(object) {
  return `${object.bucket}/${object.path}`.replace(/^\/+/, "");
}

function shouldSkipObject(object) {
  if (!includePrivate) {
    const bucket = manifest.buckets.find((item) => item.name === object.bucket);
    if (bucket && !bucket.public) return "private-bucket";
  }

  if (object.path.endsWith(".emptyFolderPlaceholder")) return "folder-placeholder";
  return null;
}

async function r2ObjectExists(key) {
  if (force) return false;
  const response = await withRetry(`R2 HEAD ${key}`, () => fetchWithTimeout(createR2PresignedUrl({ method: "HEAD", key, expiresInSeconds: 120 }), { method: "HEAD" }));
  if (response.status === 404) return false;
  if (response.ok) return true;
  throw new Error(`R2 HEAD failed for ${key}: ${response.status} ${response.statusText}`);
}

async function copyObject(object) {
  const key = destinationKey(object);
  const skipReason = shouldSkipObject(object);

  if (skipReason) {
    return { source: `${object.bucket}/${object.path}`, key, status: "skipped", reason: skipReason };
  }

  if (!execute) {
    return { source: `${object.bucket}/${object.path}`, key, status: "planned", bytes: object.bytes, publicUrl: publicR2Url(key) };
  }

  if (await r2ObjectExists(key)) {
    return { source: `${object.bucket}/${object.path}`, key, status: "skipped", reason: "exists", publicUrl: publicR2Url(key) };
  }

  const body = await downloadSupabaseObject(object);
  const response = await withRetry(`R2 PUT ${key}`, () => fetchWithTimeout(createR2PresignedUrl({ method: "PUT", key }), {
      method: "PUT",
      headers: {
        "Content-Type": object.mime || "application/octet-stream",
      },
      body,
    }));

  if (!response.ok) {
    throw new Error(`R2 PUT failed for ${key}: ${response.status} ${response.statusText}`);
  }

  return { source: `${object.bucket}/${object.path}`, key, status: "copied", bytes: object.bytes, publicUrl: publicR2Url(key) };
}

async function runPool(items, worker) {
  const results = [];
  let index = 0;
  let completed = 0;

  async function next() {
    while (index < items.length) {
      const currentIndex = index;
      index += 1;

      try {
        const result = await worker(items[currentIndex], currentIndex);
        results[currentIndex] = result;
        completed += 1;
        if (completed % 25 === 0 || completed === items.length) {
          writeReport(results);
          console.log(`${execute ? "checked/copied" : "planned"} ${completed}/${items.length}`);
        }
      } catch (error) {
        results[currentIndex] = { source: `${items[currentIndex].bucket}/${items[currentIndex].path}`, key: destinationKey(items[currentIndex]), status: "error", error: error.message };
        completed += 1;
        if (completed % 25 === 0 || completed === items.length) {
          writeReport(results);
        }
        console.error(error.message);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, next));
  return results;
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
const objects = onlyPrefix ? manifest.objects.filter((object) => `${object.bucket}/${object.path}`.startsWith(`${onlyPrefix}/`) || `${object.bucket}/${object.path}` === onlyPrefix) : manifest.objects;

function buildReport(results) {
  return {
    generatedAt: new Date().toISOString(),
    mode: execute ? "execute" : "dry-run",
    privateDestination,
    onlyPrefix,
    includePrivate,
    force,
    destination: {
      bucket: r2Bucket,
      keyPattern: "<supabase-bucket>/<object-path>",
      publicUrlPattern: privateDestination ? "signed-url-only" : `${r2PublicUrl}/<supabase-bucket>/<object-path>`,
    },
    summary: results.filter(Boolean).reduce((acc, result) => {
      acc[result.status] = (acc[result.status] ?? 0) + 1;
      return acc;
    }, {}),
    completedCount: results.filter(Boolean).length,
    totalCount: objects.length,
    results: results.filter(Boolean),
  };
}

function writeReport(results) {
  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(buildReport(results), null, 2)}\n`);
}

const plan = objects.map((object) => ({
  object,
  skipReason: shouldSkipObject(object),
}));
const plannedObjects = plan.filter((item) => !item.skipReason).map((item) => item.object);
const skippedObjects = plan.filter((item) => item.skipReason);
const plannedBytes = plannedObjects.reduce((sum, object) => sum + object.bytes, 0);

console.log(JSON.stringify({
  mode: execute ? "execute" : "dry-run",
  privateDestination,
  onlyPrefix,
    destination: {
      bucket: r2Bucket,
      keyPattern: "<supabase-bucket>/<object-path>",
      publicUrlPattern: privateDestination ? "signed-url-only" : `${r2PublicUrl}/<supabase-bucket>/<object-path>`,
  },
  includePrivate,
  force,
  totalSourceObjects: objects.length,
  plannedObjects: plannedObjects.length,
  skippedBeforeCopy: skippedObjects.length,
  plannedApproxMB: Math.round((plannedBytes / 1024 / 1024) * 100) / 100,
}, null, 2));

const results = await runPool(objects, copyObject);
writeReport(results);
console.log(`Wrote ${REPORT_PATH}`);
