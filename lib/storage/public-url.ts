const PUBLIC_R2_BASE_URL = (process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL || "https://pub-b96989cc617f460facb9c254b7d2c5db.r2.dev").replace(/\/+$/, "");

const PUBLIC_STORAGE_BUCKETS = new Set(["avatars", "images", "ielts", "pte-audio", "pte-images"]);

function encodePath(path: string) {
  return path.split("/").map((part) => encodeURIComponent(part)).join("/");
}

export function parseSupabasePublicStorageUrl(value: string) {
  try {
    const url = new URL(value);
    const marker = "/storage/v1/object/public/";
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex < 0) return null;
    const rest = url.pathname.slice(markerIndex + marker.length);
    const [bucket, ...pathParts] = rest.split("/").filter(Boolean);
    if (!bucket || pathParts.length === 0) return null;
    return {
      bucket,
      path: decodeURIComponent(pathParts.join("/")),
    };
  } catch {
    return null;
  }
}

export function getPublicR2Url(bucket: string, path: string) {
  return `${PUBLIC_R2_BASE_URL}/${encodePath(`${bucket}/${path.replace(/^\/+/, "")}`)}`;
}

export function normalizePublicStorageUrl(value: string | null | undefined, fallbackBucket?: string) {
  if (!value) return "";

  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("blob:") || trimmed.startsWith("data:")) return trimmed;

  const supabaseObject = parseSupabasePublicStorageUrl(trimmed);
  if (supabaseObject && PUBLIC_STORAGE_BUCKETS.has(supabaseObject.bucket)) {
    return getPublicR2Url(supabaseObject.bucket, supabaseObject.path);
  }

  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  if (fallbackBucket && PUBLIC_STORAGE_BUCKETS.has(fallbackBucket)) {
    return getPublicR2Url(fallbackBucket, trimmed);
  }

  return trimmed;
}

export function isStudentAudioStorageValue(value: string | null | undefined) {
  if (!value) return false;
  return value.includes("students-audio/");
}

export function getStudentAudioPrivateKey(value: string) {
  const supabaseObject = parseSupabasePublicStorageUrl(value);
  if (supabaseObject?.bucket === "pte-audio" && supabaseObject.path.startsWith("students-audio/")) {
    return `pte-audio/${supabaseObject.path}`;
  }

  const trimmed = value.trim().replace(/^\/+/, "");
  if (trimmed.startsWith("pte-audio/students-audio/")) return trimmed;
  if (trimmed.startsWith("students-audio/")) return `pte-audio/${trimmed}`;

  return null;
}

export function isPrivateStudentAudioKey(value: string | null | undefined) {
  return Boolean(value && getStudentAudioPrivateKey(value));
}
