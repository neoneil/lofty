import { normalizeAiAccessProductScope, type AiAccessProductScope } from "@/lib/billing/ai-access-packages";

export type AiAccessStatusItem = {
  product_scope?: string | null;
  productScope?: string | null;
  is_unlimited?: boolean | null;
  isUnlimited?: boolean | null;
  unlimited_until?: string | null;
  unlimitedUntil?: string | null;
};

export type AiAccessDisplayOptions = {
  role?: string | null;
  isMyStudent?: boolean | null;
  productAccess?: AiAccessStatusItem[] | null;
};

type ActiveAiAccess = {
  scope: AiAccessProductScope;
  label: string;
  unlimitedUntil: string | null;
};

export function formatAiAccessDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function getProductLabel(scope: AiAccessProductScope) {
  return scope === "ielts" ? "IELTS AI" : "PTE AI";
}

export function getActiveAiAccess(productAccess: AiAccessStatusItem[] | null | undefined): ActiveAiAccess[] {
  const now = Date.now();

  return (productAccess ?? [])
    .map((item) => {
      const scope = normalizeAiAccessProductScope(item.productScope ?? item.product_scope);
      if (!scope) return null;

      const isUnlimited = Boolean(item.isUnlimited ?? item.is_unlimited);
      const unlimitedUntil = item.unlimitedUntil ?? item.unlimited_until ?? null;
      const expiresAt = unlimitedUntil ? new Date(unlimitedUntil).getTime() : null;
      const isActive = isUnlimited && (!expiresAt || expiresAt > now);
      if (!isActive) return null;

      return {
        scope,
        label: getProductLabel(scope),
        unlimitedUntil,
      };
    })
    .filter((item): item is ActiveAiAccess => Boolean(item))
    .sort((a, b) => a.scope.localeCompare(b.scope));
}

export function getAccountStatusLabel({ role, isMyStudent, productAccess }: AiAccessDisplayOptions) {
  if (role === "admin") return "Admin 管理员";
  if (role === "editor") return "Editor";
  if (isMyStudent) return "内部会员";

  const activeAccess = getActiveAiAccess(productAccess);
  if (activeAccess.length === 1) return `${activeAccess[0].label} 会员`;
  if (activeAccess.length > 1) return "AI 付费会员";

  return "普通用户";
}

export function getAiAccessSummaryLabel({ isMyStudent, productAccess }: AiAccessDisplayOptions) {
  if (isMyStudent) return "AI 权限永久有效";

  const activeAccess = getActiveAiAccess(productAccess);
  if (activeAccess.length === 0) return "暂未开通 AI 权限";

  return activeAccess
    .map((item) => item.unlimitedUntil ? `${item.label} 有效期至 ${formatAiAccessDate(item.unlimitedUntil)}` : `${item.label} 永久有效`)
    .join(" · ");
}

export function getAiAccessDetailLabels({ isMyStudent, productAccess }: AiAccessDisplayOptions) {
  if (isMyStudent) return ["内部学生 AI 权限永久有效"];

  const activeAccess = getActiveAiAccess(productAccess);
  if (activeAccess.length === 0) return ["暂未开通 IELTS AI 或 PTE AI 权限"];

  return activeAccess.map((item) => item.unlimitedUntil ? `${item.label}：有效期至 ${formatAiAccessDate(item.unlimitedUntil)}` : `${item.label}：永久有效`);
}
