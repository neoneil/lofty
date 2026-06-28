import type { CourseMetadata } from "@/lib/course-markdown/parse-course-markdown";
import { splitCourseSlides } from "@/lib/course-markdown/split-slides";
import type { CoursePredictionQuestion } from "@/lib/pte/course-prediction-questions";
import CourseArticleView from "./CourseArticleView";
import { CourseAppearanceProvider } from "./CourseAppearanceProvider";
import { CoursePptxExportProvider } from "./CoursePptxExportProvider";
import CourseSlidesView from "./CourseSlidesView";
import CourseToolsDock from "./CourseToolsDock";

type CourseMarkdownRendererProps = {
  content: string;
  metadata: CourseMetadata;
  predictionQuestions?: CoursePredictionQuestion[];
};

export default function CourseMarkdownRenderer({ content, metadata, predictionQuestions = [] }: CourseMarkdownRendererProps) {
  return (
    <CourseAppearanceProvider>
      <CoursePptxExportProvider>
        <CourseToolsDock showGradientTool={metadata.mode === "slides"} />
        {metadata.mode === "slides" ? <CourseSlidesView slides={splitCourseSlides(content)} predictionQuestions={predictionQuestions} exportFileName={metadata.title} /> : <CourseArticleView content={content} predictionQuestions={predictionQuestions} />}
      </CoursePptxExportProvider>
    </CourseAppearanceProvider>
  );
}
