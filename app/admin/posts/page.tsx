import Link from "next/link";

import DeletePostButton from "@/components/admin/delete-post-button";
import { requireAdminOrEditor } from "@/lib/auth/require-admin";

export default async function AdminPostsPage() {
  const { supabase } = await requireAdminOrEditor("/admin/posts");

  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, title, slug, status, published_at, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-10 text-[var(--text)] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-sm)] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--text-soft)]">
                Lofty Education Admin
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
                Manage Posts
              </h1>
              <p className="mt-2 text-sm text-[var(--text-soft)]">
                Create, review, and edit article content.
              </p>
            </div>

            <Link
              href="/admin/posts/new"
              className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary)] px-4 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--primary-hover)]"
            >
              New Post
            </Link>
          </div>
        </div>

        {error ? (
          <div className="rounded-[var(--radius-md)] border border-[var(--danger)]/25 bg-[var(--danger-soft)] p-4 text-sm font-medium text-[var(--danger)]">
            Failed to load posts: {error.message}
          </div>
        ) : !posts || posts.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-8 text-sm text-[var(--text-soft)] shadow-[var(--shadow-sm)]">
            No posts yet.
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <article
                key={post.id}
                className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] transition hover:border-[var(--primary)]/35 hover:bg-[var(--card-hover)]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-1 text-xs font-semibold uppercase text-[var(--primary)]">
                        {post.status}
                      </span>
                      <span className="text-xs text-[var(--text-soft)]">
                        {post.published_at
                          ? `Published ${new Date(post.published_at).toLocaleDateString()}`
                          : `Created ${new Date(post.created_at).toLocaleDateString()}`}
                      </span>
                    </div>

                    <h2 className="truncate text-xl font-bold tracking-tight text-[var(--text)]">
                      {post.title}
                    </h2>
                    <p className="mt-2 break-all text-sm text-[var(--text-soft)]">
                      slug: {post.slug}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <Link
                      href={`/posts/${post.slug}`}
                      className="inline-flex h-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-3 text-sm font-semibold text-[var(--text-soft)] transition hover:text-[var(--text)]"
                    >
                      View
                    </Link>

                    <Link
                      href={`/admin/posts/${post.id}/edit`}
                      className="inline-flex h-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--primary)]/30 bg-[var(--primary-soft)] px-3 text-sm font-semibold text-[var(--primary)] transition hover:border-[var(--primary)]"
                    >
                      Edit
                    </Link>

                    <DeletePostButton
                      postId={post.id}
                      postTitle={post.title}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
