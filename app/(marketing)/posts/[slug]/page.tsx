
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

import { Badge } from "@/components/ui-v2/badge";
import { Card, CardContent } from "@/components/ui-v2/card";
import { createClient } from "@/lib/supabase/server";

type PostPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function formatDate(date: string | null) {
  if (!date) {
    return "Draft";
  }

  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

async function getPostBySlug(rawSlug: string) {
  const slug = decodeURIComponent(rawSlug).trim();
  const supabase = await createClient();

  const { data: post, error } = await supabase
    .from("posts")
    .select(
      "id, title, slug, excerpt, content, cover_image, published_at, created_at, status, category",
    )
    .eq("status", "published")
    .eq("slug", slug)
    .single();

  if (error) {
    return null;
  }

  return post;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;

export async function generateMetadata(
  { params }: PostPageProps,
): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "Post Not Found",
      description: "The requested post could not be found.",
    };
  }

  const description =
    post.excerpt ||
    post.content.slice(0, 160) ||
    "Read this article on My Blog.";

  const url = `${siteUrl}/posts/${post.slug}`;

  return {
    title: post.title,
    description,

    alternates: {
      canonical: url,
    },

    openGraph: {
      title: post.title,
      description,
      type: "article",
      url,
    },

    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
    },
  };
}

export default async function PostDetailPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-10 text-[var(--text)] sm:px-6 lg:px-8">
      <article className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
          <Link
            href="/posts"
            className="font-medium text-[var(--text-soft)] transition hover:text-[var(--primary)]"
          >
            Articles
          </Link>
          <span className="text-[var(--text-muted)]">/</span>
          <span className="text-[var(--text-soft)]">Post</span>
        </div>

        <header className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-sm)] sm:p-8">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <Badge variant="secondary">
              {post.category || "Article"}
            </Badge>
            <span className="text-sm font-medium text-[var(--text-soft)]">
              {formatDate(post.published_at || post.created_at)}
            </span>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl lg:text-5xl">
            {post.title}
          </h1>

          {post.excerpt ? (
            <p className="mt-5 max-w-3xl text-base leading-7 text-[var(--text-soft)] sm:text-lg">
              {post.excerpt}
            </p>
          ) : null}
        </header>

        {post.cover_image ? (
          <div className="mt-6 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card-soft)] shadow-[var(--shadow-sm)]">
            <img
              src={post.cover_image}
              alt={post.title}
              className="aspect-video w-full object-cover"
            />
          </div>
        ) : null}

        <Card className="mt-6 rounded-[var(--radius-lg)]">
          <CardContent className="p-6 sm:p-8">
            <div className="prose prose-lg max-w-none prose-headings:font-semibold prose-headings:text-[var(--text)] prose-p:leading-8 prose-p:text-[var(--text-soft)] prose-a:text-[var(--primary)] prose-strong:text-[var(--text)] prose-li:text-[var(--text-soft)] prose-blockquote:border-[var(--primary)] prose-blockquote:text-[var(--text-soft)] prose-code:rounded prose-code:bg-[var(--bg-soft)] prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[var(--text)] prose-pre:border prose-pre:border-[var(--border)] prose-pre:bg-[var(--bg-soft)] prose-hr:border-[var(--border)]">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
              >
                {post.content}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card-soft)] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-[var(--text)]">
              Need a study plan?
            </div>
            <p className="mt-1 text-sm text-[var(--text-soft)]">
              Get a course path matched to your target score and deadline.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary)] px-5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--primary-hover)]"
          >
            Contact a Teacher
          </Link>
        </div>
      </article>
    </main>
  );
}
