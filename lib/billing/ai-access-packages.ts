import { normalizeProfileExamType, type ProfileExamType } from "@/lib/profile/exam-type";

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
export type AiAccessProductScope = ProfileExamType;

export const AI_ACCESS_PRODUCT_SCOPES = [
  {
    scope: "ielts",
    label: "IELTS AI",
    title: "雅思 AI 权限",
    description: "用于 IELTS 写作批改、口语评分、雅思题库 AI 入口等功能。",
  },
  {
    scope: "pte",
    label: "PTE AI",
    title: "PTE AI 权限",
    description: "用于 PTE 口语、写作、听力等题型的 AI 评分与反馈。",
  },
] as const;

export function getAiAccessPackage(code: string | null | undefined) {
  return AI_ACCESS_PACKAGES.find((item) => item.code === code) ?? null;
}

export function normalizeAiAccessProductScope(value: unknown): AiAccessProductScope | null {
  return normalizeProfileExamType(value);
}

export function getAiAccessProductScopeConfig(value: unknown) {
  const scope = normalizeAiAccessProductScope(value);
  return scope ? AI_ACCESS_PRODUCT_SCOPES.find((item) => item.scope === scope) ?? null : null;
}

export function getScopedStripePriceEnvVar(pkg: AiAccessPackage, productScope: AiAccessProductScope) {
  const prefix = productScope === "ielts" ? "IELTS_AI" : "PTE_AI";
  return `STRIPE_PRICE_${prefix}_${pkg.days}_DAYS`;
}

export function formatAudAmount(cents: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
