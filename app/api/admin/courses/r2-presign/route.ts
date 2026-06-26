import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createR2PresignedPutUrl, sanitizeR2KeyPart } from "@/lib/r2/presign";

const allowedFolders = new Set(["ted", "loftypte"]);
const allowedKinds = new Set(["video", "thumbnail", "poster", "subtitle-en"]);

function getExtension(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
  return extension || "bin";
}

export async function POST(request: Request) {
  await requireAdmin("/admin/course-upload");

  try {
    const body = (await request.json()) as {
      folder?: string;
      slug?: string;
      kind?: string;
      fileName?: string;
    };
    const folder = allowedFolders.has(body.folder ?? "") ? body.folder! : "ted";
    const slug = sanitizeR2KeyPart(body.slug ?? "");
    const kind = body.kind ?? "";
    const fileName = body.fileName ?? "";

    if (!slug || !allowedKinds.has(kind) || !fileName) {
      return NextResponse.json({ ok: false, message: "上传参数不完整" }, { status: 400 });
    }

    const extension = getExtension(fileName);
    const key = `${folder}/${slug}/${kind}.${extension}`;
    const presigned = createR2PresignedPutUrl({ key });

    return NextResponse.json({ ok: true, ...presigned });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "创建上传地址失败" }, { status: 500 });
  }
}
