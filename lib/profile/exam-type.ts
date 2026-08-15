export const PROFILE_EXAM_TYPES = ["ielts", "pte"] as const;

export type ProfileExamType = (typeof PROFILE_EXAM_TYPES)[number];
export type DisplayExamType = "IELTS" | "PTE";

export function normalizeProfileExamType(value: unknown): ProfileExamType | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return normalized === "ielts" || normalized === "pte" ? normalized : null;
}

export function getProfileExamTypeLabel(value: ProfileExamType | null) {
  if (value === "ielts") return "IELTS";
  if (value === "pte") return "PTE";
  return "IELTS / PTE";
}

export function profileExamTypeToDisplay(value: unknown): DisplayExamType | null {
  const normalized = normalizeProfileExamType(value);
  if (normalized === "ielts") return "IELTS";
  if (normalized === "pte") return "PTE";
  return null;
}

export function displayExamTypeToProfile(value: unknown): ProfileExamType | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "ielts") return "ielts";
  if (normalized === "pte") return "pte";
  return null;
}

export function displayExamTypeWithFallback(value: unknown, fallback: DisplayExamType = "PTE"): DisplayExamType {
  return profileExamTypeToDisplay(value) ?? fallback;
}
