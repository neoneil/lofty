import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const manifest = JSON.parse(readFileSync(path.join(ROOT, "content/pte/di-generated/lofty-di-set.json"), "utf8"));
const outDir = path.join(ROOT, "content/pte/di-generated/assets");
mkdirSync(outDir, { recursive: true });

const W = 1200;
const H = 800;
const palette = ["#2563EB", "#0F9D8A", "#F59E0B", "#E85D75", "#7C3AED", "#0891B2", "#65A30D", "#EA580C"];
const esc = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const fmt = (value) => Number.isInteger(value) ? String(value) : Number(value).toFixed(1);

function frame(item, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#0F172A" flood-opacity="0.12"/></filter>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#64748B"/></marker>
    <linearGradient id="header" x1="0" x2="1"><stop offset="0" stop-color="#EFF6FF"/><stop offset="1" stop-color="#ECFDF5"/></linearGradient>
  </defs>
  <rect width="1200" height="800" fill="#F8FAFC"/>
  <rect x="35" y="30" width="1130" height="740" rx="18" fill="#FFFFFF" stroke="#D9E2EC" filter="url(#shadow)"/>
  <rect x="35" y="30" width="1130" height="112" rx="18" fill="url(#header)"/>
  <rect x="35" y="124" width="1130" height="18" fill="url(#header)"/>
  <text x="75" y="80" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#12263A">${esc(item.title)}</text>
  <text x="75" y="116" font-family="Arial, sans-serif" font-size="17" fill="#52677D">${esc(item.subtitle)}</text>
  ${body}
  <text x="1125" y="742" text-anchor="end" font-family="Arial, sans-serif" font-size="13" fill="#94A3B8">Lofty Education · PTE Describe Image</text>
  </svg>`;
}

function legend(series, x = 720, y = 92) {
  return series.map((s, i) => `<rect x="${x + i * 145}" y="${y - 12}" width="16" height="16" rx="4" fill="${palette[i]}"/><text x="${x + i * 145 + 24}" y="${y + 1}" font-family="Arial" font-size="14" fill="#334155">${esc(s.name)}</text>`).join("");
}

function lineChart(item) {
  const x0 = 105, y0 = 675, cw = 990, ch = 470;
  const max = Math.max(...item.series.flatMap((s) => s.values)) * 1.12;
  const parts = [legend(item.series, 650, 92)];
  for (let i = 0; i <= 5; i++) {
    const y = y0 - (ch * i / 5);
    const val = max * i / 5;
    parts.push(`<line x1="${x0}" y1="${y}" x2="${x0 + cw}" y2="${y}" stroke="#DCE5EE"/><text x="${x0 - 18}" y="${y + 5}" text-anchor="end" font-family="Arial" font-size="14" fill="#64748B">${fmt(val)}</text>`);
  }
  item.labels.forEach((label, i) => {
    const x = x0 + cw * i / (item.labels.length - 1);
    parts.push(`<text x="${x}" y="${y0 + 34}" text-anchor="middle" font-family="Arial" font-size="15" fill="#475569">${esc(label)}</text>`);
  });
  item.series.forEach((series, si) => {
    const points = series.values.map((value, i) => `${x0 + cw * i / (item.labels.length - 1)},${y0 - value / max * ch}`).join(" ");
    parts.push(`<polyline points="${points}" fill="none" stroke="${palette[si]}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>`);
    series.values.forEach((value, i) => {
      const x = x0 + cw * i / (item.labels.length - 1), y = y0 - value / max * ch;
      parts.push(`<circle cx="${x}" cy="${y}" r="7" fill="#FFF" stroke="${palette[si]}" stroke-width="4"/><text x="${x}" y="${y - 15}" text-anchor="middle" font-family="Arial" font-size="12" font-weight="700" fill="${palette[si]}">${fmt(value)}</text>`);
    });
  });
  parts.push(`<text x="58" y="405" transform="rotate(-90 58 405)" text-anchor="middle" font-family="Arial" font-size="15" fill="#52677D">${esc(item.unit)}</text>`);
  return frame(item, parts.join(""));
}

