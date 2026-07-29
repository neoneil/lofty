"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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
import { apiPatch } from "@/lib/api/client";

type Post = {
  id: string;
  title: string;
  slug: string | null;
  excerpt: string | null;
  content: string;
  status: "draft" | "published";
  category?: string | null;
  updated_at?: string | null;
};

export default function EditPostForm({ post }: { post: Post }) {
  const router = useRouter();

  const [title, setTitle] = useState(post.title);
  const [excerpt, setExcerpt] = useState(post.excerpt || "");
  const [content, setContent] = useState(post.content);
  const [status, setStatus] = useState(post.status);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const wordCount = useMemo(
    () => content.trim().split(/\s+/).filter(Boolean).length,
    [content],
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await apiPatch(`/api/admin/posts/${post.id}`, {
        title,
        excerpt: excerpt || null,
        content,
        status,
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Post update failed.");
      setLoading(false);
      return;
    }

    setMessage("Post updated successfully.");
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <Card className="rounded-[var(--radius-lg)]">
          <CardHeader className="flex-col items-start gap-1">
            <CardTitle>Main Content</CardTitle>
            <CardDescription>
              Edit the headline, summary, and markdown article body.
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
                Public Slug
              </div>
              <div className="mt-1 break-all text-sm font-medium text-[var(--text)]">
                {post.slug || "No slug saved for this post."}
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
                className="min-h-[500px] font-mono text-[13px]"
                placeholder="Write your markdown here..."
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
            <CardDescription>Control the live status for this post.</CardDescription>
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

            <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]">
                Category
              </div>
              <div className="mt-1 text-sm font-medium text-[var(--text)]">
                {post.category || "No category"}
              </div>
            </div>

            {post.updated_at ? (
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]">
                  Last Updated
                </div>
                <div className="mt-1 text-sm font-medium text-[var(--text)]">
                  {new Date(post.updated_at).toLocaleString()}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-[var(--radius-lg)]">
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant={status === "published" ? "success" : "secondary"}>
                {status}
              </Badge>
              <Badge variant={post.category ? "default" : "warning"}>
                {post.category || "No category"}
              </Badge>
            </div>

            <Button type="submit" disabled={loading} fullWidth>
              {loading ? "Saving..." : "Update Post"}
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
