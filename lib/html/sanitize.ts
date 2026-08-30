const SCRIPT_LIKE_BLOCKS = /<\s*(script|style|iframe|object|embed|template)\b[\s\S]*?<\s*\/\s*\1\s*>/gi;
const HTML_COMMENTS = /<!--[\s\S]*?-->/g;
const TAG_PATTERN = /<\/?([a-zA-Z][a-zA-Z0-9:-]*)\b[^>]*>/g;
const ATTRIBUTE_PATTERN = /([^\s"'<>/=]+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"'=<>`]+))?/g;

const ALLOWED_TAGS = new Set([
  "a",
  "b",
  "blockquote",
  "br",
  "caption",
  "code",
  "col",
  "colgroup",
  "dd",
  "del",
  "div",
  "dl",
  "dt",
  "em",
  "figcaption",
  "figure",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "img",
  "input",
  "ins",
  "label",
  "li",
  "ol",
  "option",
  "p",
  "pre",
  "select",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
]);

const VOID_TAGS = new Set(["br", "col", "hr", "img", "input"]);

const GLOBAL_ATTRIBUTES = new Set([
  "aria-label",
  "aria-labelledby",
  "aria-describedby",
  "class",
  "colspan",
  "dir",
  "height",
  "id",
  "lang",
  "role",
  "rowspan",
  "title",
  "width",
]);

const TAG_ATTRIBUTES: Record<string, Set<string>> = {
  a: new Set(["href", "rel", "target"]),
  img: new Set(["alt", "height", "loading", "src", "width"]),
  input: new Set(["autocomplete", "disabled", "inputmode", "maxlength", "name", "placeholder", "readonly", "size", "type", "value"]),
  option: new Set(["disabled", "selected", "value"]),
  select: new Set(["disabled", "name", "size", "value"]),
};

function decodeAttributeValue(value: string) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function escapeAttributeValue(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function isAllowedAttribute(tagName: string, attributeName: string) {
  const normalizedName = attributeName.toLowerCase();
  if (normalizedName.startsWith("on")) return false;
  if (normalizedName === "style") return false;
  if (normalizedName.startsWith("data-")) return true;
  if (normalizedName.startsWith("aria-")) return true;
  return GLOBAL_ATTRIBUTES.has(normalizedName) || Boolean(TAG_ATTRIBUTES[tagName]?.has(normalizedName));
}

function isSafeUrlAttribute(tagName: string, attributeName: string, value: string) {
  const normalizedName = attributeName.toLowerCase();
  if (!["href", "src", "xlink:href", "formaction"].includes(normalizedName)) return true;

  const trimmed = value.trim().replace(/[\u0000-\u001F\u007F\s]+/g, "");
  if (!trimmed) return false;

  const lower = trimmed.toLowerCase();
  if (lower.startsWith("#") || lower.startsWith("/") || lower.startsWith("./") || lower.startsWith("../")) return true;
  if (lower.startsWith("http://") || lower.startsWith("https://") || lower.startsWith("mailto:") || lower.startsWith("tel:")) return true;
  if (tagName === "img" && lower.startsWith("data:image/")) return true;
  return false;
}

function sanitizeAttributes(tagName: string, tag: string) {
  const attributes = tag.replace(/^<\/?[a-zA-Z][a-zA-Z0-9:-]*\b/, "").replace(/\/?>$/, "");
  const sanitized: string[] = [];
  let match: RegExpExecArray | null;

  ATTRIBUTE_PATTERN.lastIndex = 0;
  while ((match = ATTRIBUTE_PATTERN.exec(attributes)) !== null) {
    const name = match[1].toLowerCase();
    if (!isAllowedAttribute(tagName, name)) continue;

    const rawValue = match[2];
    if (rawValue === undefined) {
      sanitized.push(name);
      continue;
    }

    const value = decodeAttributeValue(rawValue);
    if (!isSafeUrlAttribute(tagName, name, value)) continue;
    sanitized.push(`${name}="${escapeAttributeValue(value)}"`);
  }

  return sanitized.length ? ` ${sanitized.join(" ")}` : "";
}

export function sanitizeRichHtml(html: string | null | undefined) {
  if (!html) return "";

  return String(html)
    .replace(SCRIPT_LIKE_BLOCKS, "")
    .replace(HTML_COMMENTS, "")
    .replace(TAG_PATTERN, (tag, rawTagName: string) => {
      const tagName = rawTagName.toLowerCase();
      if (!ALLOWED_TAGS.has(tagName)) return "";

      const isClosingTag = /^<\s*\//.test(tag);
      if (isClosingTag) return VOID_TAGS.has(tagName) ? "" : `</${tagName}>`;

      const attributes = sanitizeAttributes(tagName, tag);
      return `<${tagName}${attributes}>`;
    });
}
