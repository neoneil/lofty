"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Download, FileText, PenLine, Sparkles } from "lucide-react";
import { AiLoadingLabel } from "@/components/ai/ai-loading-label";
import AiUsageConfirmDialog from "@/components/ai/ai-usage-confirm-dialog";
import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui-v2/card";
import { Input } from "@/components/ui-v2/input";
import { Textarea } from "@/components/ui-v2/textarea";
import type { IELTSTask2ReviewResult, SentenceAnalysis, SentenceIssue, WritingCorrectionItem } from "@/types/ielts-writing";

type CorrectionSpan = { type: "text"; text: string } | { type: "delete"; text: string; change: WritingCorrectionItem } | { type: "insert"; text: string; change: WritingCorrectionItem };

const rubricCards = [
  { key: "task_response", title: "Task Achievement", subtitle: "回应题目与论证完整度" },
  { key: "coherence_and_cohesion", title: "Coherence and Cohesion", subtitle: "段落推进与衔接质量" },
  { key: "lexical_resource", title: "Lexical Resource", subtitle: "词汇准确度与学术表达" },
  { key: "grammatical_range_and_accuracy", title: "Grammatical Range and Accuracy", subtitle: "句式范围与语法准确性" },
] as const;

export default function IELTSWritingPage() {
  const [promptQuestion, setPromptQuestion] = useState("");
  const [essayText, setEssayText] = useState("");
  const [targetBand, setTargetBand] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<IELTSTask2ReviewResult | null>(null);
  const [activeChangeId, setActiveChangeId] = useState<string | null>(null);

  async function handleSubmit() {
    if (!promptQuestion.trim() || !essayText.trim()) {
      setError("请先填写题目和作文。");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setActiveChangeId(null);
    const abortController = new AbortController();
    const timeout = window.setTimeout(() => abortController.abort(), 120_000);

    try {
      const res = await fetch("/api/ielts-writing", { method: "POST", headers: { "Content-Type": "application/json" }, signal: abortController.signal, body: JSON.stringify({ promptQuestion, essayText, feedbackMode: "quick", targetBand: targetBand ? Number(targetBand) : undefined }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setResult(data);
      setActiveChangeId(getCorrectionItems(data)[0]?.change_id ?? null);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("AI 批改超时，请缩短作文或稍后重试。");
      } else {
        setError(err instanceof Error ? err.message : "Unknown error occurred.");
      }
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  }

  const essayWordCount = essayText.trim().split(/\s+/).filter(Boolean).length;
  const correctionItems = useMemo(() => getCorrectionItems(result), [result]);
  const activeChange = correctionItems.find((item) => item.change_id === activeChangeId) ?? correctionItems[0] ?? null;

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 pb-16 pt-28 text-[var(--text)] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-md)]">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_390px]">
            <div className="p-5 sm:p-7">
              <Badge variant="default">IELTS Writing Task 2</Badge>
              <h1 className="mt-5 max-w-3xl text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">雅思大作文 AI 批改与 8 分范文</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--text-soft)] sm:text-base">提交题目与作文后，系统会给出 Word 式动态修改、四项评分、中文解释、思路判断，并基于原思路或优化思路生成 Band 8 范文。</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-4">
                {rubricCards.map((card) => <div key={card.key} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3"><div className="text-xs font-semibold text-[var(--primary)]">{card.title}</div><div className="mt-1 text-xs text-[var(--text-soft)]">{card.subtitle}</div></div>)}
              </div>
            </div>
            <div className="border-t border-[var(--border)] bg-[linear-gradient(135deg,var(--primary-soft),var(--card))] p-5 sm:p-7 lg:border-l lg:border-t-0">
              <div className="grid gap-3">
                <ProcessItem icon={<FileText size={16} />} text="粘贴题目与学生作文" />
                <ProcessItem icon={<PenLine size={16} />} text="生成动态语法纠错与中文解释" />
                <ProcessItem icon={<Sparkles size={16} />} text="输出 Band 8 范文与离线 HTML 报告" />
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="rounded-[var(--radius-xl)]">
            <CardHeader className="flex-col items-start gap-1">
              <CardTitle>提交作文</CardTitle>
              <CardDescription>建议提交完整 Task 2 作文，反馈会更准确。</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(event) => event.preventDefault()} className="space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--text)]">Essay Question</span>
                  <Textarea value={promptQuestion} onChange={(e) => setPromptQuestion(e.target.value)} placeholder="Paste the IELTS Task 2 prompt here..." className="min-h-[120px]" required />
                </label>
                <label className="block">
                  <span className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-[var(--text)]"><span>Student Essay</span><span className="text-xs font-medium text-[var(--text-soft)]">{essayWordCount} words</span></span>
                  <Textarea value={essayText} onChange={(e) => setEssayText(e.target.value)} placeholder="Paste the student's essay here..." className="min-h-[320px]" required />
                </label>
                <div className="grid gap-4 sm:grid-cols-[220px_1fr] sm:items-end">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[var(--text)]">Target Band</span>
                    <Input type="number" min="0" max="9" step="0.5" value={targetBand} onChange={(e) => setTargetBand(e.target.value)} placeholder="e.g. 6.5" />
                  </label>
                  <div className="sticky bottom-0 -mx-5 bg-[var(--card)] px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2 sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-0"><AiUsageConfirmDialog feature="ielts_writing_review" title="确认使用雅思写作 AI 评分" description="本次作文批改会消耗 1 次 AI 评分反馈机会。" onConfirm={handleSubmit}>{(openDialog) => <Button type="button" disabled={loading} fullWidth onClick={() => { if (!promptQuestion.trim() || !essayText.trim()) { setError("请先填写题目和作文。"); return; } openDialog(); }}>{loading ? <AiLoadingLabel text="正在批改，通常 30-90 秒..." /> : "Check Essay"}</Button>}</AiUsageConfirmDialog></div>
                </div>
                {error ? <div className="rounded-[var(--radius-md)] border border-[var(--danger)]/25 bg-[var(--danger-soft)] px-4 py-3 text-sm font-medium text-[var(--danger)]">{error}</div> : null}
              </form>
            </CardContent>
          </Card>

          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <Card className="rounded-[var(--radius-xl)]">
              <CardHeader className="flex-col items-start gap-1">
                <CardTitle>当前输入</CardTitle>
                <CardDescription>提交前快速检查作文长度和目标。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <MetricCard label="Essay Words" value={essayWordCount || "-"} />
                <MetricCard label="Target Band" value={targetBand || "-"} />
                <MetricCard label="Question" value={promptQuestion.trim() ? "Ready" : "Missing"} />
              </CardContent>
            </Card>

            {result ? (
              <Card className="rounded-[var(--radius-xl)] bg-[var(--primary)] text-white">
                <CardHeader className="flex-col items-start gap-1">
                  <CardTitle className="text-white">Overall Score</CardTitle>
                  <CardDescription className="text-white/75">AI estimated IELTS band.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-[var(--radius-lg)] bg-white/12 px-5 py-4 text-center text-4xl font-semibold">{formatBand(result.estimated_overall_band ?? result.overall_band)}</div>
                  <Button type="button" variant="secondary" fullWidth className="gap-2 bg-white text-[var(--primary)] hover:bg-white/90" onClick={() => downloadInteractiveHtml(result, promptQuestion)}><Download size={16} />下载动态 HTML</Button>
                </CardContent>
              </Card>
            ) : null}
          </aside>
        </div>

        {result ? (
          <div className="space-y-6">
            <CorrectionReport result={result} question={promptQuestion} correctionItems={correctionItems} activeChange={activeChange} activeChangeId={activeChangeId} onSelectChange={setActiveChangeId} />
            <EvaluationGrid result={result} />
            <ModelEssayPanel result={result} />
            <StrategyAndRevision result={result} />
          </div>
        ) : null}
      </section>
    </main>
  );
}

