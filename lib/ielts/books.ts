export const IELTS_PRACTICE_BOOK_NUMBERS = [21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7] as const;

export function isSupportedIeltsPracticeBook(bookNumber: number) {
  return (IELTS_PRACTICE_BOOK_NUMBERS as readonly number[]).includes(bookNumber);
}
