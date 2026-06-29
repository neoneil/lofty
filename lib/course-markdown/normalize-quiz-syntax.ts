const QUIZ_START = /^\s*:::quiz\s*$/i;

export function normalizeCourseQuizSyntax(source: string) {
  const lines = source.split(/\r?\n/);
  const output: string[] = [];
  let inCodeFence = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    if (/^```/.test(trimmed)) {
      inCodeFence = !inCodeFence;
      output.push(line);
      continue;
    }

    if (inCodeFence) {
      output.push(line);
      continue;
    }

    const startMatch = line.match(QUIZ_START);
    if (!startMatch) {
      output.push(line);
      continue;
    }

    const quizLines: string[] = [];
    let closed = false;
    for (index += 1; index < lines.length; index += 1) {
      if (lines[index].trim() === ":::") {
        closed = true;
        break;
      }
      quizLines.push(lines[index]);
    }

    if (!closed) {
      output.push(line, ...quizLines);
      break;
    }

    output.push("```course-quiz", ...quizLines, "```");
  }

  return output.join("\n");
}