function CorrectionReport({ result, question, correctionItems, activeChange, activeChangeId, onSelectChange }: { result: IELTSTask2ReviewResult; question: string; correctionItems: WritingCorrectionItem[]; activeChange: WritingCorrectionItem | null; activeChangeId: string | null; onSelectChange: (changeId: string) => void }) {
  return (
    <Card className="overflow-hidden rounded-[var(--radius-xl)]">
      <div className="flex flex-col items-center justify-center gap-2 border-b border-[var(--border)] bg-[var(--bg-soft)] px-5 py-5 sm:flex-row">
        <span className="text-sm font-semibold text-[var(--text-soft)]">Overall score:</span>
        <span className="min-w-32 rounded-full border border-[var(--primary)]/35 bg-[var(--card)] px-10 py-2 text-center text-2xl font-semibold text-[var(--primary)]">{formatBand(result.estimated_overall_band ?? result.overall_band)}</span>
      </div>
      <SectionBar title="Questions" />
      <div className="border-b border-[var(--border)] bg-[var(--card)] p-5 text-sm leading-7 text-[var(--text-soft)] sm:p-6">{question}</div>
      <SectionBar title="Answer & Correction" />
      <div className="grid lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-h-[420px] border-b border-[var(--border)] p-5 sm:p-6 lg:border-b-0 lg:border-r">
          <div className="space-y-5 text-[15px] leading-8 text-[var(--text)]">
            {result.paragraphs.map((paragraph) => (
              <p key={paragraph.paragraph_id}>
                {paragraph.sentences.map((sentence) => <AnnotatedSentence key={sentence.sentence_id} sentence={sentence} changes={correctionItems.filter((item) => item.sentence_id === sentence.sentence_id)} activeChangeId={activeChangeId} onSelectChange={onSelectChange} />)}
              </p>
            ))}
          </div>
          <div className="mt-5 text-sm font-semibold text-[var(--text-soft)]">({result.word_count} words)</div>
        </div>
        <aside className="max-h-[560px] overflow-y-auto bg-[var(--bg-soft)] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text)]">Revision List</h3>
              <p className="mt-1 text-xs text-[var(--text-soft)]">标签用英文，解释用中文。</p>
            </div>
            <Badge variant="secondary">{correctionItems.length}</Badge>
          </div>
          {activeChange ? <div className="mb-4 rounded-[var(--radius-md)] border border-[var(--primary)]/25 bg-[var(--card)] p-3 text-sm leading-6"><Badge variant={getOperationVariant(activeChange.operation)}>{activeChange.operation}</Badge><p className="mt-2 font-semibold text-[var(--text)]">{activeChange.original_text || activeChange.revised_text}</p><p className="mt-2 text-[var(--text-soft)]">{activeChange.explanation_cn}</p></div> : null}
          <div className="space-y-2">
            {correctionItems.map((item) => <button key={item.change_id} type="button" onClick={() => onSelectChange(item.change_id)} className={`block w-full rounded-[var(--radius-sm)] border px-3 py-2 text-left text-sm transition ${activeChangeId === item.change_id ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/45"}`}><span className="mb-1 inline-flex"><Badge variant={getOperationVariant(item.operation)}>{item.operation}</Badge></span><span className="block truncate font-medium text-[var(--text)]">{item.operation === "Added" ? item.revised_text : item.original_text}</span><span className="mt-1 line-clamp-2 block text-xs leading-5 text-[var(--text-soft)]">{item.explanation_cn}</span></button>)}
          </div>
        </aside>
      </div>
    </Card>
  );
}

