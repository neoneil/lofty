const COLUMNS_START = /^\s*:::columns(?:\s+ratio=(['"])(\d{1,3}\s*\/\s*\d{1,3})\1)?\s*$/i;
const COLUMN_START = /^\s*:::column\s*$/i;

export function normalizeCourseColumnsSyntax(source: string) {
  const lines = source.split(/\r?\n/);
  let inCodeFence = false;
  let inColumns = false;
  let inColumn = false;

  return lines.map((line) => {
    const trimmed = line.trim();
    if (/^```/.test(trimmed)) {
      inCodeFence = !inCodeFence;
      return line;
    }

    if (inCodeFence) return line;

    const columnsMatch = line.match(COLUMNS_START);
    if (!inColumns && columnsMatch) {
      inColumns = true;
      const ratio = columnsMatch[2]?.replace(/\s+/g, "");
      return ratio ? `::::columns{ratio="${ratio}"}` : "::::columns";
    }

    if (inColumns && !inColumn && COLUMN_START.test(line)) {
      inColumn = true;
      return ":::column";
    }

    if (inColumns && trimmed === ":::") {
      if (inColumn) {
        inColumn = false;
        return ":::";
      }

      inColumns = false;
      return "::::";
    }

    return line;
  }).join("\n");
}
