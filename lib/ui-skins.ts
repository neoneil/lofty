export const UI_SKIN_STORAGE_KEY = "lofty-ui-skin";
export const UI_SKIN_EVENT = "lofty:ui-skin-change";

export const UI_SKINS = [
  { id: "default", label: "Lofty 默认", description: "当前紫色品牌体系", colors: ["#6d5dfc", "#ede9fe", "#ffffff"] },
  { id: "jade", label: "翡翠商务", description: "稳重、清晰的绿色体系", colors: ["#18765a", "#dff3ea", "#ffffff"] },
  { id: "cobalt", label: "钴蓝商务", description: "专业、理性的蓝色体系", colors: ["#2459a9", "#e6eefb", "#ffffff"] },
  { id: "claret", label: "酒红商务", description: "成熟、有辨识度的红色体系", colors: ["#9c2f4e", "#f8e8ed", "#ffffff"] },
  { id: "graphite", label: "石墨商务", description: "克制、中性的灰色体系", colors: ["#344054", "#e7ebef", "#ffffff"] },
] as const;

export type UiSkinId = (typeof UI_SKINS)[number]["id"];

export function isUiSkinId(value: string | undefined): value is UiSkinId {
  return UI_SKINS.some((skin) => skin.id === value);
}