function AnnotatedSentence({ sentence, changes, activeChangeId, onSelectChange }: { sentence: SentenceAnalysis; changes: WritingCorrectionItem[]; activeChangeId: string | null; onSelectChange: (changeId: string) => void }) {
  const spans = buildCorrectionSpans(sentence.original_sentence, changes);
  return (
    <span className="mr-1">
      {spans.map((span, index) => {
        if (span.type === "text") return <span key={index}>{span.text}</span>;
        const active = activeChangeId === span.change.change_id;
        if (span.type === "delete") return <button key={index} type="button" onClick={() => onSelectChange(span.change.change_id)} className={`mx-0.5 rounded-[4px] px-0.5 text-[var(--danger)] line-through decoration-2 ${active ? "bg-[var(--danger-soft)] ring-1 ring-[var(--danger)]/35" : "bg-transparent"}`}>{span.text}</button>;
        return <button key={index} type="button" onClick={() => onSelectChange(span.change.change_id)} className={`mx-0.5 rounded-[4px] border-b border-dashed border-[var(--primary)] px-0.5 font-medium text-[var(--primary)] ${active ? "bg-[var(--primary-soft)] ring-1 ring-[var(--primary)]/35" : "bg-transparent"}`}>{span.text}</button>;
      })}{" "}
    </span>
  );
}

