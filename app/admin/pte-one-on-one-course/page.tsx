import fs from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";

import { CourseOutlineAdminView } from "@/components/admin/course-outline-admin-view";
import { requireAdminOrEditor } from "@/lib/auth/require-admin";
import { parseCourseMarkdown } from "@/lib/course-markdown/parse-course-markdown";

export const metadata: Metadata = {
  title: "PTE 一对一课程概要 | Lofty Admin",
};

const markdownPath = path.join(process.cwd(), "content/admin/pte-one-on-one-course-outline.md");

export default async function PteOneOnOneCourseAdminPage() {
  await requireAdminOrEditor("/admin/pte-one-on-one-course");

  const rawContent = await fs.readFile(markdownPath, "utf8");
  const { content, metadata } = parseCourseMarkdown(rawContent, "PTE 一对一课程概要");

  return <CourseOutlineAdminView content={content} metadata={metadata} eyebrow="PTE Course Outline" pdfUrl="/downloads/pte-one-on-one-course-outline.pdf" downloadName="PTE一对一课程概要.pdf" />;
}
