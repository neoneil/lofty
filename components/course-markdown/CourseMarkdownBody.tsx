import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { remarkCourseTransforms } from "@/lib/course-markdown/markdown-transforms";
import { courseMarkdownComponents } from "./CourseMarkdownComponents";

export default function CourseMarkdownBody({ content }: { content: string }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm, remarkCourseTransforms]} components={courseMarkdownComponents}>{content}</ReactMarkdown>;
}
