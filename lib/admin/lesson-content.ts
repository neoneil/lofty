import "server-only";

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { parseCourseMarkdown, type CourseMetadata } from "@/lib/course-markdown/parse-course-markdown";

const ADMIN_CONTENT_ROOT = path.join(process.cwd(), "app", "admin");
const SUPPORTED_EXAMS = ["pte", "ielts"] as const;
const SUPPORTED_EXAM_SET = new Set<string>(SUPPORTED_EXAMS);
const SAFE_SEGMENT_PATTERN = /^[a-z0-9-]+$/;

export type AdminLessonContent = {
  content: string;
  exam: string;
  lessonPath: string[];
  metadata: CourseMetadata;
};

export type AdminLessonSummary = CourseMetadata & {
  exam: string;
  href: string;
  lessonPath: string[];
};

async function getMarkdownPaths(directory: string, parentSegments: string[] = []): Promise<string[][]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths: string[][] = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      paths.push(...(await getMarkdownPaths(entryPath, [...parentSegments, entry.name])));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".md")) {
      paths.push([...parentSegments, entry.name.slice(0, -3)]);
    }
  }

  return paths;
}

export async function getAdminLessonContent(exam: string, lessonPath: string[]): Promise<AdminLessonContent | null> {
  const normalizedExam = exam.toLowerCase();

  if (!SUPPORTED_EXAM_SET.has(normalizedExam) || lessonPath.length < 2 || lessonPath.some((segment) => !SAFE_SEGMENT_PATTERN.test(segment))) {
    return null;
  }

  const lessonSlug = lessonPath.at(-1)!;
  const contentSegments = lessonPath.slice(0, -1);
  const examRoot = path.join(ADMIN_CONTENT_ROOT, normalizedExam);
  const filePath = path.join(examRoot, ...contentSegments, `${lessonSlug}.md`);
  const relativePath = path.relative(examRoot, filePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    return null;
  }

  try {
    const rawContent = await readFile(filePath, "utf8");
    const { content, metadata } = parseCourseMarkdown(rawContent, lessonSlug);

    return {
      content,
      exam: normalizedExam,
      lessonPath,
      metadata,
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

export async function getAdminLessonCatalog(): Promise<AdminLessonSummary[]> {
  const catalog: AdminLessonSummary[] = [];

  for (const exam of SUPPORTED_EXAMS) {
    const examRoot = path.join(ADMIN_CONTENT_ROOT, exam);
    const lessonPaths = await getMarkdownPaths(examRoot);

    for (const lessonPath of lessonPaths) {
      const lesson = await getAdminLessonContent(exam, lessonPath);

      if (lesson) {
        catalog.push({
          ...lesson.metadata,
          exam,
          href: `/admin/lessons/${exam}/${lessonPath.join("/")}`,
          lessonPath,
        });
      }
    }
  }

  return catalog;
}
