"use client";

import { useMemo, useState } from "react";
import { UploadCloud, Video } from "lucide-react";
import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Card, CardContent } from "@/components/ui-v2/card";
import { Input } from "@/components/ui-v2/input";
import { Textarea } from "@/components/ui-v2/textarea";
import { createCourseSlug } from "@/lib/courses/slug";

type UploadKind = "video" | "thumbnail" | "subtitle-en";
type Folder = "ted" | "loftypte";

type UploadedAsset = {
  publicUrl: string;
  key: string;
};

type FormState = {
  title: string;
  slug: string;
  description: string;
  category: string;
  folder: Folder;
  level: string;
  tags: string;
  speaker: string;
  sourceName: string;
  sourceUrl: string;
  license: string;
  language: string;
  sortOrder: string;
  isFeatured: boolean;
  isPublished: boolean;
};

const initialForm: FormState = {
  title: "",
  slug: "",
  description: "",
  category: "ted",
  folder: "ted",
  level: "",
  tags: "",
  speaker: "",
  sourceName: "TED",
  sourceUrl: "",
  license: "",
  language: "en",
  sortOrder: "0",
  isFeatured: false,
  isPublished: false,
};

function getProgressLabel(progress: number) {
  if (progress <= 0) return "等待上传";
  if (progress >= 100) return "已上传";
  return `${progress}%`;
}

async function uploadFile({ file, kind, folder, slug, onProgress }: { file: File; kind: UploadKind; folder: Folder; slug: string; onProgress: (progress: number) => void }) {
  const presignRes = await fetch("/api/admin/courses/r2-presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder, slug, kind, fileName: file.name }),
  });
  const presignJson = await presignRes.json();

  if (!presignRes.ok || !presignJson.ok) {
    throw new Error(presignJson.message || "创建 R2 上传地址失败");
  }

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
        return;
      }

      reject(new Error(`R2 上传失败：${xhr.status}`));
    };

    xhr.onerror = () => reject(new Error("R2 上传失败，请检查 bucket CORS 和网络"));
    xhr.open("PUT", presignJson.uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.send(file);
  });

  return {
    publicUrl: presignJson.publicUrl as string,
    key: presignJson.key as string,
  };
}

