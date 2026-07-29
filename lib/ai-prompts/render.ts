type PromptValue = string | number | boolean | null | undefined | Record<string, unknown> | unknown[];

function readPath(values: Record<string, PromptValue>, path: string) {
  return path.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object" && key in current) return (current as Record<string, unknown>)[key];
    return undefined;
  }, values);
}

function stringifyPromptValue(value: unknown, json: boolean) {
  if (value === undefined || value === null) return "";
  if (json) return JSON.stringify(value, null, 2);
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value, null, 2);
}

export function renderPromptTemplate(template: string, values: Record<string, PromptValue>) {
  return template.replace(/\{\{\s*(json\s+)?([a-zA-Z0-9_.-]+)\s*\}\}/g, (_match, jsonPrefix: string | undefined, key: string) => stringifyPromptValue(readPath(values, key), Boolean(jsonPrefix)));
}
