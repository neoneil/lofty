import matter from "gray-matter";

export type CourseMarkdownMode = "article" | "slides";

export type CourseMetadata = {
  id: string | null;
  title: string;
  subtitle: string | null;
  course: string | null;
  module: string | null;
  questionType: string | null;
  lesson: string | null;
  mode: CourseMarkdownMode;
  difficulty: string | null;
  duration: number | null;
  estimatedReadTime: number | null;
  author: string | null;
  tags: string[];
  cover: string | null;
  video: string | null;
  quiz: string | null;
  published: boolean | null;
  updated: string | null;
};

export type ParsedCourseMarkdown = {
  content: string;
  metadata: CourseMetadata;
};

function toText(value: unknown) {
  if (typeof value === "string") {
    return value.trim() || null;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return null;
}

function toDateText(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  return toText(value);
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function toBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }

  return null;
}

function toTags(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(toText).filter((tag): tag is string => Boolean(tag));
  }

  const tag = toText(value);
  return tag ? [tag] : [];
}

function toMode(value: unknown): CourseMarkdownMode {
  return toText(value)?.toLowerCase() === "slides" ? "slides" : "article";
}

export function parseCourseMarkdown(rawContent: string, fallbackTitle: string): ParsedCourseMarkdown {
  const { content, data } = matter(rawContent);
  const contentHeading = content.match(/^#\s+(.+)$/m)?.[1]?.trim();

  return {
    content,
    metadata: {
      id: toText(data.id),
      title: toText(data.title) || contentHeading || fallbackTitle,
      subtitle: toText(data.subtitle),
      course: toText(data.course),
      module: toText(data.module),
      questionType: toText(data.question_type),
      lesson: toText(data.lesson),
      mode: toMode(data.mode),
      difficulty: toText(data.difficulty),
      duration: toNumber(data.duration),
      estimatedReadTime: toNumber(data.estimated_read_time),
      author: toText(data.author),
      tags: toTags(data.tags),
      cover: toText(data.cover),
      video: toText(data.video),
      quiz: toText(data.quiz),
      published: toBoolean(data.published),
      updated: toDateText(data.updated),
    },
  };
}
