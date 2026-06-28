import ReactMarkdown from "react-markdown";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";

import { remarkCourseTransforms } from "@/lib/course-markdown/markdown-transforms";
import { normalizeCourseColumnsSyntax } from "@/lib/course-markdown/normalize-columns-syntax";
import { courseMarkdownComponents } from "./CourseMarkdownComponents";

export default function CourseMarkdownBody({ content }: { content: string }) {
  const normalizedContent = normalizeCourseColumnsSyntax(content).replace(/\[!ANIMATE:([A-Z-]+)\]/gi, "[!ANIMATE@$1]");
  return <ReactMarkdown remarkPlugins={[remarkGfm, remarkDirective, remarkCourseTransforms]} components={courseMarkdownComponents}>{normalizedContent}</ReactMarkdown>;
}
