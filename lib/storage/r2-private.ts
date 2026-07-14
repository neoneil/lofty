import "server-only";

import crypto from "crypto";

const REGION = "auto";
const SERVICE = "s3";

function hmac(key: Buffer | string, value: string) {
  return crypto.createHmac("sha256", key).update(value).digest();
}

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function encodePathKey(key: string) {
  return key.split("/").map((part) => encodeURIComponent(part)).join("/");
}

function getSigningKey(secretAccessKey: string, dateStamp: string) {
  const dateKey = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const dateRegionKey = hmac(dateKey, REGION);
  const dateRegionServiceKey = hmac(dateRegionKey, SERVICE);
  return hmac(dateRegionServiceKey, "aws4_request");
}

function getR2PrivateConfig() {
  const endpoint = (process.env.CLOUDFLARE_R2_S3_API_ENDPOINT ?? process.env.CLOUDFLARE_R2_ENDPOINT ?? "").replace(/\/+$/, "");
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const bucket = process.env.CLOUDFLARE_R2_PRIVATE_BUCKET;

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("Missing private R2 env. Required: CLOUDFLARE_R2_S3_API_ENDPOINT, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY, CLOUDFLARE_R2_PRIVATE_BUCKET.");
  }

  return {
    endpoint,
    accessKeyId,
    secretAccessKey,
    bucket,
  };
}

export function createPrivateR2PresignedUrl({ method, key, expiresInSeconds = 900 }: { method: "GET" | "HEAD" | "PUT"; key: string; expiresInSeconds?: number }) {
  const { endpoint, accessKeyId, secretAccessKey, bucket } = getR2PrivateConfig();
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

export async function uploadPrivateR2Object({ key, file, contentType }: { key: string; file: File | Blob; contentType?: string }) {
  const uploadUrl = createPrivateR2PresignedUrl({ method: "PUT", key, expiresInSeconds: 900 });
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType || file.type || "application/octet-stream",
    },
    body: Buffer.from(await file.arrayBuffer()),
  });

  if (!response.ok) {
    throw new Error(`Private R2 upload failed: ${response.status} ${response.statusText}`);
  }

  return key;
}

export function createPrivateR2PlaybackUrl(key: string) {
  return createPrivateR2PresignedUrl({ method: "GET", key, expiresInSeconds: 900 });
}
