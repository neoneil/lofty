import crypto from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import dotenv from "dotenv";

dotenv.config({ path: ".env.local", quiet: true });

const SOURCE_DIR = "/mnt/c/Users/adela/Downloads/pronounce";
const REGION = "auto";
const SERVICE = "s3";
const PUBLIC_BASE_URL = (process.env.CLOUDFLARE_R2_PUBLIC_URL || process.env.CLOUDFLARE_R2_TED_PUBLIC_URL || "https://pub-b96989cc617f460facb9c254b7d2c5db.r2.dev").replace(/\/+$/, "");
const ENDPOINT = (process.env.CLOUDFLARE_R2_S3_API_ENDPOINT || process.env.CLOUDFLARE_R2_ENDPOINT || "").replace(/\/+$/, "");
const ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const BUCKET = process.env.CLOUDFLARE_R2_BUCKET || "ted";

if (!ENDPOINT || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
  throw new Error("Missing R2 upload env. Required: CLOUDFLARE_R2_S3_API_ENDPOINT, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY.");
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
  const dateRegionKey = hmac(dateKey, REGION);
  const dateRegionServiceKey = hmac(dateRegionKey, SERVICE);
  return hmac(dateRegionServiceKey, "aws4_request");
}

function createR2PresignedUrl({ method, key, expiresInSeconds = 900 }) {
  const endpointUrl = new URL(ENDPOINT);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const host = endpointUrl.host;
  const canonicalUri = `/${BUCKET}/${encodePathKey(key.replace(/^\/+/, ""))}`;
  const credential = `${ACCESS_KEY_ID}/${credentialScope}`;
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
  const signature = crypto.createHmac("sha256", getSigningKey(SECRET_ACCESS_KEY, dateStamp)).update(stringToSign).digest("hex");

  params.set("X-Amz-Signature", signature);

  return `${endpointUrl.protocol}//${host}${canonicalUri}?${params.toString()}`;
}

function sanitizeName(fileName) {
  return fileName
    .toLowerCase()
    .replace(/\.(mp3|jpe?g)$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getR2Key(fileName) {
  if (/^phonemic-chart\.(jpe?g)$/i.test(fileName)) return "pronunciation/phonemic-chart.jpg";
  return `pronunciation/${sanitizeName(fileName)}.mp3`;
}

function getPublicUrl(key) {
  return `${PUBLIC_BASE_URL}/${encodePathKey(key)}`;
}

async function uploadFile(fileName) {
  const sourcePath = path.join(SOURCE_DIR, fileName);
  const body = readFileSync(sourcePath);
  const key = getR2Key(fileName);
  const contentType = key.endsWith(".mp3") ? "audio/mpeg" : "image/jpeg";
  const response = await fetch(createR2PresignedUrl({ method: "PUT", key }), {
    method: "PUT",
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": contentType,
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`R2 PUT failed for ${fileName}: ${response.status} ${response.statusText}`);
  }

  return {
    fileName,
    key,
    url: getPublicUrl(key),
    bytes: body.length,
  };
}

const files = readdirSync(SOURCE_DIR).filter((fileName) => /\.(mp3|jpe?g)$/i.test(fileName)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
const results = [];

for (const fileName of files) {
  const result = await uploadFile(fileName);
  results.push(result);
  console.log(`uploaded ${result.fileName} -> ${result.key}`);
}

console.log(JSON.stringify({
  bucket: BUCKET,
  count: results.length,
  audioCount: results.filter((result) => result.key.endsWith(".mp3")).length,
  imageCount: results.filter((result) => result.key.endsWith(".jpg")).length,
  publicBaseUrl: PUBLIC_BASE_URL,
  files: results,
}, null, 2));
