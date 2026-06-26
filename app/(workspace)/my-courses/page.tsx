import Link from "next/link";
import { PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui-v2/badge";
import { Card, CardContent } from "@/components/ui-v2/card";
import { requireUser } from "@/lib/auth/require-user";

type Course = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string;
  level: string | null;
  tags: string[];
  speaker: string | null;
  thumbnail_url: string | null;
  poster_url: string | null;
  duration_seconds: number | null;
  published_at: string | null;
};

function formatDuration(seconds: number | null) {
  if (!seconds) return null;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export default async function CoursesPage() {
  const { supabase } = await requireUser("/my-courses");

  const { data, error } = await supabase
    .from("courses")
    .select("id,title,slug,description,category,level,tags,speaker,thumbnail_url,poster_url,duration_seconds,published_at")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("published_at", { ascending: false });

  const courses = (data ?? []) as Course[];

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-6 text-[var(--text)] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-5">
        <Card className="rounded-[var(--radius-lg)]">
          <CardContent className="p-5 sm:p-7">
            <Badge className="mb-3 w-fit">Courses</Badge>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">My Practice Courses</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">观看 TED、PTE、IELTS 和 Lofty 自研课程视频。字幕、AI 解释和学习进度后续都可以在这里扩展。</p>
          </CardContent>
        </Card>

        {error ? <div className="rounded-[var(--radius-md)] border border-[var(--danger)]/25 bg-[var(--danger-soft)] p-5 text-sm text-[var(--danger)]">课程加载失败：{error.message}</div> : null}

        {!error && courses.length === 0 ? <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-8 text-center text-sm text-[var(--text-soft)] shadow-[var(--shadow-sm)]">暂无已发布课程。</div> : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <Link key={course.id} href={`/my-courses/${course.slug}`} className="group overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--primary)]/35 hover:shadow-[var(--shadow-md)]">
              <div className="relative aspect-video overflow-hidden bg-[var(--bg-soft)]">
                {course.thumbnail_url || course.poster_url ? <img src={course.thumbnail_url ?? course.poster_url ?? ""} alt={course.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full w-full items-center justify-center text-[var(--text-soft)]"><PlayCircle size={42} /></div>}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
                  <Badge>{course.category}</Badge>
                  {course.level ? <Badge variant="secondary">{course.level}</Badge> : null}
                  {formatDuration(course.duration_seconds) ? <Badge variant="secondary">{formatDuration(course.duration_seconds)}</Badge> : null}
                </div>
              </div>
              <div className="p-5">
                <h2 className="line-clamp-2 text-lg font-semibold leading-7 text-[var(--text)]">{course.title}</h2>
                {course.speaker ? <p className="mt-2 text-sm font-medium text-[var(--primary)]">{course.speaker}</p> : null}
                {course.description ? <p className="mt-3 line-clamp-3 text-sm leading-7 text-[var(--text-soft)]">{course.description}</p> : null}
                {course.tags?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {course.tags.slice(0, 4).map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                  </div>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
