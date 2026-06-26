import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import LearningVideoShell from "@/components/learning-video/LearningVideoShell";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function CourseWatchPage({ params }: PageProps) {
  const { slug } = await params;
  const { supabase } = await requireUser(`/my-courses/${slug}`);

  const { data: course, error } = await supabase
    .from("courses")
    .select("title,video_url,subtitle_en_url")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error || !course) {
    notFound();
  }

  return <LearningVideoShell videoUrl={course.video_url} subtitleUrl={course.subtitle_en_url ?? ""} title={course.title} />;
}
