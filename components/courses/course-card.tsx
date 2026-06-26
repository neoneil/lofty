import Link from "next/link";
import { ArrowRight, Captions, Clock3, Play, UserRound } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";

export type CourseCardData = {
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
  language: string;
  subtitle_en_url: string | null;
  subtitle_zh_url: string | null;
  is_featured: boolean;
};

const categoryLabels: Record<string, string> = {
  ted: "TED 精选",
  loftypte: "Lofty PTE",
  pte: "PTE",
  ielts: "IELTS",
};

function formatDuration(seconds: number | null) {
  if (!seconds) return null;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${Math.max(minutes, 1)} min`;
}

export function CourseCard({ course }: { course: CourseCardData }) {
  const imageUrl = course.thumbnail_url ?? course.poster_url;
  const duration = formatDuration(course.duration_seconds);
  const hasSubtitles = Boolean(course.subtitle_en_url || course.subtitle_zh_url);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)] transition-all duration-300 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)]">
      <Link href={`/my-courses/${course.slug}`} className="relative block aspect-video overflow-hidden bg-[var(--bg-soft)]">
        {imageUrl ? <img src={imageUrl} alt={course.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" /> : <div className="flex h-full w-full items-center justify-center text-[var(--primary)]"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary-soft)]"><Play size={24} fill="currentColor" /></div></div>}
        <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <Badge>{categoryLabels[course.category.toLowerCase()] ?? course.category}</Badge>
          {course.is_featured ? <Badge variant="warning">Featured</Badge> : null}
        </div>
        {duration ? <span className="absolute bottom-3 right-3 rounded-[4px] bg-black/75 px-2 py-1 text-xs font-semibold text-white">{duration}</span> : null}
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-faint)]">
          {course.speaker ? <span className="inline-flex items-center gap-1.5"><UserRound size={13} />{course.speaker}</span> : null}
          {duration ? <span className="inline-flex items-center gap-1.5"><Clock3 size={13} />{duration}</span> : null}
          {hasSubtitles ? <span className="inline-flex items-center gap-1.5"><Captions size={13} />字幕</span> : null}
        </div>

        <h2 className="mt-3 line-clamp-2 text-lg font-semibold leading-7 text-[var(--text)]">{course.title}</h2>
        {course.description ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--text-soft)]">{course.description}</p> : <p className="mt-2 text-sm leading-6 text-[var(--text-faint)]">进入课程开始视频学习。</p>}

        <div className="mt-4 flex flex-wrap gap-1.5">
          {course.level ? <Badge variant="secondary">{course.level}</Badge> : null}
          {course.tags.slice(0, 3).map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}
        </div>

        <div className="mt-auto pt-5">
          <Link href={`/my-courses/${course.slug}`} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--primary)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-hover)]">开始学习<ArrowRight size={15} /></Link>
        </div>
      </div>
    </article>
  );
}
