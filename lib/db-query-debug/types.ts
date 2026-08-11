export type DbQueryDebugPreview = {
  kind: "json" | "text" | "empty" | "omitted";
  rowCount: number | null;
  value: unknown;
};

export type DbQueryDebugEvent = {
  id: string;
  createdAt: string;
  source: "server" | "admin" | "browser";
  method: string;
  operation: string;
  schema: string | null;
  table: string | null;
  url: string;
  restPath: string;
  sqlLike: string;
  status: number | null;
  ok: boolean;
  durationMs: number;
  requestBodyPreview: string | null;
  responseBytes: number | null;
  responsePreview: DbQueryDebugPreview;
  error: string | null;
};

export type DbQueryDebugEventInput = Omit<DbQueryDebugEvent, "id" | "createdAt">;
