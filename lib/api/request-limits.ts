export function isTextTooLong(value: string, maxLength: number) {
  return value.length > maxLength;
}

export function clampInteger(value: unknown, { min, max, fallback }: { min: number; max: number; fallback: number }) {
  const numberValue = Number(value ?? fallback);
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(numberValue)));
}

