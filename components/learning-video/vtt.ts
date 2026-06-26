export type TranscriptCue = {
  id: string;
  start: number;
  end: number;
  text: string;
};

function parseTimestamp(value: string) {
  const normalized = value.trim().replace(",", ".");
  const parts = normalized.split(":");

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return Number(minutes) * 60 + Number(seconds);
  }

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
  }

  return Number.NaN;
}

export function formatTranscriptTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";

  const rounded = Math.floor(seconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const remainingSeconds = rounded % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function parseVtt(content: string): TranscriptCue[] {
  const normalized = content.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const blocks = normalized.split(/\n{2,}/);
  const cues: TranscriptCue[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);

    if (!lines.length || lines[0] === "WEBVTT") continue;

    const timingIndex = lines.findIndex((line) => line.includes("-->"));

    if (timingIndex === -1) continue;

    const [startRaw, endRawWithSettings] = lines[timingIndex].split("-->");
    const endRaw = endRawWithSettings?.trim().split(/\s+/)[0] ?? "";
    const start = parseTimestamp(startRaw);
    const end = parseTimestamp(endRaw);

    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;

    const text = lines.slice(timingIndex + 1).join(" ").replace(/<[^>]+>/g, "").trim();

    if (!text) continue;

    cues.push({
      id: `cue-${cues.length}-${start}-${end}`,
      start,
      end,
      text,
    });
  }

  return cues;
}
