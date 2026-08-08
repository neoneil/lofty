"use client";

import { BookOpenCheck, CheckSquare, ChevronDown, GraduationCap, History, Mail, Search, Send, Square, Users } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Input } from "@/components/ui-v2/input";
import { Textarea } from "@/components/ui-v2/textarea";
import type { HomeworkAssignmentHistoryItem, HomeworkExamType, HomeworkStudent } from "@/lib/homework/types";
import { cn } from "@/lib/utils";

const ieltsBooks = Array.from({ length: 12 }, (_, index) => 21 - index);
const ieltsTests = [1, 2, 3, 4];

const pteQuestionTypes = [
  { short: "RA", full: "Read Aloud" },
  { short: "RS", full: "Repeat Sentence" },
  { short: "DI", full: "Describe Image" },
  { short: "RL", full: "Retell Lecture" },
  { short: "ASQ", full: "Answer Short Question" },
  { short: "RTS", full: "Respond to Situation" },
  { short: "SGD", full: "Summarize Group Discussion" },
  { short: "SWT", full: "Summarize Written Text" },
  { short: "Essay", full: "Write Essay" },
  { short: "FIB-RW", full: "Reading & Writing Fill in the Blanks" },
  { short: "RO", full: "Re-order Paragraphs" },
  { short: "FIB-R", full: "Reading Fill in the Blanks" },
  { short: "SST", full: "Summarize Spoken Text" },
  { short: "HIW", full: "Highlight Incorrect Words" },
  { short: "WFD", full: "Write From Dictation" },
];

type SendState = {
  ok: boolean;
  message: string;
  emailSentCount?: number;
  emailFailedCount?: number;
};

type HomeworkHistoryResponse = {
  ok?: boolean;
  message?: string;
  history?: HomeworkAssignmentHistoryItem[];
};

function getStudentName(student: HomeworkStudent) {
  return student.fullName?.trim() || student.email || student.id;
}

