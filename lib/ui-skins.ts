export const UI_SKIN_STORAGE_KEY = "lofty-ui-skin";
export const UI_SKIN_EVENT = "lofty:ui-skin-change";

export const UI_SKINS = [
  { id: "default", label: "经典紫韵", description: "清晰、醒目的品牌紫色体系", colors: ["#6d5dfc", "#ede9fe", "#ffffff"] },
  { id: "jade", label: "翡翠清韵", description: "稳重、清晰的翡翠绿色体系", colors: ["#18765a", "#dff3ea", "#ffffff"] },
  { id: "cobalt", label: "钴蓝远境", description: "专业、理性的深蓝色体系", colors: ["#2459a9", "#e6eefb", "#ffffff"] },
  { id: "claret", label: "酒红雅韵", description: "成熟、有辨识度的酒红体系", colors: ["#9c2f4e", "#f8e8ed", "#ffffff"] },
  { id: "graphite", label: "石墨沉静", description: "克制、中性的石墨灰体系", colors: ["#344054", "#e7ebef", "#ffffff"] },
  { id: "amber", label: "鎏金暖阳", description: "温暖、精致的鎏金色体系", colors: ["#9a6a16", "#f8edcf", "#ffffff"] },
  { id: "teal", label: "青瓷碧影", description: "清爽、平衡的青瓷色体系", colors: ["#0f766e", "#dcefeb", "#ffffff"] },
  { id: "rose", label: "暮霞柔光", description: "柔和、雅致的暮霞色体系", colors: ["#b64e72", "#fae8ef", "#ffffff"] },
] as const;

export type UiSkinId = (typeof UI_SKINS)[number]["id"];

export function isUiSkinId(value: string | undefined): value is UiSkinId {
  return UI_SKINS.some((skin) => skin.id === value);
}
