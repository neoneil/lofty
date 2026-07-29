"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-v2/card";
import { Input } from "@/components/ui-v2/input";
import { Textarea } from "@/components/ui-v2/textarea";
import { apiPost } from "@/lib/api/client";

type Category = "PTE" | "雅思" | "词汇" | "语法";

const categories: Category[] = ["PTE", "雅思", "词汇", "语法"];

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u4e00-\u9fa5-]+/g, "")
    .replace(/--+/g, "-");
}

export default function CreatePostForm() {
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [cover, setCover] = useState<File | null>(null);
  const [category, setCategory] = useState<Category | "">("");

  const generatedSlug = useMemo(() => slugify(title), [title]);
  const wordCount = useMemo(
    () => content.trim().split(/\s+/).filter(Boolean).length,
    [content],
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!category) {
      setMessage("Please select a category.");
      setLoading(false);
      return;
    }

    const slug = slugify(title);

    if (!slug) {
      setMessage("Title cannot generate a valid slug.");
      setLoading(false);
      return;
    }

    let coverUrl = null;

    if (cover) {
      const uploadData = new FormData();
      uploadData.append("file", cover);
      uploadData.append("folder", "images");

      const uploadResponse = await fetch("/api/admin/storage/public-upload", {
        method: "POST",
        body: uploadData,
      });
      const uploadJson = await uploadResponse.json() as { ok?: boolean; publicUrl?: string; message?: string };

      if (!uploadResponse.ok || !uploadJson.publicUrl) {
        setMessage(uploadJson.message || "Cover image upload failed.");
        setLoading(false);
        return;
      }

      coverUrl = uploadJson.publicUrl;
    }

    try {
      await apiPost("/api/admin/posts", {
      title,
      excerpt: excerpt || null,
      content,
      status,
        coverImage: coverUrl,
      category,
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Post creation failed.");
      setLoading(false);
      return;
    }

    setMessage("Post created successfully.");
    setTitle("");
    setExcerpt("");
    setContent("");
    setStatus("draft");
    setCategory("");
    setCover(null);
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <Card className="rounded-[var(--radius-lg)]">
          <CardHeader className="flex-col items-start gap-1">
            <CardTitle>Main Content</CardTitle>
            <CardDescription>
              Write the title, summary, and markdown body.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[var(--text)]">
                Title
              </span>
              <Input
                placeholder="Post title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>

            <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]">
                Generated Slug
              </div>
              <div className="mt-1 break-all text-sm font-medium text-[var(--text)]">
                {generatedSlug || "Slug will appear after entering a title."}
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[var(--text)]">
                Excerpt
              </span>
              <Textarea
                className="min-h-[110px]"
                placeholder="Short summary shown in article cards and previews."
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-[var(--text)]">
                <span>Markdown Content</span>
                <span className="text-xs font-medium text-[var(--text-soft)]">
                  {wordCount} words
                </span>
              </span>
              <Textarea
                className="min-h-[440px] font-mono text-[13px]"
                placeholder={`# Title

## Subtitle

Write your markdown here...

- item 1
- item 2

**bold**`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </label>
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-6">
        <Card className="rounded-[var(--radius-lg)]">
          <CardHeader className="flex-col items-start gap-1">
            <CardTitle>Publishing</CardTitle>
            <CardDescription>Configure category and status.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div>
              <div className="mb-2 text-sm font-semibold text-[var(--text)]">
                Status
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(["draft", "published"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setStatus(option)}
                    className={`rounded-[var(--radius-md)] border px-3 py-2 text-sm font-semibold capitalize transition ${
                      status === option
                        ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                        : "border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text-soft)] hover:text-[var(--text)]"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold text-[var(--text)]">
                Category
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setCategory(option)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      category === option
                        ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                        : "border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text-soft)] hover:text-[var(--text)]"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold text-[var(--text)]">
                Cover Image
              </div>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] bg-[var(--bg-soft)] px-4 py-8 text-center transition hover:border-[var(--primary)]/50">
                <span className="text-sm font-semibold text-[var(--text)]">
                  {cover ? cover.name : "Upload cover image"}
                </span>
                <span className="mt-1 text-xs text-[var(--text-soft)]">
                  PNG, JPG, or WebP
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCover(e.target.files?.[0] ?? null)}
                  className="sr-only"
                />
              </label>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[var(--radius-lg)]">
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant={status === "published" ? "success" : "secondary"}>
                {status}
              </Badge>
              <Badge variant={category ? "default" : "warning"}>
                {category || "No category"}
              </Badge>
            </div>

            <Button type="submit" disabled={loading} fullWidth>
              {loading ? "Saving..." : "Create Post"}
            </Button>

            {message ? (
              <div
                className={`rounded-[var(--radius-md)] border px-3 py-2 text-sm font-medium ${
                  message.includes("successfully")
                    ? "border-[var(--success)]/25 bg-[var(--success-soft)] text-[var(--success)]"
                    : "border-[var(--danger)]/25 bg-[var(--danger-soft)] text-[var(--danger)]"
                }`}
              >
                {message}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </aside>
    </form>
  );
}
