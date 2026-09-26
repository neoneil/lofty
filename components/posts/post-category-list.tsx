"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpenCheck, GraduationCap } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Card, CardContent } from "@/components/ui-v2/card";

type ExamFilter = "PTE" | "雅思" | null;

export type PostCategoryListItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverUrl: string | null;
  category: string | null;
  displayDate: string;
};

export default function PostCategoryList({ posts }: { posts: PostCategoryListItem[] }) {
  const [filter, setFilter] = useState<ExamFilter>(null);
  const visiblePosts = useMemo(
    () => (filter ? posts.filter((post) => post.category === filter) : posts),
    [filter, posts],
  );

  const filters = [
    { value: "雅思" as const, label: "雅思考试", icon: BookOpenCheck },
    { value: "PTE" as const, label: "PTE 考试", icon: GraduationCap },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-3 shadow-[var(--shadow-xs)]">
        <span className="px-2 text-sm font-medium text-[var(--text-soft)]">按考试筛选</span>
        <div className="flex flex-wrap gap-2" role="group" aria-label="文章考试分类">
          {filters.map(({ value, label, icon: Icon }) => {
            const active = filter === value;

            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(active ? null : value)}
                className={`inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] border px-4 text-sm font-semibold transition ${
                  active
                    ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]"
                    : "border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text)] hover:border-[var(--primary)]/45 hover:text-[var(--primary)]"
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            );
          })}
        </div>
        <span className="ml-auto px-2 text-xs font-medium text-[var(--text-faint)]">
          {filter ? `${filter === "雅思" ? "雅思" : "PTE"} · ${visiblePosts.length} 篇` : `全部 · ${visiblePosts.length} 篇`}
        </span>
      </div>

      {visiblePosts.length > 0 ? (
        <div className="grid gap-4">
          {visiblePosts.map((post) => (
            <Card key={post.id} className="overflow-hidden rounded-[var(--radius-lg)] hover:shadow-[var(--shadow-md)]">
              <Link href={`/posts/${post.slug}`} className="group grid gap-0 sm:grid-cols-[180px_1fr]">
                <div className="h-44 bg-[var(--bg-soft)] sm:h-full">
                  {post.coverUrl ? (
                    <img src={post.coverUrl} alt={post.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-[var(--primary-soft)] text-xs font-semibold text-[var(--primary)]">文章</div>
                  )}
                </div>

                <CardContent className="p-5">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{post.category || "文章"}</Badge>
                    <span className="text-xs font-medium text-[var(--text-soft)]">{post.displayDate}</span>
                  </div>
                  <h3 className="text-lg font-semibold leading-snug text-[var(--text)]">{post.title}</h3>
                  {post.excerpt ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--text-soft)]">{post.excerpt}</p> : null}
                  <span className="mt-4 inline-flex text-sm font-semibold text-[var(--primary)]">阅读文章</span>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="rounded-[var(--radius-lg)]">
          <CardContent className="py-10 text-center text-sm text-[var(--text-soft)]">当前分类暂无文章。</CardContent>
        </Card>
      )}
    </div>
  );
}
