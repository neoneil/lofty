const BLOCKED_TAGS = /<\/?(?:script|style|iframe|object|embed|link|meta|base|form)[^>]*>/gi;
const EVENT_HANDLER_ATTRIBUTES = /\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const DANGEROUS_URL_ATTRIBUTES = /\s+(href|src|xlink:href|formaction)\s*=\s*(["']?)\s*(javascript:|vbscript:|data:text\/html|data:application\/xhtml\+xml)[^"'\s>]*/gi;
const DANGEROUS_STYLE_EXPRESSIONS = /\s+style\s*=\s*(["'])(?=[\s\S]*?(?:expression\s*\(|javascript:|vbscript:))[\s\S]*?\1/gi;

export function sanitizeRichHtml(html: string | null | undefined) {
  if (!html) return "";

  return String(html)
    .replace(BLOCKED_TAGS, "")
    .replace(EVENT_HANDLER_ATTRIBUTES, "")
    .replace(DANGEROUS_URL_ATTRIBUTES, "")
    .replace(DANGEROUS_STYLE_EXPRESSIONS, "");
}
