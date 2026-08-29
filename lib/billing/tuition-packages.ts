export const TUITION_PACKAGES = [
  {
    code: "tuition_1_lesson",
    label: "单次课",
    lessonCount: 1,
    totalHours: 2,
    amountAudCents: 18000,
    description: "1 次 / 2 小时",
  },
  {
    code: "tuition_10_lessons",
    label: "10 次课",
    lessonCount: 10,
    totalHours: 20,
    amountAudCents: 180000,
    description: "10 次 / 20 小时",
  },
  {
    code: "tuition_20_lessons",
    label: "20 次课",
    lessonCount: 20,
    totalHours: 40,
    amountAudCents: 360000,
    description: "20 次 / 40 小时",
  },
] as const;

export type TuitionPackageCode = (typeof TUITION_PACKAGES)[number]["code"];
export type TuitionPackage = (typeof TUITION_PACKAGES)[number];

export function getTuitionPackage(code: string | null | undefined) {
  return TUITION_PACKAGES.find((item) => item.code === code) ?? null;
}
