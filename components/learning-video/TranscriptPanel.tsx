"use client";

import { useEffect, useMemo, useRef } from "react";
import { Badge } from "@/components/ui-v2/badge";
import TranscriptItem from "./TranscriptItem";
import TranscriptSearch from "./TranscriptSearch";
import type { TranscriptCue } from "./vtt";

type Props = {
  cues: TranscriptCue[];
  activeCueId: string | null;
  searchTerm: string;
  loading: boolean;
  error: string | null;
  onSearchChange: (value: string) => void;
  onSelectCue: (cue: TranscriptCue) => void;
};

export default function TranscriptPanel({ cues, activeCueId, searchTerm, loading, error, onSearchChange, onSelectCue }: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const keyword = searchTerm.trim().toLowerCase();

  const filteredCues = useMemo(() => {
    if (!keyword) return cues;
    return cues.filter((cue) => cue.text.toLowerCase().includes(keyword));
  }, [cues, keyword]);

  useEffect(() => {
    if (!activeCueId || keyword) return;

    const panel = panelRef.current;
    const activeNode = panel?.querySelector<HTMLElement>(`[data-transcript-cue-id="${activeCueId}"]`);

    if (!panel || !activeNode) return;

    const panelRect = panel.getBoundingClientRect();
    const activeRect = activeNode.getBoundingClientRect();
    const activeOffsetTop = activeRect.top - panelRect.top;
    const fixedAnchor = panel.clientHeight * 0.36;
    const bottomLimit = panel.clientHeight * 0.82;

    if (activeOffsetTop < 0) {
      panel.scrollTop += activeOffsetTop;
      return;
    }

    if (activeOffsetTop > bottomLimit) {
      panel.scrollTop += activeOffsetTop - fixedAnchor;
      return;
    }

    if (activeOffsetTop > fixedAnchor) {
      panel.scrollTop += activeOffsetTop - fixedAnchor;
    }
  }, [activeCueId, keyword]);

  return (
    <section className="flex min-h-[420px] flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)] lg:h-[calc(100vh-180px)]">
      <div className="border-b border-[var(--border)] p-4 sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[var(--text)]">Transcript</h2>
            <p className="mt-1 text-sm text-[var(--text-soft)]">Click any sentence to jump to that moment.</p>
          </div>
          <Badge variant="secondary">{filteredCues.length} lines</Badge>
        </div>
        <TranscriptSearch value={searchTerm} onChange={onSearchChange} />
      </div>

      <div ref={panelRef} className="flex-1 overflow-y-auto p-3 sm:p-4">
        {loading ? <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-5 text-center text-sm text-[var(--text-soft)]">字幕加载中...</div> : null}
        {error ? <div className="rounded-[var(--radius-md)] border border-[var(--danger)]/25 bg-[var(--danger-soft)] p-5 text-center text-sm text-[var(--danger)]">{error}</div> : null}
        {!loading && !error && filteredCues.length === 0 ? <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-5 text-center text-sm text-[var(--text-soft)]">没有找到匹配的字幕内容。</div> : null}
        {!loading && !error && filteredCues.length > 0 ? (
          <div className="space-y-1 pb-[36%]">
            {filteredCues.map((cue) => <TranscriptItem key={cue.id} cue={cue} active={cue.id === activeCueId} searchTerm={searchTerm} onSelect={onSelectCue} />)}
          </div>
        ) : null}
      </div>
    </section>
  );
}
