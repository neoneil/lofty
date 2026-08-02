import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createCourseSlug } from "@/lib/courses/slug";

type CreateCourseBody = {
  title?: string;
  slug?: string;
  description?: string;
  category?: string;
  level?: string;
  tags?: string[];
  speaker?: string;
  sourceName?: string;
  sourceUrl?: string;
  license?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  posterUrl?: string;
  subtitleEnUrl?: string;
  durationSeconds?: number | null;
  language?: string;
  isFeatured?: boolean;
  isPublished?: boolean;
  sortOrder?: number;
};

export async function POST(request: Request) {
  const { supabase, user } = await requireAdmin("/admin/course-upload");

  try {
    const body = (await request.json()) as CreateCourseBody;
    const title = body.title?.trim();
    const videoUrl = body.videoUrl?.trim();
    const slug = createCourseSlug(body.slug?.trim() || title || "");

    if (!title || !videoUrl) {
      return NextResponse.json({ ok: false, message: "课程标题和视频地址必填" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("courses")
      .insert({
        title,
        slug,
        description: body.description?.trim() || null,
        category: body.category?.trim() || "ted",
        level: body.level?.trim() || null,
        tags: body.tags ?? [],
        speaker: body.speaker?.trim() || null,
        source_name: body.sourceName?.trim() || null,
        source_url: body.sourceUrl?.trim() || null,
        license: body.license?.trim() || null,
        video_url: videoUrl,
        poster_url: body.posterUrl?.trim() || body.thumbnailUrl?.trim() || null,
        thumbnail_url: body.thumbnailUrl?.trim() || null,
        subtitle_en_url: body.subtitleEnUrl?.trim() || null,
        duration_seconds: body.durationSeconds ?? null,
        language: body.language?.trim() || "en",
        sort_order: body.sortOrder ?? 0,
        is_featured: body.isFeatured ?? false,
        is_published: body.isPublished ?? false,
        published_at: body.isPublished ? new Date().toISOString() : null,
        created_by: user.id,
      })
      .select("id, slug")
      .single();

    if (error) {
      console.error("course create error:", error);
      return NextResponse.json({ ok: false, message: "创建课程失败" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, course: data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, message: "创建课程失败" }, { status: 500 });
  }
}
