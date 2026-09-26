import fs from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";

import { ExamCourseCatalog } from "@/components/courses/exam-course-catalog";
import { parseCourseMarkdown } from "@/lib/course-markdown/parse-course-markdown";

export const metadata: Metadata = {
  title: "PTE 课程大纲 | Lofty Education",
  description: "PTE 一对一、3–5 人精品小班与刷题班课程介绍。",
};

const markdownPath = path.join(process.cwd(), "content/admin/pte-one-on-one-course-outline.md");

export default async function PteCoursesPage() {
  const rawContent = await fs.readFile(markdownPath, "utf8");
  const { content } = parseCourseMarkdown(rawContent, "PTE 一对一课程概要");

  return <ExamCourseCatalog exam="pte" privateCourseContent={content} />;
}
