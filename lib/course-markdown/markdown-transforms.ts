import { courseAdmonitionTypes, type CourseAdmonitionType } from "@/components/course-markdown/course-admonition-config";

type MarkdownNode = {
  type: string;
  value?: string;
  name?: string;
  attributes?: Record<string, string | null | undefined>;
  children?: MarkdownNode[];
  data?: {
    hName?: string;
    hProperties?: Record<string, unknown>;
  };
};

export const courseAnimationTypes = ["fade-in", "slide-up", "zoom-in", "highlight", "typing"] as const;
export type CourseAnimationType = (typeof courseAnimationTypes)[number];

const admonitionTypeSet = new Set<string>(courseAdmonitionTypes);
const animationTypeSet = new Set<string>(courseAnimationTypes);
const ADMONITION_PATTERN = /^\s*\[!([A-Z][A-Z-]*)\]\s*/i;
const ANIMATION_PATTERN = /^\s*\[!ANIMATE(?:(?::|@)([A-Z-]+))?\]\s*/i;
const INLINE_PATTERN = /(==(.+?)==|\{(red|green|yellow|blue|purple)\}(.+?)\{\/\3\}|\[badge:\s*([^\]]+)\])/gi;

function findFirstText(node: MarkdownNode): MarkdownNode | null {
  if (node.type === "text" && typeof node.value === "string") {
    return node;
  }

  for (const child of node.children ?? []) {
    const textNode = findFirstText(child);
    if (textNode) return textNode;
  }

  return null;
}

function findTextMatching(node: MarkdownNode, pattern: RegExp): MarkdownNode | null {
  if (node.type === "text" && typeof node.value === "string" && pattern.test(node.value)) {
    pattern.lastIndex = 0;
    return node;
  }

  pattern.lastIndex = 0;
  for (const child of node.children ?? []) {
    if (child.type === "blockquote") continue;
    const textNode = findTextMatching(child, pattern);
    if (textNode) return textNode;
  }

  return null;
}

function hasText(node: MarkdownNode): boolean {
  if (node.type === "text") return Boolean(node.value?.trim());
  return (node.children ?? []).some(hasText);
}

function setBlockType(node: MarkdownNode, className: string) {
  node.data = {
    ...node.data,
    hName: className.startsWith("course-animation-") ? "div" : "aside",
    hProperties: {
      ...node.data?.hProperties,
      className,
    },
  };
}

function transformDirective(node: MarkdownNode) {
  if (node.type !== "containerDirective") return;
  const name = node.name?.toLowerCase();

  if (name === "columns") {
    const ratio = node.attributes?.ratio?.replace(/\s+/g, "");
    const ratioMatch = ratio?.match(/^(\d{1,3})\/(\d{1,3})$/);
    const ratioClass = ratioMatch && Number(ratioMatch[1]) > 0 && Number(ratioMatch[2]) > 0 ? ` course-columns-ratio-${ratioMatch[1]}-${ratioMatch[2]}` : "";
    node.data = { ...node.data, hName: "div", hProperties: { ...node.data?.hProperties, className: `course-columns${ratioClass}` } };
  } else if (name === "column") {
    node.data = { ...node.data, hName: "div", hProperties: { ...node.data?.hProperties, className: "course-column" } };
  }
}

function transformBlock(node: MarkdownNode) {
  if (node.type !== "blockquote" || !node.children?.[0]) return;

  const textNode = findFirstText(node.children[0]);
  if (!textNode?.value) return;

  const animationMatch = textNode.value.match(ANIMATION_PATTERN);

  if (animationMatch) {
    textNode.value = textNode.value.slice(animationMatch[0].length);
    const animationType = animationMatch[1]?.toLowerCase();
    const resolvedAnimation = animationType && animationTypeSet.has(animationType) ? animationType : null;
    const nestedAdmonitionNode = textNode.value.match(ADMONITION_PATTERN) ? textNode : findTextMatching(node, ADMONITION_PATTERN);
    const nestedAdmonitionMatch = nestedAdmonitionNode?.value?.match(ADMONITION_PATTERN);
    const nestedAdmonitionType = nestedAdmonitionMatch?.[1]?.toLowerCase();
    let className = resolvedAnimation ? `course-animation-${resolvedAnimation}` : "course-admonition-note";

    if (resolvedAnimation && nestedAdmonitionNode?.value && nestedAdmonitionMatch && nestedAdmonitionType && admonitionTypeSet.has(nestedAdmonitionType)) {
      nestedAdmonitionNode.value = nestedAdmonitionNode.value.slice(nestedAdmonitionMatch[0].length);
      className += ` course-admonition-${nestedAdmonitionType as CourseAdmonitionType}`;
    }

    setBlockType(node, className);
  } else {
    const admonitionMatch = textNode.value.match(ADMONITION_PATTERN);
    const admonitionType = admonitionMatch?.[1]?.toLowerCase();

    if (admonitionMatch && admonitionType && admonitionTypeSet.has(admonitionType)) {
      textNode.value = textNode.value.slice(admonitionMatch[0].length);
      setBlockType(node, `course-admonition-${admonitionType as CourseAdmonitionType}`);
    }
  }

  if (!hasText(node.children[0])) {
    node.children.shift();
  }
}

function inlineNode(tagName: "mark" | "span", className: string, value: string): MarkdownNode {
  return {
    type: "courseInline",
    children: [{ type: "text", value }],
    data: {
      hName: tagName,
      hProperties: { className },
    },
  };
}

function transformInlineText(value: string) {
  const nodes: MarkdownNode[] = [];
  let lastIndex = 0;

  for (const match of value.matchAll(INLINE_PATTERN)) {
    const index = match.index ?? 0;

    if (index > lastIndex) {
      nodes.push({ type: "text", value: value.slice(lastIndex, index) });
    }

    if (match[2]) {
      nodes.push(inlineNode("mark", "course-highlight", match[2]));
    } else if (match[3] && match[4]) {
      nodes.push(inlineNode("span", `course-text-${match[3].toLowerCase()}`, match[4]));
    } else if (match[5]) {
      nodes.push(inlineNode("span", "course-inline-badge", match[5].trim()));
    }

    lastIndex = index + match[0].length;
  }

  if (lastIndex === 0) return null;
  if (lastIndex < value.length) nodes.push({ type: "text", value: value.slice(lastIndex) });
  return nodes;
}

function transformTree(node: MarkdownNode) {
  transformDirective(node);
  transformBlock(node);

  if (!node.children || node.type === "code" || node.type === "inlineCode") return;

  const transformedChildren: MarkdownNode[] = [];

  for (const child of node.children) {
    if (child.type === "text" && child.value) {
      transformedChildren.push(...(transformInlineText(child.value) ?? [child]));
    } else {
      transformTree(child);
      transformedChildren.push(child);
    }
  }

  node.children = transformedChildren;
}

export function remarkCourseTransforms() {
  return transformTree;
}
