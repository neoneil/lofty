import { normalizeCourseBlockAnimations } from "./normalize-block-animations";
import { normalizeCourseColumnsSyntax } from "./normalize-columns-syntax";
import { normalizeCourseQuizSyntax } from "./normalize-quiz-syntax";

type CourseBlockNormalizer = (source: string) => string;

const courseBlockNormalizers: CourseBlockNormalizer[] = [
  normalizeCourseQuizSyntax,
  normalizeCourseColumnsSyntax,
  normalizeCourseBlockAnimations,
];

export function normalizeCourseBlocks(source: string) {
  return courseBlockNormalizers.reduce((content, normalize) => normalize(content), source);
}

