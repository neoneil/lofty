const SLIDE_DIVIDER = "<!-- slide -->";

export function splitCourseSlides(content: string) {
  const slides = content.split(SLIDE_DIVIDER).map((slide) => slide.trim()).filter(Boolean);
  return slides.length > 0 ? slides : [content];
}
