"use client";

import { Activity, Database, RefreshCw, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui-v2/button";
import type { DbQueryDebugEvent } from "@/lib/db-query-debug/types";

type DebugResponse = {
  ok?: boolean;
  events?: DbQueryDebugEvent[];
};

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatBytes(value: number | null) {
  if (value === null) return "-";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function stringifyPreview(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

export function DbQueryInspector() {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<DbQueryDebugEvent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedEvent = useMemo(() => events.find((event) => event.id === selectedId) ?? events[0] ?? null, [events, selectedId]);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/db-query-debug?limit=120", {
        cache: "no-store",
      });
      const data = (await response.json().catch(() => ({}))) as DebugResponse;
      if (!response.ok || !data.ok) {
        throw new Error("数据库查询日志加载失败。");
      }

      const nextEvents = data.events ?? [];
      setEvents(nextEvents);
      setSelectedId((current) => current && nextEvents.some((event) => event.id === current) ? current : nextEvents[0]?.id ?? null);
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "数据库查询日志加载失败。");
    } finally {
      setLoading(false);
    }
  }, []);

  const clearEvents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/db-query-debug", { method: "DELETE" });
      if (!response.ok) throw new Error("清空失败。");
      setEvents([]);
      setSelectedId(null);
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "清空失败。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const initialLoad = window.setTimeout(() => void loadEvents(), 0);
    const timer = window.setInterval(() => void loadEvents(), 2500);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(timer);
    };
  }, [loadEvents, open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex h-12 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-bold text-[var(--text)] shadow-[var(--shadow-lg)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
      >
        <Database size={18} />
        DB
        {events.length > 0 ? <span className="rounded-full bg-[var(--primary)] px-2 py-0.5 text-xs text-white">{events.length}</span> : null}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 bg-black/35 p-3 backdrop-blur-sm sm:p-5">
          <div className="ml-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] shadow-[var(--shadow-xl)]">
            <div className="flex flex-col gap-3 border-b border-[var(--border)] bg-[var(--card)] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-base font-black">
                  <Activity size={18} className="text-[var(--primary)]" />
                  数据库查询观察器
                </div>
                <p className="mt-1 text-xs text-[var(--text-soft)]">显示 Supabase REST 查询、SQL-like 描述、耗时、返回大小和预览。真实 SQL 仍由 Supabase/PostgREST 生成。</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" size="sm" variant="secondary" onClick={loadEvents} disabled={loading} className="gap-2"><RefreshCw size={15} />刷新</Button>
                <Button type="button" size="sm" variant="secondary" onClick={clearEvents} disabled={loading || events.length === 0} className="gap-2"><Trash2 size={15} />清空</Button>
                <button type="button" onClick={() => setOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text-soft)] transition hover:text-[var(--text)]" aria-label="关闭数据库查询观察器"><X size={17} /></button>
              </div>
            </div>

            {error ? <div className="border-b border-[var(--danger)]/30 bg-[var(--danger-soft)] px-4 py-2 text-sm font-semibold text-[var(--danger)]">{error}</div> : null}

            <div className="grid min-h-0 flex-1 lg:grid-cols-[390px_minmax(0,1fr)]">
              <div className="min-h-0 overflow-y-auto border-b border-[var(--border)] bg-[var(--card)] lg:border-b-0 lg:border-r">
                {events.length === 0 ? (
                  <div className="p-5 text-sm text-[var(--text-soft)]">{loading ? "正在读取查询日志..." : "暂无查询记录。打开页面、点击按钮或刷新后会显示新的数据库查询。"}</div>
                ) : (
                  <div className="divide-y divide-[var(--border)]">
                    {events.map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => setSelectedId(event.id)}
                        className={`block w-full p-3 text-left transition hover:bg-[var(--bg-soft)] ${selectedEvent?.id === event.id ? "bg-[var(--primary-soft)]" : ""}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs font-black uppercase text-[var(--primary)]">{event.operation}</span>
                          <span className="text-[11px] text-[var(--text-faint)]">{formatTime(event.createdAt)}</span>
                        </div>
                        <div className="mt-1 truncate text-sm font-bold text-[var(--text)]">{event.schema ? `${event.schema}.` : ""}{event.table ?? event.restPath}</div>
                        <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-[var(--text-soft)]">
                          <span>{event.method}</span>
                          <span>{event.status ?? "-"}</span>
                          <span>{event.durationMs}ms</span>
                          <span>{formatBytes(event.responseBytes)}</span>
                          <span>{event.responsePreview.rowCount ?? "-"} rows</span>
                          <span>{event.source}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="min-h-0 overflow-y-auto p-4">
                {selectedEvent ? (
                  <div className="space-y-4">
                    <div className="grid gap-2 sm:grid-cols-4">
                      {[
                        ["状态", selectedEvent.ok ? "OK" : "ERROR"],
                        ["耗时", `${selectedEvent.durationMs}ms`],
                        ["大小", formatBytes(selectedEvent.responseBytes)],
                        ["行数", String(selectedEvent.responsePreview.rowCount ?? "-")],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-3">
                          <div className="text-[11px] font-semibold text-[var(--text-faint)]">{label}</div>
                          <div className="mt-1 text-sm font-black text-[var(--text)]">{value}</div>
                        </div>
                      ))}
                    </div>

                    <section className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-4">
                      <h3 className="text-sm font-black text-[var(--text)]">SQL-like</h3>
                      <pre className="mt-3 max-h-44 overflow-auto rounded-[var(--radius-sm)] bg-[var(--bg-soft)] p-3 text-xs leading-5 text-[var(--text)]">{selectedEvent.sqlLike}</pre>
                    </section>

                    <section className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-4">
                      <h3 className="text-sm font-black text-[var(--text)]">请求 URL</h3>
                      <pre className="mt-3 max-h-44 overflow-auto rounded-[var(--radius-sm)] bg-[var(--bg-soft)] p-3 text-xs leading-5 text-[var(--text)]">{selectedEvent.url}</pre>
                    </section>

                    {selectedEvent.requestBodyPreview ? (
                      <section className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-4">
                        <h3 className="text-sm font-black text-[var(--text)]">请求 body 预览</h3>
                        <pre className="mt-3 max-h-52 overflow-auto rounded-[var(--radius-sm)] bg-[var(--bg-soft)] p-3 text-xs leading-5 text-[var(--text)]">{selectedEvent.requestBodyPreview}</pre>
                      </section>
                    ) : null}

                    <section className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-4">
                      <h3 className="text-sm font-black text-[var(--text)]">返回结果预览</h3>
                      <pre className="mt-3 max-h-[420px] overflow-auto rounded-[var(--radius-sm)] bg-[var(--bg-soft)] p-3 text-xs leading-5 text-[var(--text)]">{stringifyPreview(selectedEvent.responsePreview.value) || "-"}</pre>
                    </section>

                    {selectedEvent.error ? (
                      <section className="rounded-[var(--radius-md)] border border-[var(--danger)]/30 bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]">{selectedEvent.error}</section>
                    ) : null}
                  </div>
                ) : (
                  <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center text-sm text-[var(--text-soft)]">选择左侧查询查看详情。</div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