function EvaluationGrid({ result }: { result: IELTSTask2ReviewResult }) {
  const scores = result.band_scores;
  return (
    <Card className="overflow-hidden rounded-[var(--radius-xl)]">
      <SectionBar title="Evaluation" />
      <CardContent className="grid gap-5 p-5 md:grid-cols-2 sm:p-6">
        <ScoreCard title="Task Achievement" score={scores.task_response.score} comment={scores.task_response.comment} />
        <ScoreCard title="Coherence and Cohesion" score={scores.coherence_and_cohesion.score} comment={scores.coherence_and_cohesion.comment} />
        <ScoreCard title="Lexical Resource" score={scores.lexical_resource.score} comment={scores.lexical_resource.comment} />
        <ScoreCard title="Grammatical Range and Accuracy" score={scores.grammatical_range_and_accuracy.score} comment={scores.grammatical_range_and_accuracy.comment} />
      </CardContent>
    </Card>
  );
}

function ModelEssayPanel({ result }: { result: IELTSTask2ReviewResult }) {
  const model = result.band8_model_essay;
  const band8Essay = model?.band8_essay || result.final_rewritten_essay.band8_version;
  return (
    <Card className="overflow-hidden rounded-[var(--radius-xl)]">
      <SectionBar title="Band 8 Model Essay" />
      <CardContent className="grid gap-5 p-5 lg:grid-cols-[360px_minmax(0,1fr)] sm:p-6">
        <div className="space-y-4">
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
            <Badge variant={model?.keep_student_core_idea ? "success" : "warning"}>{model?.keep_student_core_idea ? "保留原思路" : "优化原思路"}</Badge>
            <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">{model?.idea_assessment_cn || "系统基于学生作文生成 Band 8 范文。"}</p>
          </div>
          <ListBlock title="现有思路细节表现" items={model?.current_idea_detail_feedback_cn ?? []} />
          <ListBlock title="思路优化" items={model?.improved_thinking_cn ?? result.overall_feedback.priority_actions} />
          <ListBlock title="细节升级建议" items={model?.detail_upgrade_suggestions_cn ?? []} />
          <ListBlock title="为什么达到 Band 8" items={model?.why_band8_cn ?? []} tone="success" />
        </div>
        <article className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card-soft)] p-5 text-sm leading-8 text-[var(--text)]">
          {splitEssayParagraphs(band8Essay).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </article>
      </CardContent>
    </Card>
  );
}

