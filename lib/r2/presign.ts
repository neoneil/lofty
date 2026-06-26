import "server-only";

import crypto from "crypto";

type PresignPutUrlParams = {
  key: string;
  expiresInSeconds?: number;
};

const region = "auto";
const service = "s3";

function hmac(key: Buffer | string, value: string) {
  return crypto.createHmac("sha256", key).update(value).digest();
}

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function encodePathKey(key: string) {
  return key
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function getSigningKey(secretAccessKey: string, dateStamp: string) {
  const dateKey = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const dateRegionKey = hmac(dateKey, region);
  const dateRegionServiceKey = hmac(dateRegionKey, service);
  return hmac(dateRegionServiceKey, "aws4_request");
}

function getR2Config() {
  const endpoint = (process.env.CLOUDFLARE_R2_S3_API_ENDPOINT ?? process.env.CLOUDFLARE_R2_ENDPOINT ?? "https://a3258c7ea50842a467e9f67707e29858.r2.cloudflarestorage.com/ted").replace(/\/+$/, "");
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const bucket = process.env.CLOUDFLARE_R2_BUCKET ?? "ted";
  const tedPublicUrl = (process.env.CLOUDFLARE_R2_TED_PUBLIC_URL ?? process.env.CLOUDFLARE_R2_PUBLIC_URL ?? "https://pub-b96989cc617f460facb9c254b7d2c5db.r2.dev").replace(/\/+$/, "");
  const loftyPtePublicUrl = (process.env.CLOUDFLARE_R2_LOFTYPTE_PUBLIC_URL ?? "https://pub-e5d86176c2be4accab1303fe2ffbcc2d.r2.dev").replace(/\/+$/, "");

  if (!accessKeyId || !secretAccessKey) {
    throw new Error("Cloudflare R2 env is missing. Required: CLOUDFLARE_R2_ACCESS_KEY_ID and CLOUDFLARE_R2_SECRET_ACCESS_KEY. CLOUDFLARE_R2_API_TOKEN is for Cloudflare API calls and cannot replace S3 access keys.");
  }

  return {
    endpoint,
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    tedPublicUrl,
    loftyPtePublicUrl,
  };
}

export function sanitizeR2KeyPart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getR2PublicUrl(key: string) {
  const { tedPublicUrl, loftyPtePublicUrl } = getR2Config();
  const publicUrl = key.startsWith("loftypte/") ? loftyPtePublicUrl : tedPublicUrl;
  const publicKey = key.startsWith("loftypte/") && loftyPtePublicUrl.includes("r2.dev") ? key.replace(/^loftypte\//, "") : key;

  return `${publicUrl}/${encodePathKey(publicKey)}`;
}

export function createR2PresignedPutUrl({ key, expiresInSeconds = 900 }: PresignPutUrlParams) {
  const { endpoint, accountId, accessKeyId, secretAccessKey, bucket } = getR2Config();
  const endpointUrl = new URL(endpoint);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const host = endpointUrl.host || `${accountId}.r2.cloudflarestorage.com`;
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
  const canonicalQueryString = Array.from(params.entries())
    .map(([paramKey, value]) => `${encodeURIComponent(paramKey)}=${encodeURIComponent(value)}`)
    .sort()
    .join("&");
  const canonicalRequest = ["PUT", canonicalUri, canonicalQueryString, `host:${host}\n`, signedHeaders, "UNSIGNED-PAYLOAD"].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, sha256(canonicalRequest)].join("\n");
  const signature = crypto.createHmac("sha256", getSigningKey(secretAccessKey, dateStamp)).update(stringToSign).digest("hex");

  params.set("X-Amz-Signature", signature);

  return {
    uploadUrl: `${endpointUrl.protocol}//${host}${canonicalUri}?${params.toString()}`,
    publicUrl: getR2PublicUrl(key),
    key,
  };
}
