import crypto from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

import dotenv from "dotenv";

dotenv.config({ path: ".env.local", quiet: true });

const REGION = "auto";
const SERVICE = "s3";
const MANIFEST_PATH = path.join(process.cwd(), "content", "ielts", "vocabulary", "listening", "scene-vocabulary.json");
const REPORT_PATH = path.join(process.cwd(), "download", "ielts-listening-vocabulary-audio-r2-report.json");
const execute = process.argv.includes("--execute");
const force = process.argv.includes("--force");
const requestTimeoutMs = 90_000;
const retryCount = 3;

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

function getR2Config() {
  const endpoint = (process.env.CLOUDFLARE_R2_S3_API_ENDPOINT ?? process.env.CLOUDFLARE_R2_ENDPOINT ?? "").replace(/\/+$/, "");
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const bucket = process.env.CLOUDFLARE_R2_PRIVATE_BUCKET;

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("Missing private R2 env. Required: CLOUDFLARE_R2_S3_API_ENDPOINT, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY, CLOUDFLARE_R2_PRIVATE_BUCKET.");
  }

  return { endpoint, accessKeyId, secretAccessKey, bucket };
}

function createR2PresignedUrl({ method, key, expiresInSeconds = 900 }) {
  const { endpoint, accessKeyId, secretAccessKey, bucket } = getR2Config();
  const endpointUrl = new URL(endpoint);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const host = endpointUrl.host;
  const canonicalUri = `/${bucket}/${encodePathKey(key.replace(/^\/+/, ""))}`;
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

async function objectExists(key) {
  const response = await fetchWithRetry(`HEAD ${key}`, createR2PresignedUrl({ method: "HEAD", key, expiresInSeconds: 120 }), { method: "HEAD" });
  if (response.status === 404) return false;
  if (response.ok) return true;
  throw new Error(`R2 HEAD failed for ${key}: ${response.status} ${response.statusText}`);
}

async function uploadFile(file) {
  const response = uploadWithCurl(file);

  if (!response.ok) throw new Error(`R2 upload failed for ${file.r2Key}: ${response.status} ${response.statusText}`);
}

function uploadWithCurl(file) {
  const url = createR2PresignedUrl({ method: "PUT", key: file.r2Key });
  const result = spawnSync("curl", [
    "--fail",
    "--silent",
    "--show-error",
    "--max-time",
    "180",
    "-X",
    "PUT",
    "-H",
    `Content-Type: ${file.contentType}`,
    "--upload-file",
    file.sourcePath,
    url,
  ], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
  });

  if (result.status === 0) return { ok: true, status: 200, statusText: "OK" };
  return {
    ok: false,
    status: result.status ?? 1,
    statusText: (result.stderr || result.stdout || result.error?.message || "curl upload failed").trim(),
  };
}

async function fetchWithRetry(label, url, options) {
  let lastError;

  for (let attempt = 1; attempt <= retryCount; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

    try {
      return await fetch(url, {
        ...options,
        signal: controller.signal,
      });
    } catch (error) {
      lastError = error;
      console.warn(`${label} attempt ${attempt}/${retryCount} failed: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError;
}

const document = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
const files = document.scenes
  .map((scene) => scene.audio ? { sceneCode: scene.sceneCode, title: scene.title, ...scene.audio } : null)
  .filter(Boolean);
const report = {
  execute,
  force,
  generatedAt: new Date().toISOString(),
  bucket: getR2Config().bucket,
  files: [],
};

console.log(`IELTS listening vocabulary audio candidates: ${files.length} execute=${execute} force=${force}`);

for (const file of files) {
  if (!execute) {
    console.log(`PLAN ${file.fileName} -> ${file.r2Key}`);
    report.files.push({ fileName: file.fileName, r2Key: file.r2Key, status: "planned", bytes: file.size });
    continue;
  }

  if (!force && await objectExists(file.r2Key)) {
    console.log(`SKIP existing ${file.r2Key}`);
    report.files.push({ fileName: file.fileName, r2Key: file.r2Key, status: "skipped", reason: "exists", bytes: file.size });
    continue;
  }

  console.log(`UPLOAD ${file.fileName} -> ${file.r2Key}`);
  await uploadFile(file);
  report.files.push({ fileName: file.fileName, r2Key: file.r2Key, status: "uploaded", bytes: file.size });
}

writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`Report: ${REPORT_PATH}`);
