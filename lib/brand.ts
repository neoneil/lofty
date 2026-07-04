const configuredBrandName = process.env.NEXT_PUBLIC_BRAND_NAME_CN?.trim();

export const BRAND_NAME_CN = configuredBrandName || "麦芽";
export const BRAND_EDUCATION_CN = `${BRAND_NAME_CN}教育`;
export const BRAND_ENGLISH_CN = `${BRAND_NAME_CN}英语`;
export const BRAND_TEACHER_CN = `${BRAND_NAME_CN}老师`;

export const BRAND_COLORS = {
  primary: process.env.NEXT_PUBLIC_BRAND_PRIMARY_COLOR?.trim() || "var(--primary)",
  secondary: process.env.NEXT_PUBLIC_BRAND_SECONDARY_COLOR?.trim() || "var(--text-soft)",
  surface: process.env.NEXT_PUBLIC_BRAND_SURFACE_COLOR?.trim() || "var(--primary-soft)",
  border: process.env.NEXT_PUBLIC_BRAND_BORDER_COLOR?.trim() || "var(--border)",
  leafPrimary: process.env.NEXT_PUBLIC_BRAND_LEAF_PRIMARY_COLOR?.trim() || "var(--primary)",
  leafSecondary: process.env.NEXT_PUBLIC_BRAND_LEAF_SECONDARY_COLOR?.trim() || "var(--primary)",
} as const;
