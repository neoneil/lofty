import { BookOpen, Captions, Clock3, LibraryBig } from "lucide-react";

import { CourseCard, type CourseCardData } from "@/components/courses/course-card";
import { CourseNavigation, EnrollmentPanel } from "@/components/courses/course-navigation";
import { Badge } from "@/components/ui-v2/badge";
import { Card, CardContent } from "@/components/ui-v2/card";
import { requireUser } from "@/lib/auth/require-user";

export default async function CoursesPage() {
  const { supabase } = await requireUser("/my-courses");

  const { data, error } = await supabase
    .from("courses")
    .select("id,title,slug,description,category,level,tags,speaker,thumbnail_url,poster_url,duration_seconds,language,subtitle_en_url,subtitle_zh_url,is_featured,published_at")
    .eq("is_published", true)
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("published_at", { ascending: false });

  const courses = (data ?? []) as CourseCardData[];
  const categories = Array.from(new Set(courses.map((course) => course.category)));
  const totalSeconds = courses.reduce((total, course) => total + (course.duration_seconds ?? 0), 0);
  const subtitleCount = courses.filter((course) => course.subtitle_en_url || course.subtitle_zh_url).length;
  const totalHours = totalSeconds > 0 ? Math.max(Math.round((totalSeconds / 3600) * 10) / 10, 0.1) : 0;

  return (
    <main className="min-h-screen bg-[var(--bg)] px-3 py-4 text-[var(--text)] sm:px-4 sm:py-6 lg:px-6">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <Card className="overflow-hidden border-[var(--border-strong)]">
          <CardContent className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-3xl">
              <Badge className="mb-4">My Learning</Badge>
              <h1 className="text-2xl font-semibold text-[var(--text)] sm:text-3xl">课程学习中心</h1>
              <p className="mt-3 text-sm leading-7 text-[var(--text-soft)] sm:text-base">集中观看致远英语Lofty自研online课程、PTE、IELTS 与高阶TED演讲，提升学术听力水平。</p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-3 text-center sm:min-w-28"><div className="text-xl font-semibold text-[var(--text)]">{courses.length}</div><div className="mt-1 text-xs text-[var(--text-faint)]">可学课程</div></div>
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-3 text-center sm:min-w-28"><div className="text-xl font-semibold text-[var(--text)]">{totalHours}</div><div className="mt-1 text-xs text-[var(--text-faint)]">视频小时</div></div>
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-3 text-center sm:min-w-28"><div className="text-xl font-semibold text-[var(--text)]">{subtitleCount}</div><div className="mt-1 text-xs text-[var(--text-faint)]">字幕课程</div></div>
            </div>
          </CardContent>
        </Card>

        <EnrollmentPanel />
        <CourseNavigation />

        <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><div className="flex items-center gap-2"><LibraryBig size={20} className="text-[var(--primary)]" /><h2 className="text-xl font-semibold text-[var(--text)]">视频课程库</h2></div><p className="mt-1 text-sm text-[var(--text-soft)]">选择课程进入带字幕的视频学习页面</p></div>
            <div className="flex flex-wrap gap-2"><Badge variant="secondary"><BookOpen size={13} className="mr-1.5" />{courses.length} 门课程</Badge><Badge variant="secondary"><Clock3 size={13} className="mr-1.5" />{totalHours} 小时</Badge><Badge variant="secondary"><Captions size={13} className="mr-1.5" />{subtitleCount} 门含字幕</Badge></div>
          </div>

          {categories.length > 0 ? <div className="mb-4 flex flex-wrap gap-2">{categories.map((category) => <Badge key={category} variant="outline">{category.toUpperCase()}</Badge>)}</div> : null}

          {error ? <div className="rounded-[var(--radius-md)] border border-[var(--danger)] bg-[var(--danger-soft)] p-5 text-sm text-[var(--danger)]">课程加载失败：{error.message}</div> : null}
          {!error && courses.length === 0 ? <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center"><BookOpen size={30} className="mx-auto text-[var(--text-faint)]" /><h3 className="mt-4 font-semibold text-[var(--text)]">暂无已发布视频课程</h3><p className="mt-2 text-sm text-[var(--text-soft)]">课程发布后会自动显示在这里，你仍可通过上方入口查看报课课程。</p></div> : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {courses.map((course) => <CourseCard key={course.id} course={course} />)}
          </div>
        </section>
      </div>
    </main>
  );
}
