import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local", quiet: true });

const LIMIT = 1000;
const writeManifest = process.argv.includes("--write");
const projectRefPath = path.join(process.cwd(), "supabase/.temp/project-ref");
const projectRef = fs.existsSync(projectRefPath) ? fs.readFileSync(projectRefPath, "utf8").trim() : "";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || (projectRef ? `https://${projectRef}.supabase.co` : "");
const serviceKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error("Missing Supabase env. Required: NEXT_PUBLIC_SUPABASE_URL or supabase/.temp/project-ref, and SUPABASE_SECRET_KEY.");
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function bytesFromMetadata(file) {
  const value = file?.metadata?.size ?? file?.metadata?.contentLength ?? file?.metadata?.ContentLength ?? 0;
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function mimeFromMetadata(file) {
  return file?.metadata?.mimetype ?? file?.metadata?.mimeType ?? file?.metadata?.contentType ?? null;
}

function isFolderObject(file) {
  return !file.id && (!file.metadata || Object.keys(file.metadata).length === 0);
}

async function listStoragePath(bucketName, prefix = "") {
  const files = [];
  const folders = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.storage.from(bucketName).list(prefix, {
      limit: LIMIT,
      offset,
      sortBy: {
        column: "name",
        order: "asc",
      },
    });

    if (error) {
      throw new Error(`${bucketName}/${prefix}: ${error.message}`);
    }

    const rows = data ?? [];

    for (const row of rows) {
      const objectPath = prefix ? `${prefix}/${row.name}` : row.name;

      if (isFolderObject(row)) {
        folders.push(objectPath);
      } else {
        files.push({
          bucket: bucketName,
          path: objectPath,
          bytes: bytesFromMetadata(row),
          mime: mimeFromMetadata(row),
          updatedAt: row.updated_at ?? row.created_at ?? null,
        });
      }
    }

    if (rows.length < LIMIT) break;
    offset += LIMIT;
  }

  for (const folder of folders) {
    files.push(...await listStoragePath(bucketName, folder));
  }

  return files;
}

function summarizePrefixes(files) {
  const map = new Map();

  for (const file of files) {
    const [firstSegment] = file.path.split("/");
    const prefix = file.path.includes("/") ? firstSegment : "(root)";
    const current = map.get(prefix) ?? { prefix, count: 0, bytes: 0 };
    current.count += 1;
    current.bytes += file.bytes;
    map.set(prefix, current);
  }

  return [...map.values()]
    .sort((a, b) => b.count - a.count || b.bytes - a.bytes)
    .slice(0, 12)
    .map((item) => ({
      ...item,
      approxMB: Math.round((item.bytes / 1024 / 1024) * 100) / 100,
    }));
}

function summarizeBucket(bucket, files) {
  const bytes = files.reduce((sum, file) => sum + file.bytes, 0);

  return {
    name: bucket.name,
    public: bucket.public,
    fileCount: files.length,
    bytes,
    approxMB: Math.round((bytes / 1024 / 1024) * 100) / 100,
    prefixes: summarizePrefixes(files),
    samples: files.slice(0, 8).map((file) => file.path),
  };
}

const { data: buckets, error } = await supabase.storage.listBuckets();

if (error) {
  throw error;
}

const manifest = {
  generatedAt: new Date().toISOString(),
  source: "supabase-storage",
  buckets: [],
  objects: [],
};

for (const bucket of buckets ?? []) {
  const files = await listStoragePath(bucket.name);
  manifest.buckets.push(summarizeBucket(bucket, files));
  manifest.objects.push(...files);
}

const totalBytes = manifest.objects.reduce((sum, file) => sum + file.bytes, 0);

console.log(JSON.stringify({
  bucketCount: manifest.buckets.length,
  fileCount: manifest.objects.length,
  bytes: totalBytes,
  approxMB: Math.round((totalBytes / 1024 / 1024) * 100) / 100,
  buckets: manifest.buckets,
}, null, 2));

if (writeManifest) {
  const outputDir = path.join(process.cwd(), "download");
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, "supabase-storage-inventory.json");
  fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Wrote ${outputPath}`);
}
