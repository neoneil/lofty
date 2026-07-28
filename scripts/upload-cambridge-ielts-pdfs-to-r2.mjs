import crypto from "node:crypto";
import { createReadStream, readdirSync, statSync } from "node:fs";
import path from "node:path";

import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SOURCE_DIR = path.join(process.cwd(), "public", "cambridge_ielts");
const DESTINATION_PREFIX = "ielts/cambridge_ielts";
const DEFAULT_BUCKET = "ted";
const region = "auto";
const service = "s3";

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
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

function getR2Config() {
  const endpoint = (process.env.CLOUDFLARE_R2_S3_API_ENDPOINT ?? process.env.CLOUDFLARE_R2_ENDPOINT ?? `https://a3258c7ea50842a467e9f67707e29858.r2.cloudflarestorage.com/${DEFAULT_BUCKET}`).replace(/\/+$/, "");
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const bucket = process.env.CLOUDFLARE_R2_BUCKET ?? DEFAULT_BUCKET;
  const publicUrl = (process.env.CLOUDFLARE_R2_PUBLIC_URL ?? process.env.CLOUDFLARE_R2_TED_PUBLIC_URL ?? "https://pub-b96989cc617f460facb9c254b7d2c5db.r2.dev").replace(/\/+$/, "");

  if (!accessKeyId || !secretAccessKey) throw new Error("Missing R2 env. Required: CLOUDFLARE_R2_ACCESS_KEY_ID and CLOUDFLARE_R2_SECRET_ACCESS_KEY.");

  return { endpoint, accessKeyId, secretAccessKey, bucket, publicUrl };
}

function createR2PresignedUrl({ method, key, expiresInSeconds = 900 }) {
  const { endpoint, accessKeyId, secretAccessKey, bucket } = getR2Config();
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
    "X-Amz-Expires": String(expiresInSeconds),
    "X-Amz-SignedHeaders": signedHeaders,
  });
  const canonicalQueryString = Array.from(params.entries()).map(([paramKey, value]) => `${encodeURIComponent(paramKey)}=${encodeURIComponent(value)}`).sort().join("&");
  const canonicalRequest = [method, canonicalUri, canonicalQueryString, `host:${host}\n`, signedHeaders, "UNSIGNED-PAYLOAD"].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, sha256(canonicalRequest)].join("\n");
  const signature = crypto.createHmac("sha256", getSigningKey(secretAccessKey, dateStamp)).update(stringToSign).digest("hex");
  params.set("X-Amz-Signature", signature);

  return `${endpointUrl.protocol}//${host}${canonicalUri}?${params.toString()}`;
}

function publicUrl(key) {
  return `${getR2Config().publicUrl}/${encodePathKey(key)}`;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry(label, fn, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      const waitMs = attempt * 3000;
      console.warn(`${label} failed on attempt ${attempt}/${attempts}: ${error.message}. Retrying in ${waitMs}ms.`);
      await delay(waitMs);
    }
  }
  throw lastError;
}

function getPdfFiles() {
  return readdirSync(SOURCE_DIR)
    .filter((fileName) => /^Cambridge-IELTS-\d{2}\.pdf$/i.test(fileName))
    .sort()
    .map((fileName) => {
      const sourcePath = path.join(SOURCE_DIR, fileName);
      return {
        fileName,
        sourcePath,
        key: `${DESTINATION_PREFIX}/${fileName}`,
        size: statSync(sourcePath).size,
      };
    });
}

async function objectExists(key) {
  const response = await fetch(publicUrl(key), { method: "HEAD" });
  return response.ok;
}

async function uploadFile(file) {
  const response = await fetch(createR2PresignedUrl({ method: "PUT", key: file.key }), {
    method: "PUT",
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(file.size),
    },
    body: createReadStream(file.sourcePath),
    duplex: "half",
  });

  if (!response.ok) throw new Error(`R2 upload failed ${response.status} ${response.statusText}`);
}

const execute = hasFlag("execute");
const force = hasFlag("force");
const files = getPdfFiles();

console.log(`Cambridge IELTS PDF upload candidates: ${files.length} execute=${execute} force=${force}`);
for (const file of files) {
  console.log(`${file.fileName} -> ${file.key} (${file.size} bytes)`);
}

if (!execute) {
  console.log("\nDry run only. Add --execute to upload PDFs to R2.");
  process.exit(0);
}

for (const file of files) {
  if (!force && await withRetry(`HEAD ${file.key}`, () => objectExists(file.key))) {
    console.log(`Skipping existing ${file.key}`);
    continue;
  }

  console.log(`Uploading ${file.key}`);
  await withRetry(`PUT ${file.key}`, () => uploadFile(file));
}

console.log("\nCompleted Cambridge IELTS PDF upload.");
