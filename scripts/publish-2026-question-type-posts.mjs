import crypto from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local", quiet: true });

const root = process.cwd();
const manifest = JSON.parse(
  readFileSync(
    path.join(root, "content/posts/2026-question-type-posts.json"),
    "utf8",
  ),
);
const prefix = "images/posts/2026-question-types";
const region = "auto";
const service = "s3";
const publicBase = (
  process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL ||
  process.env.CLOUDFLARE_R2_PUBLIC_URL ||
  "https://pub-b96989cc617f460facb9c254b7d2c5db.r2.dev"
).replace(/\/+$/, "");
const endpoint = (
  process.env.CLOUDFLARE_R2_S3_API_ENDPOINT ||
  process.env.CLOUDFLARE_R2_ENDPOINT ||
  ""
).replace(/\/+$/, "");
const bucket = process.env.CLOUDFLARE_R2_BUCKET || "ted";

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SECRET_KEY",
  "CLOUDFLARE_R2_ACCESS_KEY_ID",
  "CLOUDFLARE_R2_SECRET_ACCESS_KEY",
];

for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing ${key}`);
}

if (!endpoint) throw new Error("Missing Cloudflare R2 endpoint");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

function hmac(key, value) {
  return crypto.createHmac("sha256", key).update(value).digest();
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function encodePathKey(key) {
  return key.split("/").map(encodeURIComponent).join("/");
}

function signingKey(secret, date) {
  const dateKey = hmac(`AWS4${secret}`, date);
  const regionKey = hmac(dateKey, region);
  const serviceKey = hmac(regionKey, service);
  return hmac(serviceKey, "aws4_request");
}

function presignedPutUrl(key) {
  const url = new URL(endpoint);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const date = amzDate.slice(0, 8);
  const scope = `${date}/${region}/${service}/aws4_request`;
  const endpointPath = url.pathname.replace(/\/+$/, "");
  const canonicalUri = `${endpointPath || `/${bucket}`}/${encodePathKey(key)}`;
  const params = new URLSearchParams({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${process.env.CLOUDFLARE_R2_ACCESS_KEY_ID}/${scope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": "900",
    "X-Amz-SignedHeaders": "host",
  });
  const query = [...params.entries()]
    .map(([name, value]) => `${encodeURIComponent(name)}=${encodeURIComponent(value)}`)
    .sort()
    .join("&");
  const request = [
    "PUT",
    canonicalUri,
    query,
    `host:${url.host}\n`,
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const toSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(request)].join("\n");
  const signature = crypto
    .createHmac(
      "sha256",
      signingKey(process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY, date),
    )
    .update(toSign)
    .digest("hex");
  params.set("X-Amz-Signature", signature);
  return `${url.protocol}//${url.host}${canonicalUri}?${params}`;
}

function publicUrl(key) {
  return `${publicBase}/${encodePathKey(key)}`;
}

async function uploadCover(post) {
  const key = `${prefix}/${post.slug}.webp`;
  const filePath = path.join(
    root,
    "output/imagegen/2026-question-type-posts",
    `${post.slug}.webp`,
  );
  const body = readFileSync(filePath);
  const response = await fetch(presignedPutUrl(key), {
    method: "PUT",
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": "image/webp",
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`R2 upload failed ${response.status}: ${post.slug}`);
  }

  const coverImage = publicUrl(key);
  const verification = await fetch(coverImage, { method: "HEAD", cache: "no-store" });

  if (!verification.ok) {
    throw new Error(`R2 verification failed ${verification.status}: ${post.slug}`);
  }

  return coverImage;
}

async function main() {
  const slugs = manifest.posts.map((post) => post.slug);
  const { data: before, error: beforeError } = await supabase
    .from("posts")
    .select("id, title, slug, excerpt, content, cover_image, status, author_id, published_at, category, pinned_order")
    .in("slug", slugs);

  if (beforeError) throw beforeError;

  mkdirSync(path.join(root, "tmp/posts"), { recursive: true });
  writeFileSync(
    path.join(root, "tmp/posts/2026-question-type-posts-before.json"),
    `${JSON.stringify(before, null, 2)}\n`,
  );

  const authorId =
    before?.[0]?.author_id || "f54bfb5e-19aa-4317-b678-d6ca6a41f5ce";
  const now = new Date().toISOString();
  const rows = [];

  for (const [index, post] of manifest.posts.entries()) {
    process.stdout.write(`[${index + 1}/${manifest.posts.length}] ${post.slug} ... `);
    const coverImage = await uploadCover(post);
    rows.push({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      cover_image: coverImage,
      status: "published",
      author_id: authorId,
      published_at:
        before?.find((existing) => existing.slug === post.slug)?.published_at || now,
      category: post.exam === "pte" ? "PTE" : "雅思",
      pinned_order: 0,
      updated_at: now,
    });
    console.log("uploaded");
  }

  const { error: upsertError } = await supabase
    .from("posts")
    .upsert(rows, { onConflict: "slug" });

  if (upsertError) throw upsertError;

  const { data: verified, error: verifyError } = await supabase
    .from("posts")
    .select("id, title, slug, status, category, cover_image, pinned_order")
    .in("slug", slugs)
    .order("title");

  if (verifyError) throw verifyError;
  if (verified?.length !== manifest.posts.length) {
    throw new Error(`Expected ${manifest.posts.length} posts, found ${verified?.length ?? 0}`);
  }

  writeFileSync(
    path.join(root, "tmp/posts/2026-question-type-posts-published.json"),
    `${JSON.stringify(verified, null, 2)}\n`,
  );
  console.log(`Published and verified ${verified.length} posts.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
