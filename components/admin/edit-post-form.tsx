"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Post = {
    id: string;
    title: string;
    excerpt: string | null;
    content: string;
    status: "draft" | "published";
};

export default function EditPostForm({ post }: { post: Post }) {
    const supabase = createClient();
    const router = useRouter();

    const [title, setTitle] = useState(post.title);
    const [excerpt, setExcerpt] = useState(post.excerpt || "");
    const [content, setContent] = useState(post.content);
    const [status, setStatus] = useState(post.status);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        const { error } = await supabase
            .from("posts")
            .update({
                title,
                excerpt,
                content,
                status,
                updated_at: new Date().toISOString(),
            })
            .eq("id", post.id);

        if (error) {
            setMessage(error.message);
            setLoading(false);
            return;
        }

        setMessage("Post updated!");
        setLoading(false);
        router.refresh();
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
            <input
                className="w-full rounded border px-3 py-2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
                className="w-full rounded border px-3 py-2"
                rows={3}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
            />
            <textarea
                className="w-full rounded border px-3 py-2"
                rows={14}
                value={content}
                onChange={(e) => setContent(e.target.value)}
            />
            {/* <textarea
        className="w-full rounded border px-3 py-2"
        rows={10}
        value={content}
        onChange={(e) => setContent(e.target.value)}
      /> */}

            <select
                className="rounded border px-3 py-2"
                value={status}
                onChange={(e) =>
                    setStatus(e.target.value as "draft" | "published")
                }
            >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
            </select>

            <button
                type="submit"
                disabled={loading}
                className="rounded border px-4 py-2"
            >
                {loading ? "Saving..." : "Update Post"}
            </button>

            {message && <p>{message}</p>}
        </form>
    );
}