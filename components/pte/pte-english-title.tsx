type PteEnglishTitleProps = {
  title: string | null | undefined;
  className?: string;
};

export function getPteEnglishTitle(title: string | null | undefined) {
  const rawTitle = title?.trim() ?? "";

  const englishTitle = rawTitle
    .replace(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]+/gu, " ")
    .replace(/[，。！？；：、（）［］【】《》“”‘’]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(?:[-–—|｜/·•]\s*)+/, "")
    .replace(/(?:\s*[-–—|｜/·•])+$/, "")
    .trim();

  return englishTitle || rawTitle;
}

export function PteEnglishTitle({ title, className }: PteEnglishTitleProps) {
  return <p className={className}>{getPteEnglishTitle(title)}</p>;
}
