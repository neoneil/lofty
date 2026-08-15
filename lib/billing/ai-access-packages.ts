export const AI_ACCESS_PACKAGES = [
  {
    code: "ai_30_days",
    days: 30,
    label: "30 天 AI 权限",
    amountAudCents: 1900,
    priceEnvVar: "STRIPE_PRICE_AI_30_DAYS",
  },
  {
    code: "ai_60_days",
    days: 60,
    label: "60 天 AI 权限",
    amountAudCents: 3500,
    priceEnvVar: "STRIPE_PRICE_AI_60_DAYS",
  },
  {
    code: "ai_90_days",
    days: 90,
    label: "90 天 AI 权限",
    amountAudCents: 4900,
    priceEnvVar: "STRIPE_PRICE_AI_90_DAYS",
  },
  {
    code: "ai_180_days",
    days: 180,
    label: "180 天 AI 权限",
    amountAudCents: 8900,
    priceEnvVar: "STRIPE_PRICE_AI_180_DAYS",
    recommended: true,
  },
] as const;

export type AiAccessPackageCode = (typeof AI_ACCESS_PACKAGES)[number]["code"];
export type AiAccessPackage = (typeof AI_ACCESS_PACKAGES)[number];

export function getAiAccessPackage(code: string | null | undefined) {
  return AI_ACCESS_PACKAGES.find((item) => item.code === code) ?? null;
}

export function formatAudAmount(cents: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
