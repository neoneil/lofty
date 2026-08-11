import { DB_QUERY_DEBUG_RESPONSE_PREVIEW_BYTES, DB_QUERY_DEBUG_TEXT_PREVIEW_CHARS } from "@/lib/db-query-debug/config";
import type { DbQueryDebugEventInput, DbQueryDebugPreview } from "@/lib/db-query-debug/types";

type QueryMeta = {
  shouldLog: boolean;
  restPath: string;
  schema: string | null;
  table: string | null;
  operation: string;
  sqlLike: string;
};

function getHeaderValue(headers: Headers, names: string[]) {
  for (const name of names) {
    const value = headers.get(name);
    if (value) return value;
  }
  return null;
}

export function getHeadersFromRequest(input: RequestInfo | URL, init?: RequestInit) {
  const headers = new Headers(input instanceof Request ? input.headers : undefined);
  if (init?.headers) {
    new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  }
  return headers;
}

export function getFetchUrl(input: RequestInfo | URL) {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

export function getFetchMethod(input: RequestInfo | URL, init?: RequestInit) {
  return (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
}

export function getRequestBodyPreview(input: RequestInfo | URL, init?: RequestInit) {
  const body = init?.body ?? (input instanceof Request ? input.body : null);
  if (!body) return null;
  if (typeof body === "string") return body.slice(0, 2000);
  if (body instanceof URLSearchParams) return body.toString().slice(0, 2000);
  if (body instanceof FormData) return "[FormData]";
  if (body instanceof Blob) return `[Blob ${body.size} bytes]`;
  return "[stream body]";
}

function parseRestQuery(url: URL, headers: Headers, method: string): QueryMeta {
  const restMarker = "/rest/v1/";
  const restIndex = url.pathname.indexOf(restMarker);
  if (restIndex === -1) {
    return {
      shouldLog: false,
      restPath: url.pathname,
      schema: null,
      table: null,
      operation: "non-db",
      sqlLike: `${method} ${url.pathname}`,
    };
  }

  const restPath = decodeURIComponent(url.pathname.slice(restIndex + restMarker.length));
  const rpcFunctionName = restPath.startsWith("rpc/") ? restPath.replace(/^rpc\//, "") : null;
  const table = rpcFunctionName ?? restPath.split("/").filter(Boolean)[0] ?? null;
  const schema = getHeaderValue(headers, ["accept-profile", "content-profile"]) ?? "public";
  const select = url.searchParams.get("select");
  const order = url.searchParams.get("order");
  const limit = url.searchParams.get("limit");
  const offset = url.searchParams.get("offset");
  const filters: string[] = [];

  url.searchParams.forEach((value, key) => {
    if (["select", "order", "limit", "offset"].includes(key)) return;
    filters.push(`${key} ${value}`);
  });

  let operation = method.toLowerCase();
  let sqlLike = `${method} ${schema}.${table ?? restPath}`;

  if (method === "GET" || method === "HEAD") {
    operation = method === "HEAD" ? "count/head" : "select";
    sqlLike = `select ${select || "*"} from ${schema}.${table ?? restPath}`;
    if (filters.length > 0) sqlLike += ` where ${filters.join(" and ")}`;
    if (order) sqlLike += ` order by ${order}`;
    if (limit) sqlLike += ` limit ${limit}`;
    if (offset) sqlLike += ` offset ${offset}`;
  } else if (restPath.startsWith("rpc/")) {
    operation = "rpc";
    sqlLike = `rpc ${schema}.${rpcFunctionName ?? restPath.replace(/^rpc\//, "")}`;
  } else if (method === "POST") {
    operation = "insert";
    sqlLike = `insert into ${schema}.${table ?? restPath}`;
  } else if (method === "PATCH") {
    operation = "update";
    sqlLike = `update ${schema}.${table ?? restPath}`;
    if (filters.length > 0) sqlLike += ` where ${filters.join(" and ")}`;
  } else if (method === "DELETE") {
    operation = "delete";
    sqlLike = `delete from ${schema}.${table ?? restPath}`;
    if (filters.length > 0) sqlLike += ` where ${filters.join(" and ")}`;
  }

  return {
    shouldLog: true,
    restPath,
    schema,
    table,
    operation,
    sqlLike,
  };
}

export function buildQueryMeta(rawUrl: string, headers: Headers, method: string) {
  try {
    return parseRestQuery(new URL(rawUrl), headers, method);
  } catch {
    return {
      shouldLog: false,
      restPath: rawUrl,
      schema: null,
      table: null,
      operation: "unknown",
      sqlLike: `${method} ${rawUrl}`,
    };
  }
}

function summarizeJson(value: unknown): DbQueryDebugPreview {
  if (Array.isArray(value)) {
    return {
      kind: "json",
      rowCount: value.length,
      value: value.slice(0, 8),
    };
  }

  return {
    kind: "json",
    rowCount: value && typeof value === "object" ? 1 : null,
    value,
  };
}

export async function buildResponsePreview(response: Response): Promise<{ preview: DbQueryDebugPreview; bytes: number | null }> {
  if (response.status === 204 || response.status === 205) {
    return { preview: { kind: "empty", rowCount: 0, value: null }, bytes: 0 };
  }

  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > DB_QUERY_DEBUG_RESPONSE_PREVIEW_BYTES) {
    return {
      preview: {
        kind: "omitted",
        rowCount: null,
        value: `Response preview omitted because payload is ${contentLength} bytes.`,
      },
      bytes: contentLength,
    };
  }

  try {
    const text = await response.clone().text();
    const bytes = new TextEncoder().encode(text).length;
    if (!text) {
      return { preview: { kind: "empty", rowCount: 0, value: null }, bytes };
    }

    try {
      return { preview: summarizeJson(JSON.parse(text)), bytes };
    } catch {
      return {
        preview: {
          kind: "text",
          rowCount: null,
          value: text.slice(0, DB_QUERY_DEBUG_TEXT_PREVIEW_CHARS),
        },
        bytes,
      };
    }
  } catch (error) {
    return {
      preview: {
        kind: "omitted",
        rowCount: null,
        value: error instanceof Error ? error.message : "Unable to read response preview.",
      },
      bytes: null,
    };
  }
}

export function buildDebugEventInput({
  source,
  input,
  init,
  response,
  durationMs,
  responsePreview,
  responseBytes,
  error,
}: {
  source: DbQueryDebugEventInput["source"];
  input: RequestInfo | URL;
  init?: RequestInit;
  response: Response | null;
  durationMs: number;
  responsePreview: DbQueryDebugPreview;
  responseBytes: number | null;
  error: string | null;
}): DbQueryDebugEventInput | null {
  const url = getFetchUrl(input);
  const method = getFetchMethod(input, init);
  const headers = getHeadersFromRequest(input, init);
  const meta = buildQueryMeta(url, headers, method);
  if (!meta.shouldLog) return null;

  return {
    source,
    method,
    operation: meta.operation,
    schema: meta.schema,
    table: meta.table,
    url,
    restPath: meta.restPath,
    sqlLike: meta.sqlLike,
    status: response?.status ?? null,
    ok: response?.ok ?? false,
    durationMs,
    requestBodyPreview: getRequestBodyPreview(input, init),
    responseBytes,
    responsePreview,
    error,
  };
}