function barChart(item) {
  const x0 = 105, y0 = 675, cw = 990, ch = 470;
  const stacked = item.variant === "stacked";
  const max = Math.max(...item.labels.map((_, i) => stacked ? item.series.reduce((sum, s) => sum + s.values[i], 0) : Math.max(...item.series.map((s) => s.values[i])))) * 1.15;
  const parts = [legend(item.series, 590, 92)];
  for (let i = 0; i <= 5; i++) {
    const y = y0 - ch * i / 5;
    parts.push(`<line x1="${x0}" y1="${y}" x2="${x0 + cw}" y2="${y}" stroke="#DCE5EE"/><text x="${x0 - 18}" y="${y + 5}" text-anchor="end" font-family="Arial" font-size="14" fill="#64748B">${fmt(max * i / 5)}</text>`);
  }
  const groupW = cw / item.labels.length;
  item.labels.forEach((label, i) => {
    const center = x0 + groupW * (i + 0.5);
    if (stacked) {
      let used = 0;
      item.series.forEach((series, si) => {
        const value = series.values[i], bh = value / max * ch, y = y0 - (used + value) / max * ch;
        parts.push(`<rect x="${center - 48}" y="${y}" width="96" height="${bh}" fill="${palette[si]}"/><text x="${center}" y="${y + bh / 2 + 5}" text-anchor="middle" font-family="Arial" font-size="13" font-weight="700" fill="#FFF">${fmt(value)}</text>`);
        used += value;
      });
    } else {
      const gap = 8, bw = Math.min(48, (groupW - 34) / item.series.length - gap);
      item.series.forEach((series, si) => {
        const value = series.values[i], bh = value / max * ch;
        const x = center - (item.series.length * (bw + gap) - gap) / 2 + si * (bw + gap);
        parts.push(`<rect x="${x}" y="${y0 - bh}" width="${bw}" height="${bh}" rx="5" fill="${palette[si]}"/><text x="${x + bw / 2}" y="${y0 - bh - 9}" text-anchor="middle" font-family="Arial" font-size="12" font-weight="700" fill="#334155">${fmt(value)}</text>`);
      });
    }
    parts.push(`<text x="${center}" y="${y0 + 34}" text-anchor="middle" font-family="Arial" font-size="14" fill="#475569">${esc(label)}</text>`);
  });
  return frame(item, parts.join(""));
}

function arc(cx, cy, r, start, end) {
  const p1 = [cx + r * Math.cos(start), cy + r * Math.sin(start)];
  const p2 = [cx + r * Math.cos(end), cy + r * Math.sin(end)];
  return `M ${cx} ${cy} L ${p1[0]} ${p1[1]} A ${r} ${r} 0 ${end - start > Math.PI ? 1 : 0} 1 ${p2[0]} ${p2[1]} Z`;
}

function pieChart(item) {
  const count = item.series.length;
  const centers = count === 1 ? [[600, 420]] : count === 2 ? [[390, 420], [810, 420]] : [[275, 420], [600, 420], [925, 420]];
  const radius = count === 1 ? 215 : count === 2 ? 170 : 135;
  const parts = [];
  item.series.forEach((series, pi) => {
    let angle = -Math.PI / 2;
    const [cx, cy] = centers[pi];
    series.values.forEach((value, i) => {
      const end = angle + value / 100 * Math.PI * 2;
      parts.push(`<path d="${arc(cx, cy, radius, angle, end)}" fill="${palette[i]}" stroke="#FFF" stroke-width="4"/>`);
      const mid = (angle + end) / 2;
      if (value >= 7) parts.push(`<text x="${cx + Math.cos(mid) * radius * 0.63}" y="${cy + Math.sin(mid) * radius * 0.63 + 5}" text-anchor="middle" font-family="Arial" font-size="15" font-weight="700" fill="#FFF">${fmt(value)}%</text>`);
      angle = end;
    });
    parts.push(`<text x="${cx}" y="${cy + radius + 34}" text-anchor="middle" font-family="Arial" font-size="16" font-weight="700" fill="#334155">${esc(series.name)}</text>`);
  });
  item.labels.forEach((label, i) => {
    const x = 80 + (i % 5) * 215;
    parts.push(`<rect x="${x}" y="670" width="15" height="15" rx="3" fill="${palette[i]}"/><text x="${x + 23}" y="683" font-family="Arial" font-size="14" fill="#475569">${esc(label)}</text>`);
  });
  return frame(item, parts.join(""));
}