function StrategyAndRevision({ result }: { result: IELTSTask2ReviewResult }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="rounded-[var(--radius-xl)]">
        <CardHeader className="flex-col items-start gap-1">
          <CardTitle>Argument Feedback</CardTitle>
          <CardDescription>论证质量与内容支撑。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoPill label="Main Points Supported" value={result.argument_feedback.main_points_supported ? "Yes" : "No"} />
            <InfoPill label="Support Quality" value={result.argument_feedback.support_quality} />
          </div>
          <p className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 text-sm leading-7 text-[var(--text-soft)]">{result.argument_feedback.comment}</p>
          <div className="grid gap-4 md:grid-cols-2">
            <ListBlock title="Methods Used" items={result.argument_feedback.methods_used} />
            <ListBlock title="Methods Missing" items={result.argument_feedback.methods_missing} />
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-[var(--radius-xl)]">
        <CardHeader className="flex-col items-start gap-1">
          <CardTitle>Revision Plan</CardTitle>
          <CardDescription>下一步最重要的修改顺序。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <PriorityItem label="Priority 1" value={result.revision_plan.priority_1} />
          <PriorityItem label="Priority 2" value={result.revision_plan.priority_2} />
          <PriorityItem label="Priority 3" value={result.revision_plan.priority_3} />
          <PriorityItem label="Next Step" value={result.revision_plan.next_step_advice} featured />
        </CardContent>
      </Card>
    </div>
  );
}

function buildCorrectionSpans(sentence: string, changes: WritingCorrectionItem[]): CorrectionSpan[] {
  let spans: CorrectionSpan[] = [{ type: "text", text: sentence }];
  const usableChanges = changes.filter((change) => change.operation === "Added" || change.original_text.trim());

  usableChanges.forEach((change) => {
    const target = change.original_text.trim();
    if (change.operation === "Added" && !target) {
      spans.push({ type: "insert", text: change.revised_text, change });
      return;
    }

    const nextSpans: CorrectionSpan[] = [];
    let applied = false;

    spans.forEach((span) => {
      if (span.type !== "text" || applied) {
        nextSpans.push(span);
        return;
      }

      const index = span.text.indexOf(target);
      if (index < 0) {
        nextSpans.push(span);
        return;
      }

      const before = span.text.slice(0, index);
      const after = span.text.slice(index + target.length);
      if (before) nextSpans.push({ type: "text", text: before });
      if (change.operation === "Deleted") nextSpans.push({ type: "delete", text: target, change });
      if (change.operation === "Replaced") {
        nextSpans.push({ type: "delete", text: target, change });
        if (change.revised_text) nextSpans.push({ type: "insert", text: change.revised_text, change });
      }
      if (change.operation === "Added") {
        nextSpans.push({ type: "text", text: target });
        if (change.revised_text) nextSpans.push({ type: "insert", text: formatAddedText(change.revised_text), change });
      }
      if (after) nextSpans.push({ type: "text", text: after });
      applied = true;
    });

    spans = applied ? nextSpans : spans;
  });

  return spans;
}

function formatAddedText(value: string) {
  if (!value) return value;
  return /^[\s.,;:!?]/.test(value) ? value : ` ${value}`;
}

function getCorrectionItems(result: IELTSTask2ReviewResult | null): WritingCorrectionItem[] {
  if (!result) return [];
  const provided = result.writing_correction?.changes ?? [];
  if (provided.length) return provided.map((item, index) => ({ ...item, change_id: item.change_id || `c${index + 1}` }));

  return result.paragraphs.flatMap((paragraph) => paragraph.sentences.flatMap((sentence) => sentence.issues.slice(0, 2).map((issue, index) => issueToCorrection(issue, paragraph.paragraph_id, sentence.sentence_id, `${sentence.sentence_id}_${index + 1}`)))).slice(0, 30);
}

function issueToCorrection(issue: SentenceIssue, paragraphId: string, sentenceId: string, changeId: string): WritingCorrectionItem {
  return { change_id: changeId, paragraph_id: paragraphId, sentence_id: sentenceId, operation: issue.suggested_text ? "Replaced" : "Deleted", category: issue.issue_type, severity: issue.severity, original_text: issue.original_text, revised_text: issue.suggested_text, explanation_cn: issue.explanation_cn || issue.band_impact || "这处修改可以提升表达准确度。" };
}