export default function CourseUploadClient() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [subtitleFile, setSubtitleFile] = useState<File | null>(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [thumbnailProgress, setThumbnailProgress] = useState(0);
  const [subtitleProgress, setSubtitleProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);

  const resolvedSlug = useMemo(() => (form.slug || form.title ? createCourseSlug(form.slug || form.title) : "course-slug"), [form.slug, form.title]);

  const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleFolderChange = (folder: Folder) => {
    setForm((prev) => ({
      ...prev,
      folder,
      category: folder === "ted" ? "ted" : "loftypte",
      sourceName: folder === "ted" ? "TED" : "LoftyPTE",
    }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setMessage("请先填写课程标题");
      return;
    }

    if (!videoFile) {
      setMessage("请至少上传一个 video 文件");
      return;
    }

    setSaving(true);
    setMessage(null);
    setCreatedSlug(null);

    try {
      const uploadedVideo = await uploadFile({ file: videoFile, kind: "video", folder: form.folder, slug: resolvedSlug, onProgress: setVideoProgress });
      let uploadedThumbnail: UploadedAsset | null = null;
      let uploadedSubtitle: UploadedAsset | null = null;

      if (thumbnailFile) {
        uploadedThumbnail = await uploadFile({ file: thumbnailFile, kind: "thumbnail", folder: form.folder, slug: resolvedSlug, onProgress: setThumbnailProgress });
      }

      if (subtitleFile) {
        uploadedSubtitle = await uploadFile({ file: subtitleFile, kind: "subtitle-en", folder: form.folder, slug: resolvedSlug, onProgress: setSubtitleProgress });
      }

      const createRes = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          slug: resolvedSlug,
          description: form.description,
          category: form.category,
          level: form.level,
          tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
          speaker: form.speaker,
          sourceName: form.sourceName,
          sourceUrl: form.sourceUrl,
          license: form.license,
          videoUrl: uploadedVideo.publicUrl,
          thumbnailUrl: uploadedThumbnail?.publicUrl,
          posterUrl: uploadedThumbnail?.publicUrl,
          subtitleEnUrl: uploadedSubtitle?.publicUrl,
          language: form.language,
          sortOrder: Number(form.sortOrder) || 0,
          isFeatured: form.isFeatured,
          isPublished: form.isPublished,
        }),
      });
      const createJson = await createRes.json();

      if (!createRes.ok || !createJson.ok) {
        throw new Error(createJson.message || "课程记录创建失败");
      }

      setCreatedSlug(createJson.course.slug);
      setMessage("课程已上传并保存。");
    } catch (error) {
      console.error(error);
      setMessage(error instanceof Error ? error.message : "上传失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl space-y-5">
        <Card className="rounded-[var(--radius-lg)]">
          <CardContent className="p-5 sm:p-7">
            <Badge className="mb-3 w-fit">Course Upload</Badge>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">课程上传</h1>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">上传视频到 Cloudflare R2，并同步写入 Supabase courses 表。第一版支持 TED 和 LoftyPTE 文件夹。</p>
              </div>
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 text-sm text-[var(--text-soft)]">R2 path: <span className="font-semibold text-[var(--text)]">{form.folder}/{resolvedSlug || "course-slug"}</span></div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <Card>
            <CardContent className="space-y-5 p-5 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-[var(--text)]">标题</label>
                  <Input value={form.title} onChange={(event) => updateForm("title", event.target.value)} placeholder="Course title" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--text)]">Slug</label>
                  <Input value={form.slug} onChange={(event) => updateForm("slug", event.target.value)} placeholder={resolvedSlug} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--text)]">分类</label>
                  <Input value={form.category} onChange={(event) => updateForm("category", event.target.value)} placeholder="ted" />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-[var(--text)]">描述</label>
                  <Textarea value={form.description} onChange={(event) => updateForm("description", event.target.value)} placeholder="Short course description..." className="min-h-[110px]" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--text)]">讲者 / 老师</label>
                  <Input value={form.speaker} onChange={(event) => updateForm("speaker", event.target.value)} placeholder="Speaker" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--text)]">Level</label>
                  <Input value={form.level} onChange={(event) => updateForm("level", event.target.value)} placeholder="Beginner / Intermediate..." />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--text)]">Tags</label>
                  <Input value={form.tags} onChange={(event) => updateForm("tags", event.target.value)} placeholder="ted, democracy, speaking" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--text)]">Language</label>
                  <Input value={form.language} onChange={(event) => updateForm("language", event.target.value)} placeholder="en" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--text)]">Source Name</label>
                  <Input value={form.sourceName} onChange={(event) => updateForm("sourceName", event.target.value)} placeholder="TED / LoftyPTE" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--text)]">Source URL</label>
                  <Input value={form.sourceUrl} onChange={(event) => updateForm("sourceUrl", event.target.value)} placeholder="https://..." />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--text)]">License</label>
                  <Input value={form.license} onChange={(event) => updateForm("license", event.target.value)} placeholder="授权说明" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--text)]">Sort Order</label>
                  <Input value={form.sortOrder} onChange={(event) => updateForm("sortOrder", event.target.value)} type="number" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-5">
            <Card>
              <CardContent className="space-y-4 p-5">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text)]">R2 文件夹</h2>
                  <p className="mt-1 text-sm text-[var(--text-soft)]">TED 使用 ted，自己的课程使用 loftypte。</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant={form.folder === "ted" ? "primary" : "secondary"} onClick={() => handleFolderChange("ted")}>TED</Button>
                  <Button type="button" variant={form.folder === "loftypte" ? "primary" : "secondary"} onClick={() => handleFolderChange("loftypte")}>LoftyPTE</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center gap-2">
                  <UploadCloud size={18} className="text-[var(--primary)]" />
                  <h2 className="text-lg font-semibold text-[var(--text)]">Files</h2>
                </div>
                <FilePicker label="Video" required file={videoFile} progress={videoProgress} onChange={setVideoFile} accept="video/*" />
                <FilePicker label="Thumbnail / Poster" file={thumbnailFile} progress={thumbnailProgress} onChange={setThumbnailFile} accept="image/*" />
                <FilePicker label="English Subtitle (.vtt)" file={subtitleFile} progress={subtitleProgress} onChange={setSubtitleFile} accept=".vtt,text/vtt" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 p-5">
                <label className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-3 text-sm font-medium text-[var(--text)]">
                  <input type="checkbox" checked={form.isPublished} onChange={(event) => updateForm("isPublished", event.target.checked)} />
                  发布给学生观看
                </label>
                <label className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-3 text-sm font-medium text-[var(--text)]">
                  <input type="checkbox" checked={form.isFeatured} onChange={(event) => updateForm("isFeatured", event.target.checked)} />
                  Featured
                </label>
                <Button type="button" onClick={handleSubmit} disabled={saving} fullWidth className="gap-2">
                  <Video size={16} />
                  {saving ? "上传中..." : "上传并创建课程"}
                </Button>
                {message ? <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-3 text-sm text-[var(--text-soft)]">{message}</div> : null}
                {createdSlug ? <a href={`/my-courses/${createdSlug}`} className="block rounded-[var(--radius-md)] border border-[var(--primary)]/25 bg-[var(--primary-soft)] p-3 text-sm font-semibold text-[var(--primary)]">查看课程：/my-courses/{createdSlug}</a> : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}

function FilePicker({ label, required, file, progress, accept, onChange }: { label: string; required?: boolean; file: File | null; progress: number; accept: string; onChange: (file: File | null) => void }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-[var(--text)]">{label}{required ? " *" : ""}</span>
        <Badge variant={progress >= 100 ? "success" : "secondary"}>{getProgressLabel(progress)}</Badge>
      </div>
      <input type="file" accept={accept} onChange={(event) => onChange(event.target.files?.[0] ?? null)} className="block w-full text-sm text-[var(--text-soft)] file:mr-3 file:rounded-[var(--radius-sm)] file:border-0 file:bg-[var(--primary)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white" />
      {file ? <div className="mt-2 truncate text-xs text-[var(--text-soft)]">{file.name}</div> : null}
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--card)]">
        <div className="h-full rounded-full bg-[var(--primary)] transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
