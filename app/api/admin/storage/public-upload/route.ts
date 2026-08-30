import { NextResponse } from "next/server";

import { requireApiAdmin } from "@/lib/auth/require-api-auth";
import { createR2PresignedPutUrl } from "@/lib/r2/presign";
import { sanitizeR2KeyPart } from "@/lib/r2/presign";

const MAX_PUBLIC_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_FOLDERS = new Set(["images", "avatars"]);
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

function sanitizeFileName(name: string) {
  const parts = name.split(".");
  const extension = parts.length > 1 ? parts.pop()?.toLowerCase() : "";
  const base = sanitizeR2KeyPart(parts.join(".") || "file") || "file";
  return extension ? `${base}.${extension}` : base;
}

function normalizeFolder(value: string) {
  const folder = sanitizeR2KeyPart(value.replace(/^\/+|\/+$/g, ""));
  return ALLOWED_FOLDERS.has(folder) ? folder : null;
}

function getFileExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
}

function validatePublicUploadFile(file: File) {
  const contentType = file.type.split(";")[0]?.trim().toLowerCase() ?? "";
  const extension = getFileExtension(file.name);

  if (file.size <= 0) return "文件为空。";
  if (file.size > MAX_PUBLIC_UPLOAD_BYTES) return "文件过大，请控制在 10MB 以内。";
  if (!ALLOWED_IMAGE_TYPES.has(contentType) || !ALLOWED_IMAGE_EXTENSIONS.has(extension)) {
    return "只支持 jpg、png、webp 或 gif 图片。";
  }

  return null;
}

export async function POST(req: Request) {
  const auth = await requireApiAdmin();
  if (!auth.ok) return auth.response;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const folder = normalizeFolder(String(formData.get("folder") ?? "images"));

  if (!file) {
    return NextResponse.json({ ok: false, message: "Missing file" }, { status: 400 });
  }

  if (!folder) {
    return NextResponse.json({ ok: false, message: "上传目录无效。" }, { status: 400 });
  }

  const validationError = validatePublicUploadFile(file);
  if (validationError) {
    return NextResponse.json({ ok: false, message: validationError }, { status: 400 });
  }

  const key = `${folder}/${Date.now()}-${sanitizeFileName(file.name)}`;
  const presigned = createR2PresignedPutUrl({ key });
  const uploadResponse = await fetch(presigned.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    body: Buffer.from(await file.arrayBuffer()),
  });

  if (!uploadResponse.ok) {
    return NextResponse.json({ ok: false, message: `R2 upload failed: ${uploadResponse.status}` }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    key,
    publicUrl: presigned.publicUrl,
  });
}
