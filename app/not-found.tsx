import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-4 text-3xl font-bold">404 - Page Not Found</h1>
      <p className="mb-6">你访问的文章不存在，或者还没有发布。</p>
      <Link href="/posts" className="rounded border px-4 py-2">
        Back to Posts
      </Link>
    </main>
  );
}