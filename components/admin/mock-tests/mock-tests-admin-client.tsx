"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, Clock3, FileText, Loader2, Mail, Save, Search, Send, XCircle } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui-v2/card";
import { Input } from "@/components/ui-v2/input";
import { Textarea } from "@/components/ui-v2/textarea";
import type { AdminMockAttemptDetail, AdminMockAttemptListItem } from "@/lib/mock-test/admin";
import { cn } from "@/lib/utils";

type DetailResponse = {
  ok?: boolean;
  message?: string;
  detail?: AdminMockAttemptDetail;
};

type ScoreDraft = {
  overallScore: string;
  sectionScores: string;
  scoreSummary: string;
};

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status: string) {
  if (status === "in_progress") return "进行中";
  if (status === "submitted") return "已提交";
  if (status === "scored") return "已评分";
  if (status === "needs_review") return "需复查";
  if (status === "abandoned") return "已退出";
  return status;
}

export function MockTestsAdminClient({ attempts }: { attempts: AdminMockAttemptListItem[] }) {
  const [attemptItems, setAttemptItems] = useState(attempts);
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState(attempts[0]?.id ?? "");
  const [details, setDetails] = useState<Record<string, AdminMockAttemptDetail>>({});
  const [loadingId, setLoadingId] = useState("");
  const [publishingId, setPublishingId] = useState("");
  const [savingScoreId, setSavingScoreId] = useState("");
  const [error, setError] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, ScoreDraft>>({});
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return attemptItems;
    return attemptItems.filter((attempt) => [attempt.studentName, attempt.studentEmail, attempt.title, attempt.examType, attempt.status].filter(Boolean).join(" ").toLowerCase().includes(normalized));
  }, [attemptItems, query]);
  const activeAttempt = attemptItems.find((attempt) => attempt.id === activeId) ?? attemptItems[0] ?? null;
  const activeDetail = activeAttempt ? details[activeAttempt.id] : null;

  async function loadDetail(attemptId: string) {
    setActiveId(attemptId);
    if (details[attemptId]) return;
    setLoadingId(attemptId);
    setError("");
    try {
      const response = await fetch(`/api/admin/mock-tests/${attemptId}`);
      const data = (await response.json().catch(() => ({}))) as DetailResponse;
      if (!response.ok || !data.ok || !data.detail) throw new Error(data.message || "加载失败");
      setDetails((current) => ({ ...current, [attemptId]: data.detail as AdminMockAttemptDetail }));
      setNotes((current) => ({ ...current, [attemptId]: data.detail?.adminReportNote ?? current[attemptId] ?? "" }));
      setScoreDrafts((current) => ({ ...current, [attemptId]: draftFromDetail(data.detail as AdminMockAttemptDetail) }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "加载失败");
    } finally {
      setLoadingId("");
    }
  }

  function toggleAnswer(id: string) {
    setExpandedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function publishReport(attemptId: string) {
    setPublishingId(attemptId);
    setError("");
    try {
      const response = await fetch(`/api/admin/mock-tests/${attemptId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: notes[attemptId] ?? "" }),
      });
      const data = (await response.json().catch(() => ({}))) as DetailResponse;
      if (!response.ok || !data.ok || !data.detail) throw new Error(data.message || "发布失败");
      setDetails((current) => ({ ...current, [attemptId]: data.detail as AdminMockAttemptDetail }));
      setAttemptItems((current) => current.map((item) => item.id === attemptId ? {
        ...item,
        status: data.detail?.status ?? item.status,
        overallBand: data.detail?.overallBand ?? item.overallBand,
        pteOverallScore: data.detail?.pteOverallScore ?? item.pteOverallScore,
        scoreEmailSentAt: data.detail?.scoreEmailSentAt ?? item.scoreEmailSentAt,
        studentReportPublishedAt: data.detail?.studentReportPublishedAt ?? item.studentReportPublishedAt,
      } : item));
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : "发布失败");
    } finally {
      setPublishingId("");
    }
  }

  async function saveScores(attemptId: string) {
    const draft = scoreDrafts[attemptId];
    if (!draft) return;
    setSavingScoreId(attemptId);
    setError("");
    try {
      const response = await fetch(`/api/admin/mock-tests/${attemptId}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = (await response.json().catch(() => ({}))) as DetailResponse;
      if (!response.ok || !data.ok || !data.detail) throw new Error(data.message || "保存评分失败");
      setDetails((current) => ({ ...current, [attemptId]: data.detail as AdminMockAttemptDetail }));
      setScoreDrafts((current) => ({ ...current, [attemptId]: draftFromDetail(data.detail as AdminMockAttemptDetail) }));
      setAttemptItems((current) => current.map((item) => item.id === attemptId ? {
        ...item,
        status: data.detail?.status ?? item.status,
        overallBand: data.detail?.overallBand ?? item.overallBand,
        pteOverallScore: data.detail?.pteOverallScore ?? item.pteOverallScore,
      } : item));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "保存评分失败");
    } finally {
      setSavingScoreId("");
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card className="xl:sticky xl:top-5 xl:self-start">
        <CardHeader className="px-4 pt-4">
          <div>
            <CardTitle>模考记录</CardTitle>
            <CardDescription>{attemptItems.length} 条 IELTS / PTE attempt</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索学生、邮箱、考试" className="pl-9" />
          </div>
          <div className="mt-3 max-h-[680px] space-y-2 overflow-y-auto">
            {filtered.map((attempt) => (
              <button key={attempt.id} type="button" onClick={() => void loadDetail(attempt.id)} className={cn("w-full rounded-[var(--radius-md)] border p-3 text-left transition", activeAttempt?.id === attempt.id ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "border-[var(--border)] bg-[var(--bg-soft)] hover:border-[var(--primary)]/40")}>
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={attempt.examType === "ielts" ? "success" : "default"}>{attempt.examType.toUpperCase()}</Badge>
                  <span className="text-xs font-semibold text-[var(--text-soft)]">{statusLabel(attempt.status)}</span>
                </div>
                <div className="mt-2 truncate text-sm font-bold text-[var(--text)]">{attempt.studentName}</div>
                <div className="mt-1 truncate text-xs text-[var(--text-soft)]">{attempt.title}</div>
                <div className="mt-2 flex items-center gap-2 text-xs text-[var(--text-faint)]"><Clock3 size={13} />{formatDate(attempt.submittedAt ?? attempt.createdAt)}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        {!activeAttempt ? (
          <Card><CardContent className="p-8 text-center text-sm text-[var(--text-soft)]">暂无模考记录。</CardContent></Card>
        ) : (
          <>
            <Card>
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><Badge>{activeAttempt.examType.toUpperCase()}</Badge><Badge variant="secondary">{statusLabel(activeAttempt.status)}</Badge>{activeAttempt.scoreEmailSentAt ? <Badge variant="success"><Mail size={12} className="mr-1" />已发邮件</Badge> : null}{activeAttempt.studentReportPublishedAt ? <Badge variant="success">已发布报告</Badge> : null}</div>
                    <h1 className="mt-3 text-2xl font-bold text-[var(--text)]">{activeAttempt.title}</h1>
                    <p className="mt-2 text-sm text-[var(--text-soft)]">{activeAttempt.studentName} · {activeAttempt.studentEmail || activeAttempt.userId}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <MiniStat label="Answered" value={activeAttempt.answeredCount} />
                    <MiniStat label="Correct" value={activeAttempt.correctCount} />
                    <MiniStat label="Score" value={activeAttempt.overallBand ?? activeAttempt.pteOverallScore ?? "-"} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {error ? <div className="rounded-[var(--radius-md)] border border-[var(--danger)]/30 bg-[var(--danger-soft)] p-4 text-sm font-semibold text-[var(--danger)]">{error}</div> : null}
            {loadingId === activeAttempt.id ? <Card><CardContent className="flex items-center gap-2 p-5 text-sm text-[var(--text-soft)]"><Loader2 size={16} className="animate-spin" />正在加载详情...</CardContent></Card> : null}

            {activeDetail ? (
              <>
                <Card>
                  <CardHeader className="px-4 pt-4">
                    <div>
                      <CardTitle>确认评分</CardTitle>
                      <CardDescription>PTE 可先手动录入总分和评分摘要；IELTS 可修正自动换算后的总分。</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 p-4">
                    <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)_minmax(0,1fr)]">
                      <Input value={scoreDrafts[activeDetail.id]?.overallScore ?? ""} onChange={(event) => setScoreDrafts((current) => ({ ...current, [activeDetail.id]: { ...(current[activeDetail.id] ?? draftFromDetail(activeDetail)), overallScore: event.target.value } }))} placeholder={activeDetail.examType === "ielts" ? "IELTS Overall Band" : "PTE Overall Score"} />
                      <Textarea value={scoreDrafts[activeDetail.id]?.sectionScores ?? ""} onChange={(event) => setScoreDrafts((current) => ({ ...current, [activeDetail.id]: { ...(current[activeDetail.id] ?? draftFromDetail(activeDetail)), sectionScores: event.target.value } }))} className="min-h-28 font-mono text-xs" />
                      <Textarea value={scoreDrafts[activeDetail.id]?.scoreSummary ?? ""} onChange={(event) => setScoreDrafts((current) => ({ ...current, [activeDetail.id]: { ...(current[activeDetail.id] ?? draftFromDetail(activeDetail)), scoreSummary: event.target.value } }))} className="min-h-28 font-mono text-xs" />
                    </div>
                    <div className="flex justify-end">
                      <Button type="button" variant="secondary" onClick={() => void saveScores(activeDetail.id)} disabled={savingScoreId === activeDetail.id} className="gap-2">
                        {savingScoreId === activeDetail.id ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        保存评分
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="px-4 pt-4">
                    <div>
                      <CardTitle>发布成绩</CardTitle>
                      <CardDescription>手动确认后发送邮件，并把完整报告发布到学生账户。</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 p-4">
                    <Textarea value={notes[activeDetail.id] ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [activeDetail.id]: event.target.value }))} placeholder="可选：给学生报告附加一段老师备注。" className="min-h-24" />
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-[var(--text-soft)]">{activeDetail.studentReportPublishedAt ? `已发布：${formatDate(activeDetail.studentReportPublishedAt)}` : "发布后，学生可在模考中心查看完整报告并打印保存。"}</p>
                      <Button type="button" onClick={() => void publishReport(activeDetail.id)} disabled={publishingId === activeDetail.id || !activeDetail.studentEmail} className="gap-2">
                        {publishingId === activeDetail.id ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        {activeDetail.studentReportPublishedAt ? "重新发送并更新发布" : "确认发送成绩"}
                      </Button>
                    </div>
                    {!activeDetail.studentEmail ? <p className="text-sm font-semibold text-[var(--danger)]">该学生没有邮箱，无法发送成绩邮件。</p> : null}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="px-4 pt-4">
                    <div>
                      <CardTitle>成绩摘要</CardTitle>
                      <CardDescription>section_scores / score_summary</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-3 p-4 lg:grid-cols-2">
                    <JsonPanel title="Section Scores" data={activeDetail.sectionScores} />
                    <JsonPanel title="Score Summary" data={activeDetail.scoreSummary} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="px-4 pt-4">
                    <div>
                      <CardTitle>题目与答案</CardTitle>
                      <CardDescription>点击展开查看学生答案、正确答案和评分详情。</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 p-4">
                    {activeDetail.answers.map((answer) => {
                      const expanded = expandedIds.includes(answer.id);
                      return (
                        <article key={answer.id} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)]">
                          <button type="button" onClick={() => toggleAnswer(answer.id)} className="flex w-full items-start justify-between gap-3 p-3 text-left">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="secondary">{answer.sectionKey}</Badge>
                                <Badge>{answer.questionKey}</Badge>
                                {answer.score?.isCorrect === true ? <Badge variant="success"><CheckCircle2 size={12} className="mr-1" />正确</Badge> : answer.score?.isCorrect === false ? <Badge variant="danger"><XCircle size={12} className="mr-1" />错误</Badge> : <Badge variant="warning">待评分</Badge>}
                              </div>
                              <div className="mt-2 line-clamp-2 text-sm font-semibold text-[var(--text)]">{answer.responseText || "未作答"}</div>
                            </div>
                            <ChevronDown size={18} className={cn("mt-1 shrink-0 transition", expanded ? "rotate-180 text-[var(--primary)]" : "text-[var(--text-soft)]")} />
                          </button>
                          {expanded ? (
                            <div className="space-y-3 border-t border-[var(--border)] bg-[var(--card)] p-3">
                              <DetailRow label="题目类型" value={answer.questionType} />
                              <DetailRow label="学生答案" value={answer.responseText || JSON.stringify(answer.response)} />
                              <DetailRow label="正确答案" value={stringifyShort(answer.score?.answerKeySnapshot)} />
                              <JsonPanel title="题目快照" data={answer.questionSnapshot} />
                              <JsonPanel title="评分详情" data={answer.score?.scoreDetail ?? {}} />
                              <JsonPanel title="AI / 老师反馈" data={answer.score?.feedback ?? {}} />
                              {answer.responseFiles.length > 0 ? <RecordingPanel files={answer.responseFiles} /> : null}
                            </div>
                          ) : null}
                        </article>
                      );
                    })}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card><CardContent className="p-5 text-sm text-[var(--text-soft)]">点击左侧记录加载题目与答案详情。</CardContent></Card>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3"><div className="text-lg font-bold text-[var(--text)]">{value}</div><div className="mt-1 text-[11px] uppercase tracking-wide text-[var(--text-faint)]">{label}</div></div>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-2 text-sm"><span className="font-bold text-[var(--text)]">{label}：</span><span className="text-[var(--text-soft)]">{value}</span></div>;
}

function JsonPanel({ title, data }: { title: string; data: unknown }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[var(--text-soft)]"><FileText size={13} />{title}</div>
      <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-[var(--text)]">{JSON.stringify(data ?? {}, null, 2)}</pre>
    </div>
  );
}

function RecordingPanel({ files }: { files: Array<Record<string, unknown>> }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[var(--text-soft)]"><FileText size={13} />录音/文件</div>
      <div className="space-y-2">
        {files.map((file, index) => {
          const url = typeof file.playbackUrl === "string" ? file.playbackUrl : "";
          return (
            <div key={`${String(file.key ?? index)}`} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] p-2">
              {url ? <audio src={url} controls className="w-full" /> : null}
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-[var(--text)]">{JSON.stringify(file, null, 2)}</pre>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function stringifyShort(value: unknown) {
  if (!value) return "-";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function draftFromDetail(detail: AdminMockAttemptDetail): ScoreDraft {
  return {
    overallScore: String(detail.examType === "ielts" ? detail.overallBand ?? "" : detail.pteOverallScore ?? ""),
    sectionScores: JSON.stringify(detail.sectionScores ?? {}, null, 2),
    scoreSummary: JSON.stringify(detail.scoreSummary ?? {}, null, 2),
  };
}