function downloadInteractiveHtml(result: IELTSTask2ReviewResult, question: string) {
  const changes = getCorrectionItems(result);
  const html = buildOfflineHtml(result, question, changes);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `ielts-writing-report-band-${formatBand(result.estimated_overall_band ?? result.overall_band)}.html`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function buildOfflineHtml(result: IELTSTask2ReviewResult, question: string, changes: WritingCorrectionItem[]) {
  const score = formatBand(result.estimated_overall_band ?? result.overall_band);
  const model = result.band8_model_essay;
  const essayHtml = result.paragraphs.map((paragraph) => `<p>${paragraph.sentences.map((sentence) => escapeHtml(sentence.original_sentence)).join(" ")}</p>`).join("");
  const changeHtml = changes.map((item) => `<button class="change" data-id="${escapeHtml(item.change_id)}"><strong>${escapeHtml(item.operation)}</strong><span>${escapeHtml(item.operation === "Added" ? item.revised_text : item.original_text)}</span><small>${escapeHtml(item.explanation_cn)}</small></button>`).join("");
  const scoreHtml = rubricCards.map((card) => {
    const band = result.band_scores[card.key];
    return `<section class="score"><h3>${escapeHtml(card.title)} <b>${escapeHtml(formatBand(band.score))}</b></h3><p>${escapeHtml(band.comment)}</p></section>`;
  }).join("");
  const modelHtml = splitEssayParagraphs(model?.band8_essay || result.final_rewritten_essay.band8_version).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>IELTS Writing Report</title><style>:root{color-scheme:light dark;--bg:#f7f8fb;--card:#ffffff;--soft:#f1f5f9;--text:#172033;--muted:#657184;--border:#d8dee8;--primary:#2563eb;--primary-soft:#eaf1ff;--success:#16875a;--danger:#c2413d;--shadow:0 18px 50px rgba(15,23,42,.08)}@media(prefers-color-scheme:dark){:root{--bg:#0d1117;--card:#121821;--soft:#182130;--text:#edf3fb;--muted:#9aa8ba;--border:#2b3545;--primary:#7aa7ff;--primary-soft:#17243a;--success:#6ee7b7;--danger:#fca5a5;--shadow:0 18px 50px rgba(0,0,0,.28)}}body{margin:0;background:var(--bg);color:var(--text);font-family:Arial,"Microsoft YaHei",sans-serif}.wrap{max-width:1100px;margin:0 auto;padding:24px}.top{display:flex;justify-content:center;gap:12px;align-items:center;padding:20px;background:linear-gradient(135deg,var(--primary-soft),var(--card));border:1px solid var(--border);border-radius:18px;box-shadow:var(--shadow)}.score-pill{min-width:120px;border:1px solid color-mix(in srgb,var(--primary) 55%,var(--border));border-radius:999px;background:var(--card);padding:8px 32px;text-align:center;font-size:28px;font-weight:800;color:var(--primary)}.bar{margin-top:14px;background:linear-gradient(90deg,var(--primary),color-mix(in srgb,var(--primary) 70%,var(--success)));color:#fff;padding:16px 22px;font-size:22px;font-weight:800}.panel{background:var(--card);border:1px solid var(--border);padding:22px}.grid{display:grid;grid-template-columns:1fr 340px}.essay{line-height:1.9;font-size:16px}.side{border-left:1px solid var(--border);background:var(--soft);padding:14px;max-height:560px;overflow:auto}.change{display:block;width:100%;text-align:left;margin:0 0 8px;padding:10px;border:1px solid var(--border);border-radius:8px;background:var(--card);color:var(--text)}.change.active{border-color:var(--primary);background:var(--primary-soft)}.change strong{display:inline-block;margin-bottom:6px;color:var(--primary)}.change span,.change small{display:block}.change small{margin-top:6px;color:var(--muted)}.scores{display:grid;grid-template-columns:1fr 1fr;gap:16px}.score{background:var(--card);border:1px solid var(--border);padding:18px}.score h3{display:flex;justify-content:space-between}.score b{color:var(--primary)}.model{line-height:1.9}.model p{margin:0 0 16px}.muted{color:var(--muted)}@media(max-width:800px){.grid,.scores{grid-template-columns:1fr}.side{border-left:0;border-top:1px solid var(--border)}}</style></head><body><main class="wrap"><section class="top"><span class="muted">Overall score:</span><span class="score-pill">${escapeHtml(score)}</span></section><div class="bar">Questions</div><section class="panel">${escapeHtml(question)}</section><div class="bar">Answer & Correction</div><section class="panel grid"><article class="essay">${essayHtml}<p class="muted">(${escapeHtml(String(result.word_count))} words)</p></article><aside class="side">${changeHtml}</aside></section><div class="bar">Evaluation</div><section class="panel scores">${scoreHtml}</section><div class="bar">Band 8 Model Essay</div><section class="panel"><p class="muted">${escapeHtml(model?.idea_assessment_cn || "")}</p><article class="model">${modelHtml}</article></section></main><script>document.querySelectorAll(".change").forEach(function(btn){btn.addEventListener("click",function(){document.querySelectorAll(".change").forEach(function(x){x.classList.remove("active")});btn.classList.add("active")})});</script></body></html>`;
}

function SectionBar({ title }: { title: string }) {
  return <div className="flex items-center justify-between border-y border-[var(--border)] bg-[linear-gradient(90deg,var(--primary),color-mix(in_srgb,var(--primary)_72%,var(--success)))] px-5 py-4 text-xl font-semibold text-white sm:px-6">{title}<span className="text-sm opacity-80">⌃</span></div>;
}

function ProcessItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm font-medium text-[var(--text)]"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]">{icon}</div>{text}</div>;
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4"><div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-soft)]">{label}</div><div className="mt-2 text-lg font-semibold text-[var(--text)]">{value}</div></div>;
}

function ScoreCard({ title, score, comment }: { title: string; score: number; comment: string }) {
  return <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card-soft)] p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-base font-semibold text-[var(--text)]">{title}</p><p className="mt-1 text-xs text-[var(--text-soft)]">IELTS rubric</p></div><div className="rounded-[var(--radius-md)] bg-[var(--primary)] px-6 py-3 text-xl font-semibold text-white">{formatBand(score)}</div></div><p className="mt-4 max-h-36 overflow-y-auto rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 text-sm leading-7 text-[var(--text-soft)]">{comment}</p></div>;
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-soft)]">{label}</p><p className="mt-2 text-sm font-semibold text-[var(--text)]">{value}</p></div>;
}

