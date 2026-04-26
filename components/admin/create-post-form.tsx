"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Category = "PTE" | "雅思" | "词汇" | "语法";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u4e00-\u9fa5-]+/g, "")
    .replace(/--+/g, "-");
}

export default function CreatePostForm() {
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [cover, setCover] = useState<File | null>(null);
  const [category, setCategory] = useState<Category | "">("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage("请先登录");
      setLoading(false);
      return;
    }

    if (!category) {
      setMessage("请选择分类");
      setLoading(false);
      return;
    }

    const slug = slugify(title);

    if (!slug) {
      setMessage("Title cannot generate slug");
      setLoading(false);
      return;
    }

    let coverUrl = null;

    if (cover) {
      const cleanName = cover.name.replace(/\s+/g, "-");
      const filename = `${Date.now()}-${cleanName}`;

      const { error } = await supabase.storage
        .from("images")
        .upload(filename, cover, {
          contentType: cover.type,
        });

      if (!error) {
        const { data } = supabase.storage
          .from("images")
          .getPublicUrl(filename);

        coverUrl = data.publicUrl;
      }
    }

    const { error } = await supabase.from("posts").insert({
      title,
      slug,
      excerpt: excerpt || null,
      content,
      status,
      author_id: user.id,
      cover_image: coverUrl,
      published_at: status === "published" ? new Date().toISOString() : null,
      category: category, // ✅ 已保证合法
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("文章创建成功");
    setTitle("");
    setExcerpt("");
    setContent("");
    setStatus("draft");
    setCategory("");
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <input
        className="w-full rounded border px-3 py-2"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        className="w-full rounded border px-3 py-2"
        placeholder="Excerpt"
        value={excerpt}
        onChange={(e) => setExcerpt(e.target.value)}
        rows={3}
      />

      <textarea
        className="w-full rounded border px-3 py-2"
        placeholder={`# Title

## Subtitle

Write your markdown here...

- item 1
- item 2

**bold**
`}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={12}
      />

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setCover(e.target.files?.[0] ?? null)}
      />

      {/* ✅ 分类 */}
      <select
        name="category"
        value={category}
        onChange={(e) => setCategory(e.target.value as Category)}
        className="border rounded px-3 py-2"
      >
        <option value="">请选择分类</option>
        <option value="PTE">PTE</option>
        <option value="雅思">雅思</option>
        <option value="词汇">词汇</option>
        <option value="语法">语法</option>
      </select>

      {/* 状态 */}
      <select
        className="rounded border px-3 py-2"
        value={status}
        onChange={(e) => setStatus(e.target.value as "draft" | "published")}
      >
        <option value="draft">Draft</option>
        <option value="published">Published</option>
      </select>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="rounded border px-4 py-2"
        >
          {loading ? "Saving..." : "Create Post"}
        </button>
      </div>

      {message && <p>{message}</p>}
    </form>
  );
}