function tableChart(item) {
  const x = 85, y = 190, width = 1030, rowH = 72;
  const cols = item.labels.length + 1, colW = width / cols;
  const parts = [`<rect x="${x}" y="${y}" width="${width}" height="${rowH * (item.series.length + 1)}" rx="10" fill="#FFF" stroke="#CBD5E1"/>`];
  const headers = ["Category", ...item.labels];
  headers.forEach((label, i) => parts.push(`<rect x="${x + i * colW}" y="${y}" width="${colW}" height="${rowH}" fill="${i === 0 ? "#173B57" : "#1E6084"}"/><text x="${x + (i + .5) * colW}" y="${y + 43}" text-anchor="middle" font-family="Arial" font-size="15" font-weight="700" fill="#FFF">${esc(label)}</text>`));
  item.series.forEach((row, ri) => {
    const yy = y + (ri + 1) * rowH;
    const bg = ri % 2 ? "#F1F7FA" : "#FFFFFF";
    parts.push(`<rect x="${x}" y="${yy}" width="${width}" height="${rowH}" fill="${bg}"/>`);
    [row.name, ...row.values.map((v) => `${fmt(v)}${item.unit === "%" ? "%" : ""}`)].forEach((value, ci) => parts.push(`<text x="${x + (ci + .5) * colW}" y="${yy + 43}" text-anchor="middle" font-family="Arial" font-size="16" font-weight="${ci === 0 ? 700 : 500}" fill="#334155">${esc(value)}</text>`));
  });
  for (let i = 1; i < cols; i++) parts.push(`<line x1="${x + i * colW}" y1="${y}" x2="${x + i * colW}" y2="${y + rowH * (item.series.length + 1)}" stroke="#D9E2EC"/>`);
  return frame(item, parts.join(""));
}

function flowChart(item) {
  const labels = item.labels;
  const parts = [];
  if (item.variant === "cycle") {
    const cx = 600, cy = 430, r = 225;
    labels.forEach((label, i) => {
      const a = -Math.PI / 2 + i * Math.PI * 2 / labels.length;
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      const nextA = -Math.PI / 2 + ((i + 1) % labels.length) * Math.PI * 2 / labels.length;
      parts.push(`<path d="M ${x + Math.cos(nextA-a)*70} ${y + Math.sin(nextA-a)*35} Q ${cx + Math.cos((a+nextA)/2)*310} ${cy + Math.sin((a+nextA)/2)*310} ${cx + Math.cos(nextA)*r} ${cy + Math.sin(nextA)*r}" fill="none" stroke="#64748B" stroke-width="3" marker-end="url(#arrow)"/>`);
      parts.push(`<rect x="${x - 82}" y="${y - 38}" width="164" height="76" rx="16" fill="${palette[i % palette.length]}"/><text x="${x}" y="${y - 4}" text-anchor="middle" font-family="Arial" font-size="14" font-weight="700" fill="#FFF">${esc(label.split(" ").slice(0,3).join(" "))}</text><text x="${x}" y="${y + 17}" text-anchor="middle" font-family="Arial" font-size="13" fill="#FFF">${esc(label.split(" ").slice(3).join(" "))}</text>`);
    });
    parts.push(`<circle cx="600" cy="430" r="92" fill="#E8F3F5"/><text x="600" y="425" text-anchor="middle" font-family="Arial" font-size="18" font-weight="700" fill="#173B57">Continuous</text><text x="600" y="450" text-anchor="middle" font-family="Arial" font-size="18" font-weight="700" fill="#173B57">Cycle</text>`);
  } else if (item.variant === "branching-process") {
    const root = labels[0], branches = labels.slice(1);
    parts.push(`<rect x="470" y="180" width="260" height="76" rx="16" fill="#173B57"/><text x="600" y="226" text-anchor="middle" font-family="Arial" font-size="16" font-weight="700" fill="#FFF">${esc(root)}</text>`);
    branches.forEach((label, i) => {
      const level = i < 3 ? 0 : 1, idx = i % 3, x = 155 + idx * 365, y = 365 + level * 170;
      parts.push(`<path d="M600 256 Q600 ${315 + level*120} ${x + 130} ${y}" fill="none" stroke="#64748B" stroke-width="3" marker-end="url(#arrow)"/><rect x="${x}" y="${y}" width="260" height="82" rx="16" fill="${palette[(i+1)%palette.length]}"/><text x="${x+130}" y="${y+48}" text-anchor="middle" font-family="Arial" font-size="15" font-weight="700" fill="#FFF">${esc(label)}</text>`);
    });
  } else {
    const gap = 24;
    const boxW = Math.min(160, (1040 - (labels.length - 1) * gap) / labels.length);
    const total = labels.length * boxW + (labels.length - 1) * gap;
    const start = (W-total)/2;
    labels.forEach((label, i) => {
      const x = start + i * (boxW + gap), y = 360;
      if (i) parts.push(`<line x1="${x-gap+5}" y1="400" x2="${x-8}" y2="400" stroke="#64748B" stroke-width="4" marker-end="url(#arrow)"/>`);
      const words=label.split(" "); const half=Math.ceil(words.length/2);
      parts.push(`<rect x="${x}" y="${y}" width="${boxW}" height="90" rx="16" fill="${palette[i%palette.length]}"/><text x="${x+boxW/2}" y="${y+39}" text-anchor="middle" font-family="Arial" font-size="14" font-weight="700" fill="#FFF">${esc(words.slice(0,half).join(" "))}</text><text x="${x+boxW/2}" y="${y+61}" text-anchor="middle" font-family="Arial" font-size="14" fill="#FFF">${esc(words.slice(half).join(" "))}</text>`);
    });
  }
  return frame(item, parts.join(""));
}

