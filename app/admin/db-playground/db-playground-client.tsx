"use client";

import { useState, useTransition } from "react";
import type { WfdTempRow } from "./page";

type EditableField = "question_text" | "is_prediction";

type Props = {
  rows: WfdTempRow[];
  error: string | null;
  updateField: (formData: FormData) => void;
  deleteRow: (formData: FormData) => void;
};

function getValue(row: WfdTempRow, field: EditableField): string {
  const value = row[field];

  if (field === "is_prediction") {
    return value === true ? "true" : "false";
  }

  return typeof value === "string" ? value : "";
}

export default function DbPlaygroundClient({ rows, error, updateField, deleteRow }: Props) {
  const [editing, setEditing] = useState<{ id: string; field: EditableField } | null>(null);
  const [value, setValue] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function startEdit(row: WfdTempRow, field: EditableField) {
    setEditing({ id: row.id, field });
    setValue(getValue(row, field));
  }

  function cancelEdit() {
    setEditing(null);
    setValue("");
  }

  function submitUpdate(id: string, field: EditableField) {
    const formData = new FormData();

    formData.set("id", id);
    formData.set("field", field);
    formData.set("value", value);

    startTransition(() => {
      updateField(formData);
      cancelEdit();
    });
  }

  function submitDelete(id: string) {
    const confirmed = window.confirm("确定删除这一条数据吗？");

    if (!confirmed) return;

    const formData = new FormData();

    formData.set("id", id);

    startTransition(() => {
      deleteRow(formData);
    });
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] p-4 sm:p-5">
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <div className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 shadow-[var(--shadow-sm)]">
          <h1 className="text-lg font-semibold text-[var(--text)]">WFD Temp 管理</h1>
          <p className="mt-1 text-xs text-[var(--text-soft)]">当前显示 {rows.length} 条，只展开时显示操作。</p>

          {error ? <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div> : null}
        </div>

        <div className="grid gap-2">
          {rows.map((row, index) => {
            const isOpen = openId === row.id;

            return (
              <article key={row.id} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 shadow-[var(--shadow-sm)]">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-xs font-semibold text-[var(--primary)]">{index + 1}</div>

                  <button type="button" onClick={() => setOpenId(isOpen ? null : row.id)} className="min-w-0 flex-1 text-left">
                    <p className="line-clamp-2 whitespace-pre-wrap break-words text-sm leading-5 text-[var(--text)]">{row.question_text || "-"}</p>
                  </button>

                  <button type="button" onClick={() => setOpenId(isOpen ? null : row.id)} className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--bg)] px-3 py-1 text-xs font-medium text-[var(--text-soft)] hover:bg-white">{isOpen ? "收起" : "展开"}</button>
                </div>

                {isOpen ? (
                  <div className="mt-3 space-y-3 border-t border-[var(--border)] pt-3">
                    <section className="rounded-xl bg-[var(--bg)] p-3">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="text-xs font-semibold text-[var(--text)]">Text</div>
                        <button type="button" onClick={() => startEdit(row, "question_text")} className="rounded-full bg-[var(--primary)] px-3 py-1 text-xs font-medium text-white hover:bg-[var(--primary-hover)]">Update</button>
                      </div>

                      {editing?.id === row.id && editing.field === "question_text" ? (
                        <div className="space-y-2">
                          <textarea value={value} onChange={(event) => setValue(event.target.value)} className="min-h-24 w-full rounded-xl border border-[var(--border)] bg-white p-3 text-sm outline-none focus:border-[var(--primary)]" />
                          <div className="flex gap-2">
                            <button type="button" onClick={() => submitUpdate(row.id, "question_text")} disabled={isPending} className="rounded-full bg-[var(--primary)] px-4 py-1.5 text-xs font-medium text-white hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50">确定</button>
                            <button type="button" onClick={cancelEdit} className="rounded-full border border-[var(--border)] bg-white px-4 py-1.5 text-xs font-medium text-[var(--text)] hover:bg-[var(--bg)]">取消</button>
                          </div>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap break-words text-sm leading-5 text-[var(--text)]">{row.question_text || "-"}</p>
                      )}
                    </section>

                    <section className="flex items-center justify-between gap-3 rounded-xl bg-[var(--bg)] p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[var(--text)]">isPrediction</span>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${row.is_prediction ? "bg-purple-50 text-purple-700" : "bg-slate-100 text-slate-600"}`}>{row.is_prediction ? "true" : "false"}</span>
                      </div>

                      {editing?.id === row.id && editing.field === "is_prediction" ? (
                        <div className="flex items-center gap-2">
                          <select value={value} onChange={(event) => setValue(event.target.value)} className="h-8 rounded-xl border border-[var(--border)] bg-white px-3 text-xs outline-none focus:border-[var(--primary)]">
                            <option value="true">true</option>
                            <option value="false">false</option>
                          </select>
                          <button type="button" onClick={() => submitUpdate(row.id, "is_prediction")} disabled={isPending} className="rounded-full bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50">确定</button>
                          <button type="button" onClick={cancelEdit} className="rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--text)] hover:bg-white">取消</button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => startEdit(row, "is_prediction")} className="rounded-full bg-[var(--primary)] px-3 py-1 text-xs font-medium text-white hover:bg-[var(--primary-hover)]">Update</button>
                      )}
                    </section>

                    <div className="flex justify-end">
                      <button type="button" onClick={() => submitDelete(row.id)} disabled={isPending} className="rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50">删除整条</button>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}