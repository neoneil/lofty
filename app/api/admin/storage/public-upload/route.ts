import { NextResponse } from "next/server";

import { requireApiAdmin } from "@/lib/auth/require-api-auth";
import { createR2PresignedPutUrl } from "@/lib/r2/presign";
import { sanitizeR2KeyPart } from "@/lib/r2/presign";

function sanitizeFileName(name: string) {
  const parts = name.split(".");
  const extension = parts.length > 1 ? parts.pop()?.toLowerCase() : "";
  const base = sanitizeR2KeyPart(parts.join(".") || "file") || "file";
  return extension ? `${base}.${extension}` : base;
}

export async function POST(req: Request) {
  const auth = await requireApiAdmin();
  if (!auth.ok) return auth.response;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const folder = String(formData.get("folder") ?? "images").replace(/^\/+|\/+$/g, "");

  if (!file) {
    return NextResponse.json({ ok: false, message: "Missing file" }, { status: 400 });
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
