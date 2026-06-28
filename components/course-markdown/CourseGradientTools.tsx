"use client";

import { Blend, PanelRightClose, RotateCcw } from "lucide-react";

import { useCourseAppearance, type CourseGradientDirection, type CourseGradientStops } from "./CourseAppearanceProvider";

type CourseGradientToolsProps = {
  expanded: boolean;
  showCollapsed: boolean;
  onExpandedChange: (expanded: boolean) => void;
};

const DIRECTIONS: Array<{ value: CourseGradientDirection; label: string; symbol: string }> = [
  { value: "to-bottom-right", label: "左上到右下", symbol: "↘" },
  { value: "to-top-right", label: "左下到右上", symbol: "↗" },
];

type GradientPreset = {
  name: string;
  direction: CourseGradientDirection;
  stops: CourseGradientStops;
  light: [string, string, string];
  dark: [string, string, string];
};

const GRADIENT_PRESETS: GradientPreset[] = [
  { name: "商务蓝", direction: "to-bottom-right", stops: 2, light: ["#dbeafe", "#f8fafc", "#f8fafc"], dark: ["#172554", "#1e293b", "#1e293b"] },
  { name: "石墨灰", direction: "to-top-right", stops: 2, light: ["#e2e8f0", "#f8fafc", "#f8fafc"], dark: ["#111827", "#334155", "#334155"] },
  { name: "翡翠青", direction: "to-bottom-right", stops: 2, light: ["#ccfbf1", "#f0fdfa", "#f0fdfa"], dark: ["#134e4a", "#1f2937", "#1f2937"] },
  { name: "靛青银", direction: "to-top-right", stops: 3, light: ["#e0e7ff", "#eef2ff", "#f8fafc"], dark: ["#312e81", "#1e3a5f", "#1f2937"] },
  { name: "酒红灰", direction: "to-bottom-right", stops: 2, light: ["#fce7f3", "#f1f5f9", "#f1f5f9"], dark: ["#4c1d3f", "#1f2937", "#1f2937"] },
  { name: "深海蓝", direction: "to-bottom-right", stops: 3, light: ["#dbeafe", "#e0f2fe", "#f8fafc"], dark: ["#0c4a6e", "#172554", "#111827"] },
];

export default function CourseGradientTools({ expanded, showCollapsed, onExpandedChange }: CourseGradientToolsProps) {
  const { gradient, gradientStyle, setColor, setDirection, setStops, resetGradient } = useCourseAppearance();

  function applyPreset(preset: GradientPreset) {
    const colors = document.documentElement.dataset.theme === "dark" ? preset.dark : preset.light;
    setDirection(preset.direction);
    setStops(preset.stops);
    colors.forEach((color, index) => setColor(index, color));
  }

  function getPresetBackground(preset: GradientPreset) {
    const colors = preset.light.map((lightColor, index) => `light-dark(${lightColor}, ${preset.dark[index]})`);
    const direction = preset.direction === "to-bottom-right" ? "to bottom right" : "to top right";
    return `linear-gradient(${direction}, ${colors.slice(0, preset.stops).join(", ")})`;
  }

  if (!expanded) {
    return showCollapsed ? <button type="button" onClick={() => onExpandedChange(true)} className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] text-[var(--primary)] shadow-[var(--shadow-lg)] transition hover:bg-[var(--bg-soft)]" aria-label="展开幻灯片渐变背景工具" title="幻灯片背景"><Blend size={19} /></button> : null;
  }

  return (
    <div className="fixed bottom-4 right-3 z-50 max-h-[82vh] w-[calc(100vw-1.5rem)] max-w-[340px] overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-lg)] sm:bottom-auto sm:top-1/2 sm:w-[320px] sm:-translate-y-1/2">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div><div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]"><Blend size={17} className="text-[var(--primary)]" />幻灯片背景</div><p className="mt-1 text-xs text-[var(--text-faint)]">同步应用于主画布和左侧缩略图</p></div>
        <button type="button" onClick={() => onExpandedChange(false)} className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-soft)] transition hover:bg-[var(--bg-soft)] hover:text-[var(--text)]" aria-label="折叠渐变背景工具" title="折叠"><PanelRightClose size={17} /></button>
      </div>

      <div className="mt-4">
        <div className="mb-2 text-xs font-semibold text-[var(--text-soft)]">渐变方向</div>
        <div className="grid grid-cols-2 gap-2">
          {DIRECTIONS.map((option) => <button key={option.value} type="button" onClick={() => setDirection(option.value)} className={`rounded-[var(--radius-sm)] border px-3 py-2 text-left transition ${gradient.direction === option.value ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]" : "border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text-soft)] hover:border-[var(--primary)]"}`}><span className="block text-lg leading-none">{option.symbol}</span><span className="mt-1 block text-[11px] font-semibold">{option.label}</span></button>)}
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 text-xs font-semibold text-[var(--text-soft)]">颜色数量</div>
        <div className="grid grid-cols-2 gap-1 rounded-[var(--radius-md)] bg-[var(--bg-soft)] p-1">
          {([2, 3] as CourseGradientStops[]).map((stops) => <button key={stops} type="button" onClick={() => setStops(stops)} className={`h-8 rounded-[var(--radius-sm)] text-xs font-semibold transition ${gradient.stops === stops ? "bg-[var(--card)] text-[var(--primary)] shadow-[var(--shadow-sm)]" : "text-[var(--text-soft)]"}`}>{stops} 种颜色</button>)}
        </div>
      </div>

      <div className={`mt-4 grid gap-2 ${gradient.stops === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {gradient.colors.slice(0, gradient.stops).map((color, index) => (
          <label key={index} className="cursor-pointer rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] p-2 text-center">
            <input type="color" value={color} onChange={(event) => setColor(index, event.target.value)} className="h-10 w-full cursor-pointer rounded border-0 bg-transparent p-0" aria-label={`选择渐变颜色 ${index + 1}`} />
            <span className="mt-1 block font-mono text-[10px] uppercase text-[var(--text-faint)]">{color}</span>
          </label>
        ))}
      </div>

      <div className="mt-4 h-24 rounded-[var(--radius-md)] border border-[var(--border)] shadow-inner" style={gradientStyle ?? { background: "var(--card)" }}><span className="sr-only">渐变效果预览</span></div>

      <div className="mt-4 border-t border-[var(--border)] pt-4">
        <div className="mb-2 text-xs font-semibold text-[var(--text-soft)]">商务预设</div>
        <div className="grid grid-cols-2 gap-2">
          {GRADIENT_PRESETS.map((preset) => <button key={preset.name} type="button" onClick={() => applyPreset(preset)} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] p-2 text-left transition hover:border-[var(--primary)] hover:shadow-[var(--shadow-sm)]"><span className="block h-8 rounded-[var(--radius-xs)] border border-black/5" style={{ backgroundImage: getPresetBackground(preset) }} /><span className="mt-1.5 block text-[11px] font-semibold text-[var(--text)]">{preset.name}</span></button>)}
        </div>
      </div>

      <button type="button" onClick={resetGradient} disabled={!gradient.enabled} className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] text-xs font-semibold text-[var(--text-soft)] transition hover:bg-[var(--bg-soft)] disabled:cursor-not-allowed disabled:opacity-40"><RotateCcw size={14} />恢复默认背景</button>
    </div>
  );
}