function ListBlock({ title, items, tone = "default" }: { title: string; items: string[]; tone?: "default" | "success" | "danger" }) {
  const iconColor = tone === "success" ? "text-[var(--success)]" : tone === "danger" ? "text-[var(--danger)]" : "text-[var(--primary)]";
  return <div><h3 className="mb-2 text-sm font-semibold text-[var(--text)]">{title}</h3><ul className="space-y-2">{items.length > 0 ? items.map((item, index) => <li key={index} className="flex gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-3 text-sm leading-6 text-[var(--text-soft)]"><CheckCircle2 size={15} className={`mt-0.5 shrink-0 ${iconColor}`} /><span>{item}</span></li>) : <li className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-3 text-sm text-[var(--text-soft)]">暂无</li>}</ul></div>;
}

function PriorityItem({ label, value, featured = false }: { label: string; value: string; featured?: boolean }) {
  return <div className={`rounded-[var(--radius-md)] border p-4 text-sm leading-7 ${featured ? "border-[var(--primary)]/25 bg-[var(--primary-soft)] text-[var(--text)]" : "border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text-soft)]"}`}><span className="font-semibold text-[var(--text)]">{label}:</span> {value}</div>;
}

function getOperationVariant(operation: WritingCorrectionItem["operation"]) {
  if (operation === "Added") return "success";
  if (operation === "Deleted") return "danger";
  return "warning";
}

function formatBand(value: number | undefined) {
  return typeof value === "number" ? value.toFixed(1) : "-";
}

function splitEssayParagraphs(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return [];
  const byBlankLines = trimmed.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);
  if (byBlankLines.length > 1) return byBlankLines;
  const lines = trimmed.split(/\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length > 1) return lines;
  return [trimmed];
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
