import Link from "next/link";
import { redirect } from "next/navigation";

import CreatePostForm from "@/components/admin/create-post-form";
import { createClient } from "@/lib/supabase/server";

export default async function NewPostPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "admin" && profile.role !== "editor")) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-10 text-[var(--text)] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-sm)] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--text-soft)]">
                Content Studio
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
                Create New Post
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-soft)]">
                Draft, categorize, and publish learning content for the Lofty
                site.
              </p>
            </div>

            <Link
              href="/admin/posts"
              className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 text-sm font-semibold text-[var(--text-soft)] transition hover:text-[var(--text)]"
            >
              Back to Posts
            </Link>
          </div>
        </div>

        <CreatePostForm />
      </section>
    </main>
  );
}
