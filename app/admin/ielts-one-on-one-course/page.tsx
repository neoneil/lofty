import fs from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";

import { CourseOutlineAdminView } from "@/components/admin/course-outline-admin-view";
import { requireAdminOrEditor } from "@/lib/auth/require-admin";
import { parseCourseMarkdown } from "@/lib/course-markdown/parse-course-markdown";

export const metadata: Metadata = {
  title: "IELTS 一对一课程概要 | Lofty Admin",
};

const markdownPath = path.join(process.cwd(), "content/admin/ielts-one-on-one-course-outline.md");

export default async function IeltsOneOnOneCourseAdminPage() {
  await requireAdminOrEditor("/admin/ielts-one-on-one-course");

  const rawContent = await fs.readFile(markdownPath, "utf8");
  const { content, metadata } = parseCourseMarkdown(rawContent, "IELTS 一对一课程概要");

  return <CourseOutlineAdminView content={content} metadata={metadata} eyebrow="IELTS Course Outline" pdfUrl="/downloads/ielts-one-on-one-course-outline.pdf" downloadName="IELTS一对一课程概要.pdf" />;
}
