import FlowArrow from "./flow-arrow";
import FlowNode, { type FlowTheme } from "./flow-node";

const flowThemes = new Set<FlowTheme>(["business", "minimal", "modern", "outline"]);
const ARROW_CHARACTERS = /[↓▼│┃↕↑→←↘↗⇣⇩⭣⮟]+/gu;

type ParsedFlow = {
  theme: FlowTheme;
  nodes: string[];
};

export function parseFlowCode(code: string): ParsedFlow {
  const lines = code.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  let theme: FlowTheme = "business";

  const themeMatch = lines[0]?.match(/^theme\s*:\s*([a-z-]+)$/i);
  if (themeMatch) {
    const requestedTheme = themeMatch[1].toLowerCase() as FlowTheme;
    if (flowThemes.has(requestedTheme)) theme = requestedTheme;
    lines.shift();
  }

  const nodes = lines.map((line) => line.replace(ARROW_CHARACTERS, "").trim()).filter(Boolean);
  return { theme, nodes };
}

export default function FlowDiagram({ code }: { code: string }) {
  const { theme, nodes } = parseFlowCode(code);
  if (nodes.length === 0) return null;

  return (
    <figure className="my-7 flex w-full justify-center" data-flow-theme={theme} aria-label="Vertical flow diagram">
      <div className="flex w-full max-w-xl flex-col items-center px-1 sm:px-4">
        {nodes.map((node, index) => (
          <div key={`${index}-${node}`} className="contents">
            <FlowNode theme={theme}>{node}</FlowNode>
            {index < nodes.length - 1 ? <FlowArrow theme={theme} /> : null}
          </div>
        ))}
      </div>
    </figure>
  );
}
