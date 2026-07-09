import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function readEnv() {
  const env = {};
  for (const line of fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)) {
    if (!line.includes("=") || line.trim().startsWith("#")) continue;
    const index = line.indexOf("=");
    env[line.slice(0, index).trim()] = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
  }
  return env;
}

const env = readEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !serviceKey) throw new Error("Missing Supabase env");

const authHeaders = {
  apikey: serviceKey,
  authorization: `Bearer ${serviceKey}`,
};

const failedAssets = [
  {
    url: "https://res.ytaxx.com/ielts/common/20260630/1782805908077.mp3",
    storagePath: "21/test-1/listening/audio/1782805908077.mp3",
  },
  {
    url: "https://material.ytaxx.com/dmg/20260630/19c08c26cd484ec8829affdf20d7535e.mp3",
    storagePath: "21/test-1/listening/audio/19c08c26cd484ec8829affdf20d7535e.mp3",
  },
  {
    url: "https://res.ytaxx.com/ielts/common/20260630/1782805995993.mp3",
    storagePath: "21/test-2/listening/audio/1782805995993.mp3",
  },
  {
    url: "https://res.ytaxx.com/ielts/common/20260630/1782806025050.mp3",
    storagePath: "21/test-3/listening/audio/1782806025050.mp3",
  },
  {
    url: "https://res.ytaxx.com/ielts/common/20260630/1782806049906.mp3",
    storagePath: "21/test-4/listening/audio/1782806049906.mp3",
  },
];

async function patchAsset(sourceUrl, storagePath, contentType, bytes) {
  const url = `${supabaseUrl}/rest/v1/assets?bucket=eq.ielts&storage_path=eq.${encodeURIComponent(storagePath)}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      ...authHeaders,
      "content-type": "application/json",
      "content-profile": "ielts",
      "accept-profile": "ielts",
      prefer: "return=minimal",
    },
    body: JSON.stringify({
      mime_type: contentType,
      metadata: { source_url: sourceUrl, retried: true, bytes, error: null },
    }),
  });
  if (!res.ok) throw new Error(`Patch asset failed ${res.status}: ${await res.text()}`);
}

for (const asset of failedAssets) {
  console.log(`Retrying ${asset.storagePath}`);
  const source = await fetch(asset.url, { headers: { "user-agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(300000) });
  if (!source.ok) throw new Error(`Download failed ${source.status}: ${asset.url}`);
  const contentType = source.headers.get("content-type") || "audio/mpeg";
  const bytes = Buffer.from(await source.arrayBuffer());
  const upload = await fetch(`${supabaseUrl}/storage/v1/object/ielts/${asset.storagePath}`, {
    method: "POST",
    headers: {
      ...authHeaders,
      "content-type": contentType,
      "x-upsert": "true",
    },
    body: bytes,
    signal: AbortSignal.timeout(300000),
  });
  if (!upload.ok) throw new Error(`Upload failed ${upload.status}: ${await upload.text()}`);
  await patchAsset(asset.url, asset.storagePath, contentType, bytes.length);
  console.log(`Uploaded ${asset.storagePath} (${bytes.length} bytes)`);
}
