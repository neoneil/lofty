export type CourseSlideFooterConfig = {
  left: string | null;
  right: string | null;
};

export type ParsedCourseSlide = {
  content: string;
  footer: CourseSlideFooterConfig | null;
};

const FOOTER_MARKER = "[footer]";
const SLIDE_SEPARATOR = "<!-- slide -->";

export function parseCourseSlideFooter(source: string): ParsedCourseSlide {
  const lines = source.split(/\r?\n/);
  let inFence = false;
  let footerStart = -1;

  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    if (/^```/.test(trimmed)) inFence = !inFence;
    if (!inFence && trimmed.toLowerCase() === FOOTER_MARKER) {
      footerStart = index;
      break;
    }
  }

  if (footerStart < 0) return { content: source, footer: null };

  const footer: CourseSlideFooterConfig = { left: null, right: null };
  let footerEnd = footerStart + 1;

  while (footerEnd < lines.length) {
    const line = lines[footerEnd];
    const match = line.match(/^\s*(left|right)\s*:\s*(.*?)\s*$/i);
    if (!match) break;
    footer[match[1].toLowerCase() as "left" | "right"] = match[2] || null;
    footerEnd += 1;
  }

  const content = [...lines.slice(0, footerStart), ...lines.slice(footerEnd)].join("\n").replace(/\n{3,}/g, "\n\n").trim();
  return { content, footer: footer.left || footer.right ? footer : null };
}

export function stripCourseSlideFooters(content: string) {
  return content.split(SLIDE_SEPARATOR).map((slide) => parseCourseSlideFooter(slide).content).join(`\n\n${SLIDE_SEPARATOR}\n\n`);
}

export function resolveCourseSlideFooterText(value: string | null, page: number, totalPages: number) {
  if (!value) return null;
  return value.replace(/\{\{\s*page\s*\}\}/gi, String(page)).replace(/\{\{\s*total\s*\}\}/gi, String(totalPages));
}
