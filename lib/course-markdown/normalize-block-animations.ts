import { courseAnimationTypes } from "./markdown-transforms";

const animationTypeSet = new Set<string>(courseAnimationTypes);
const STANDALONE_ANIMATION = /^\s*>\s*\[!ANIMATE:([A-Z-]+)\]\s*$/i;
const COURSE_CODE_BLOCK = /^```(?:course-quiz|flow)\b/i;
const COURSE_DIRECTIVE_BLOCK = /^(:{3,})(?:columns|practice)\b/i;

function findCourseBlockEnd(lines: string[], startIndex: number) {
  const start = lines[startIndex].trim();

  if (COURSE_CODE_BLOCK.test(start)) {
    for (let index = startIndex + 1; index < lines.length; index += 1) {
      if (lines[index].trim() === "```") return index;
    }
    return null;
  }

  const directiveMatch = start.match(COURSE_DIRECTIVE_BLOCK);
  if (directiveMatch) {
    for (let index = startIndex + 1; index < lines.length; index += 1) {
      if (lines[index].trim() === directiveMatch[1]) return index;
    }
  }

  return null;
}

export function normalizeCourseBlockAnimations(source: string) {
  const lines = source.split(/\r?\n/);
  const output: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const animationMatch = lines[index].match(STANDALONE_ANIMATION);
    const animation = animationMatch?.[1]?.toLowerCase();

    if (!animation || !animationTypeSet.has(animation)) {
      output.push(lines[index]);
      continue;
    }

    let blockStart = index + 1;
    while (blockStart < lines.length && !lines[blockStart].trim()) blockStart += 1;
    const blockEnd = findCourseBlockEnd(lines, blockStart);

    if (blockEnd === null) {
      output.push(lines[index]);
      continue;
    }

    output.push(`:::::course-animation{type="${animation}"}`, ...lines.slice(blockStart, blockEnd + 1), ":::::");
    index = blockEnd;
  }

  return output.join("\n");
}