function formatDateTime(value: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function appendLine(current: string, line: string) {
  const trimmed = current.trimEnd();
  return `${trimmed}${trimmed ? "\n" : ""}${line}`;
}

export function HomeworkAssignmentClient({ students, tableReady }: { students: HomeworkStudent[]; tableReady: boolean }) {
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [examType, setExamType] = useState<HomeworkExamType>("IELTS");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [sendState, setSendState] = useState<SendState | null>(null);
  const [activeStudentId, setActiveStudentId] = useState("");
  const [historyByStudent, setHistoryByStudent] = useState<Record<string, HomeworkAssignmentHistoryItem[]>>({});
  const [historyLoadingId, setHistoryLoadingId] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [expandedHistoryIds, setExpandedHistoryIds] = useState<string[]>([]);

  const filteredStudents = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return students;
    return students.filter((student) => [student.id, student.fullName, student.email].filter(Boolean).join(" ").toLowerCase().includes(normalized));
  }, [students, query]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allFilteredSelected = filteredStudents.length > 0 && filteredStudents.every((student) => selectedSet.has(student.id));
  const activeStudent = useMemo(() => activeStudentId ? students.find((student) => student.id === activeStudentId) ?? null : null, [activeStudentId, students]);
  const activeHistory = activeStudent ? historyByStudent[activeStudent.id] ?? [] : [];

  const loadStudentHistory = useCallback(async (studentId: string, force = false) => {
    if (!studentId) return;
    if (!force && historyByStudent[studentId]) return;

    setHistoryLoadingId(studentId);
    setHistoryError("");

    try {
      const response = await fetch(`/api/admin/homework/history?student_id=${encodeURIComponent(studentId)}`);
      const data = (await response.json().catch(() => ({}))) as HomeworkHistoryResponse;

      if (!response.ok || !data.ok) {
        setHistoryError(data.message ?? "作业历史加载失败。");
        return;
      }

      setHistoryByStudent((current) => ({ ...current, [studentId]: data.history ?? [] }));
    } catch {
      setHistoryError("作业历史加载失败。");
    } finally {
      setHistoryLoadingId("");
    }
  }, [historyByStudent]);

  function viewStudentHistory(studentId: string) {
    setActiveStudentId(studentId);
    void loadStudentHistory(studentId);
  }

  function toggleStudent(studentId: string) {
    viewStudentHistory(studentId);
    setSelectedIds((current) => current.includes(studentId) ? current.filter((id) => id !== studentId) : [...current, studentId]);
  }

  function toggleHistoryItem(homeworkId: string) {
    setExpandedHistoryIds((current) => current.includes(homeworkId) ? current.filter((id) => id !== homeworkId) : [...current, homeworkId]);
  }

  function toggleAllFiltered() {
    if (allFilteredSelected) {
      setSelectedIds((current) => current.filter((id) => !filteredStudents.some((student) => student.id === id)));
      return;
    }

    setSelectedIds((current) => [...new Set([...current, ...filteredStudents.map((student) => student.id)])]);
  }

  function appendIeltsTask(book: number, test: number) {
    setContent((current) => appendLine(current, `Cambridge IELTS ${book} Test ${test}`));
  }

  function appendPteTask(fullName: string) {
    setContent((current) => appendLine(current, fullName));
  }

  async function sendHomework() {
    setSending(true);
    setSendState(null);

    const response = await fetch("/api/admin/homework/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentIds: selectedIds, examType, content }),
    });
    const data = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string; assignedCount?: number; emailSentCount?: number; emailFailedCount?: number };

    if (!response.ok || !data.ok) {
      setSendState({ ok: false, message: data.message ?? "作业发送失败。" });
      setSending(false);
      return;
    }

    setSendState({ ok: true, message: `已发送给 ${data.assignedCount ?? selectedIds.length} 名学生。`, emailSentCount: data.emailSentCount, emailFailedCount: data.emailFailedCount });
    if (activeStudentId && selectedIds.includes(activeStudentId)) {
      await loadStudentHistory(activeStudentId, true);
    }
    setSending(false);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
      <section className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
        <div className="border-b border-[var(--border)] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2"><Users size={18} className="text-[var(--primary)]" /><h2 className="font-bold text-[var(--text)]">选择学生</h2></div>
              <p className="mt-1 text-xs text-[var(--text-soft)]">{students.length} 名学生 · 已选择 {selectedIds.length} 名</p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={toggleAllFiltered}>{allFilteredSelected ? "取消全选" : "全选当前"}</Button>
          </div>

          <div className="relative mt-4">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索学生姓名或邮箱" className="pl-9" />
          </div>
        </div>

        <div className="max-h-[620px] space-y-2 overflow-y-auto p-3 sm:p-4">
          {filteredStudents.length === 0 ? (
            <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--bg-soft)] p-5 text-center text-sm text-[var(--text-soft)]">没有匹配的学生。</div>
          ) : filteredStudents.map((student) => {
            const selected = selectedSet.has(student.id);
            const active = activeStudent?.id === student.id;
            const name = getStudentName(student);
            return (
              <div key={student.id} className={cn("flex w-full items-stretch rounded-[var(--radius-md)] border text-left transition", selected ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "border-[var(--border)] bg-[var(--card)] hover:bg-[var(--bg-soft)]", active ? "shadow-[inset_3px_0_0_var(--primary)]" : "")}>
                <button type="button" onClick={() => viewStudentHistory(student.id)} className="flex min-w-0 flex-1 items-center gap-3 p-3 text-left">
                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border bg-cover bg-center text-xs font-black", selected ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text-soft)]")} style={student.avatarUrl ? { backgroundImage: `url(${student.avatarUrl})` } : undefined} aria-label={name}>{student.avatarUrl ? null : name.slice(0, 1).toUpperCase()}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-[var(--text)]">{name}</span><span className="mt-0.5 block truncate text-xs text-[var(--text-soft)]">{student.email || student.id}</span><span className="mt-1 block text-[11px] font-semibold text-[var(--primary)]">{active ? "正在查看历史" : "点击查看历史"}</span></span>
                </button>
                <button type="button" onClick={() => toggleStudent(student.id)} className="flex w-11 shrink-0 items-center justify-center border-l border-[var(--border)] text-[var(--text-faint)] transition hover:bg-[var(--card)] hover:text-[var(--primary)]" aria-label={selected ? "取消选择学生" : "选择学生"}>
                  {selected ? <CheckSquare size={18} className="text-[var(--primary)]" /> : <Square size={18} />}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-5">
        <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)] sm:p-5">
          <div className="flex flex-col gap-3 border-b border-[var(--border)] pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2"><History size={18} className="text-[var(--primary)]" /><h2 className="font-bold text-[var(--text)]">学生作业历史</h2></div>
              <p className="mt-1 text-sm text-[var(--text-soft)]">{activeStudent ? `当前查看：${getStudentName(activeStudent)}` : "点击左侧学生后查看历史作业。"}</p>
            </div>
            {activeStudent ? <Badge variant="secondary">{historyLoadingId === activeStudent.id ? "加载中" : `${activeHistory.length} records`}</Badge> : null}
          </div>

          {!activeStudent ? (
            <div className="mt-4 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--bg-soft)] p-5 text-center text-sm text-[var(--text-soft)]">暂无学生可查看。</div>
          ) : historyError ? (
            <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-4 py-3 text-sm font-semibold text-[var(--danger)]">{historyError}</div>
          ) : historyLoadingId === activeStudent.id && !historyByStudent[activeStudent.id] ? (
            <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-5 text-sm text-[var(--text-soft)]">正在加载历史作业...</div>
          ) : activeHistory.length === 0 ? (
            <div className="mt-4 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--bg-soft)] p-5 text-center text-sm text-[var(--text-soft)]">这个学生还没有历史作业。</div>
          ) : (
            <div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {activeHistory.map((item, index) => {
                const expanded = expandedHistoryIds.includes(item.id);
                return (
                  <article key={item.id} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)]">
                    <button type="button" onClick={() => toggleHistoryItem(item.id)} className="flex w-full items-start justify-between gap-3 p-3 text-left transition hover:bg-[var(--card)]">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={item.examType === "IELTS" ? "success" : item.examType === "PTE" ? "default" : "secondary"}>{item.examType}</Badge>
                          <span className="text-xs font-semibold text-[var(--text-faint)]">#{activeHistory.length - index}</span>
                          <span className="text-xs text-[var(--text-faint)]">{formatDateTime(item.createdAt)}</span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-[var(--text)]">{item.content}</p>
                      </div>
                      <ChevronDown size={18} className={cn("mt-1 shrink-0 text-[var(--text-soft)] transition", expanded ? "rotate-180 text-[var(--primary)]" : "")} />
                    </button>
                    {expanded ? (
                      <div className="border-t border-[var(--border)] bg-[var(--card)] p-3">
                        <div className="grid gap-2 text-xs text-[var(--text-soft)] sm:grid-cols-3">
                          <div><span className="font-semibold text-[var(--text)]">状态：</span>{item.status}</div>
                          <div><span className="font-semibold text-[var(--text)]">邮件：</span>{item.emailSentAt ? "已发送" : item.emailError ? "发送失败" : "未记录"}</div>
                          <div><span className="font-semibold text-[var(--text)]">时间：</span>{formatDateTime(item.emailSentAt ?? item.createdAt)}</div>
                        </div>
                        {item.emailError ? <div className="mt-2 rounded-[var(--radius-sm)] border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-3 py-2 text-xs text-[var(--danger)]">{item.emailError}</div> : null}
                        <div className="mt-3 whitespace-pre-wrap rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] p-3 text-sm leading-7 text-[var(--text)]">{item.content}</div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)] sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2"><GraduationCap size={18} className="text-[var(--primary)]" /><h2 className="font-bold text-[var(--text)]">作业内容</h2></div>
              <p className="mt-1 text-sm text-[var(--text-soft)]">手动输入，或通过下方 IELTS / PTE 快捷按钮添加任务名称。</p>
            </div>
            <div className="flex rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-1">
              {(["IELTS", "PTE", "General"] as HomeworkExamType[]).map((type) => (
                <button key={type} type="button" onClick={() => setExamType(type)} className={cn("h-9 rounded-[var(--radius-sm)] px-4 text-sm font-bold transition", examType === type ? "bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]" : "text-[var(--text-soft)] hover:bg-[var(--card)] hover:text-[var(--text)]")}>{type === "General" ? "其它" : type}</button>
              ))}
            </div>
          </div>

          <Textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="例如：Cambridge IELTS 21 Test 1&#10;完成 Reading Passage 1-3，错题截图发给老师。&#10;或：Repeat Sentence 每天练习 20 题。" className="mt-4 min-h-[260px] resize-y" />

          <div className="mt-4 grid gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-soft)] p-3">
            {examType === "IELTS" ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--text)]"><BookOpenCheck size={16} className="text-[var(--success)]" />剑桥雅思快捷任务</div>
                <div className="max-h-72 overflow-y-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-3">
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {ieltsBooks.flatMap((book) => ieltsTests.map((test) => (
                      <button key={`${book}-${test}`} type="button" onClick={() => appendIeltsTask(book, test)} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-2 text-left text-xs font-bold text-[var(--text)] transition hover:border-[var(--primary)]/40 hover:bg-[var(--primary-soft)]">Cambridge IELTS {book} <span className="text-[var(--primary)]">Test {test}</span></button>
                    )))}
                  </div>
                </div>
              </div>
            ) : examType === "PTE" ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--text)]"><BookOpenCheck size={16} className="text-[var(--primary)]" />PTE 题型快捷任务</div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {pteQuestionTypes.map((type) => <button key={type.short} type="button" onClick={() => appendPteTask(type.full)} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-left transition hover:border-[var(--primary)]/40 hover:bg-[var(--primary-soft)]"><span className="block text-xs font-black text-[var(--primary)]">{type.short}</span><span className="mt-0.5 block text-xs font-semibold text-[var(--text)]">{type.full}</span></button>)}
                </div>
              </div>
            ) : (
              <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--text-soft)]">其它类型作业可以直接在上方输入内容。</div>
            )}
          </div>

          {sendState ? (
            <div className={cn("mt-4 rounded-[var(--radius-md)] border px-4 py-3 text-sm", sendState.ok ? "border-[var(--success)]/30 bg-[var(--success-soft)] text-[var(--success)]" : "border-[var(--danger)]/30 bg-[var(--danger-soft)] text-[var(--danger)]")}>
              <div className="font-bold">{sendState.message}</div>
              {sendState.ok ? <div className="mt-1 text-xs">邮件成功 {sendState.emailSentCount ?? 0} 封 · 邮件失败 {sendState.emailFailedCount ?? 0} 封</div> : null}
            </div>
          ) : null}

          {!tableReady ? <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--warning)]/30 bg-[var(--warning-soft)] px-4 py-3 text-sm font-semibold text-[var(--warning)]">数据库表还没有创建。请先在 Supabase SQL Editor 执行本次 migration SQL。</div> : null}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2 text-xs text-[var(--text-soft)]"><Badge variant="secondary">{selectedIds.length} students</Badge><Badge variant="secondary">{examType}</Badge><Badge variant={content.trim() ? "success" : "secondary"}>{content.trim() ? "Content Ready" : "No Content"}</Badge></div>
            <Button type="button" disabled={sending || selectedIds.length === 0 || !content.trim() || !tableReady} onClick={sendHomework} className="gap-2"><Send size={16} />{sending ? "发送中..." : "发送作业和邮件"}</Button>
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--text-soft)] shadow-[var(--shadow-sm)]">
          <div className="flex items-start gap-3"><Mail size={18} className="mt-0.5 text-[var(--primary)]" /><p>发送后，学生的小铃铛会收到通知，同时系统会尝试通过 Resend 给学生邮箱发送作业邮件。学生可以在“我的作业”页面查看所有历史作业。</p></div>
        </div>
      </section>
    </div>
  );
}
