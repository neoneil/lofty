import Link from "next/link";
import { redirect } from "next/navigation";

import EditPostForm from "@/components/admin/edit-post-form";
import { requireAdminOrEditor } from "@/lib/auth/require-admin";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPostPage({ params }: PageProps) {
  const { id } = await params;
  const { supabase } = await requireAdminOrEditor(`/admin/posts/${id}/edit`);

  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  if (!post) {
    redirect("/admin/posts");
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-10 text-[var(--text)] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-sm)] sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[var(--primary)]">
                Content Management
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--text)]">
                Edit Post
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-[var(--text-soft)]">
                Update article copy, publishing status, and the live learning
                content shown on the Lofty site.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/posts"
                className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-5 text-sm font-semibold text-[var(--text)] shadow-[var(--shadow-xs)] transition hover:bg-[var(--bg-soft)]"
              >
                Back to Posts
              </Link>
              {post.slug ? (
                <Link
                  href={`/posts/${post.slug}`}
                  className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary)] px-5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--primary-hover)]"
                >
                  View Post
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        <EditPostForm post={post} />
      </section>
    </main>
  );
}