function mapChart(item) {
  const values = item.series[0].values;
  const max = Math.max(...values), min = Math.min(...values);
  const points = [[265,260],[510,225],[790,255],[945,395],[760,565],[475,590],[250,470],[600,410]];
  const parts = [`<path d="M150 300 C245 165 420 170 510 220 C650 145 865 190 1015 330 C1090 440 955 610 775 650 C610 710 410 650 245 560 C125 500 90 390 150 300Z" fill="#E8F1EC" stroke="#9BB6A8" stroke-width="5"/>`,`<path d="M190 505 C330 420 405 510 540 420 S800 330 1010 390" fill="none" stroke="#8BC5DA" stroke-width="22" opacity=".7"/>`];
  item.labels.forEach((label,i)=>{
    const [x,y]=points[i]; const ratio=(values[i]-min)/Math.max(1,max-min); const r=28+ratio*34; const color=palette[i%palette.length];
    if(item.variant==="transport-network" && i>0) parts.push(`<line x1="${points[0][0]}" y1="${points[0][1]}" x2="${x}" y2="${y}" stroke="#64748B" stroke-width="${3+ratio*5}" stroke-dasharray="12 8"/>`);
    parts.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" fill-opacity=".88" stroke="#FFF" stroke-width="5"/><text x="${x}" y="${y-4}" text-anchor="middle" font-family="Arial" font-size="13" font-weight="700" fill="#FFF">${esc(label)}</text><text x="${x}" y="${y+18}" text-anchor="middle" font-family="Arial" font-size="14" fill="#FFF">${fmt(values[i])}${item.unit==="%"?"%":""}</text>`);
  });
  parts.push(`<g transform="translate(1080 190)"><path d="M0 35 L14 0 L28 35 L14 27 Z" fill="#173B57"/><text x="14" y="55" text-anchor="middle" font-family="Arial" font-size="13" font-weight="700" fill="#173B57">N</text></g>`);
  return frame(item, parts.join(""));
}

function render(item) {
  if (item.type === "line_chart") return lineChart(item);
  if (item.type === "bar_chart") return barChart(item);
  if (item.type === "pie_chart") return pieChart(item);
  if (item.type === "table") return tableChart(item);
  if (item.type === "flowchart") return flowChart(item);
  if (item.type === "map") return mapChart(item);
  return null;
}

const imageSources = {
  "urban-transport": "tmp/di-generated/image-urban-transport.png",
  "renewable-lab": "tmp/di-generated/image-renewable-lab.png",
  "smart-agriculture": "tmp/di-generated/image-smart-agriculture.png",
};

for (const item of manifest.items) {
  const pngPath = path.join(outDir, `${item.slug}.png`);
  if (item.type === "image") {
    const source = imageSources[item.variant];
    if (!source) throw new Error(`Missing source for ${item.variant}`);
    execFileSync("convert", [path.join(ROOT, source), "-resize", "1200x800^", "-gravity", "center", "-extent", "1200x800", pngPath], { stdio: "inherit" });
    continue;
  }
  const svg = render(item);
  const svgPath = path.join(outDir, `${item.slug}.svg`);
  writeFileSync(svgPath, svg);
  execFileSync("convert", ["-background", "white", "-density", "144", svgPath, "-resize", "1200x800!", pngPath], { stdio: "inherit" });
}

console.log(`Rendered ${manifest.items.length} DI assets in ${outDir}`);
