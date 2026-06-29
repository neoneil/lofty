export type CourseGradientDirection = "to-bottom-right" | "to-top-right";
export type CourseGradientStops = 2 | 3;

export type CourseGradientPreset = {
  name: string;
  direction: CourseGradientDirection;
  stops: CourseGradientStops;
  light: [string, string, string];
  dark: [string, string, string];
};

export const COURSE_GRADIENT_PRESETS: CourseGradientPreset[] = [
  { name: "商务蓝", direction: "to-bottom-right", stops: 2, light: ["#dbeafe", "#f8fafc", "#f8fafc"], dark: ["#172554", "#1e293b", "#1e293b"] },
  { name: "石墨灰", direction: "to-top-right", stops: 2, light: ["#e2e8f0", "#f8fafc", "#f8fafc"], dark: ["#111827", "#334155", "#334155"] },
  { name: "翡翠青", direction: "to-bottom-right", stops: 2, light: ["#ccfbf1", "#f0fdfa", "#f0fdfa"], dark: ["#134e4a", "#1f2937", "#1f2937"] },
  { name: "靛青银", direction: "to-top-right", stops: 3, light: ["#e0e7ff", "#eef2ff", "#f8fafc"], dark: ["#312e81", "#1e3a5f", "#1f2937"] },
  { name: "酒红灰", direction: "to-bottom-right", stops: 2, light: ["#fce7f3", "#f1f5f9", "#f1f5f9"], dark: ["#4c1d3f", "#1f2937", "#1f2937"] },
  { name: "深海蓝", direction: "to-bottom-right", stops: 3, light: ["#dbeafe", "#e0f2fe", "#f8fafc"], dark: ["#0c4a6e", "#172554", "#111827"] },
  { name: "冰川青", direction: "to-top-right", stops: 3, light: ["#cffafe", "#e0f2fe", "#f8fafc"], dark: ["#164e63", "#1e3a5f", "#111827"] },
  { name: "皇家紫", direction: "to-bottom-right", stops: 2, light: ["#ede9fe", "#f8fafc", "#f8fafc"], dark: ["#3b0764", "#1f2937", "#1f2937"] },
  { name: "松石灰", direction: "to-top-right", stops: 2, light: ["#d1fae5", "#f1f5f9", "#f1f5f9"], dark: ["#064e3b", "#263449", "#263449"] },
  { name: "云杉绿", direction: "to-bottom-right", stops: 3, light: ["#dcfce7", "#ecfeff", "#f8fafc"], dark: ["#14532d", "#164e63", "#111827"] },
];

